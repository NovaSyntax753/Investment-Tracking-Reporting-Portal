'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import { requireAdmin } from '@/lib/actions/guards'

function normalizePhone(input: string | null | undefined) {
  const raw = (input || '').trim()
  if (!raw) return null

  const cleaned = raw.replace(/(?!^\+)\D/g, '')
  return cleaned || null
}

export async function createInvestorAction(formData: FormData) {
  const authz = await requireAdmin()
  if ('error' in authz) return authz

  const name = formData.get('name') as string
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const investorCode = (formData.get('investor_code') as string)?.trim().toUpperCase()
  const password = (formData.get('password') as string) || ''
  const phone = normalizePhone(formData.get('phone') as string)
  const invested_amount = parseFloat(formData.get('invested_amount') as string)
  const prior_released_amount = parseFloat((formData.get('prior_released_amount') as string) || '0')
  const accountCreatedOnRaw = (formData.get('account_created_on') as string | null)?.trim() || ''
  const accountCreatedOn = /^\d{4}-\d{2}-\d{2}$/.test(accountCreatedOnRaw)
    ? `${accountCreatedOnRaw}T00:00:00.000Z`
    : new Date().toISOString()
  const fixed_return_value = parseFloat(formData.get('fixed_return_value') as string)
  const fixed_return_percentage = parseFloat(formData.get('fixed_return_percentage') as string)

  if (!name || !email || !investorCode || !password || !phone || isNaN(invested_amount)) {
    return { error: 'Missing required fields' }
  }

  if (!/^[A-Z0-9_-]{4,20}$/.test(investorCode)) {
    return { error: 'Investor ID must be 4-20 characters and use only letters, numbers, underscore, or hyphen.' }
  }

  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters.' }
  }

  const digitsOnlyLength = phone.replace(/\D/g, '').length
  if (digitsOnlyLength < 8 || digitsOnlyLength > 15) {
    return { error: 'Enter a valid mobile number' }
  }

  const supabase = await createServiceClient()

  const { data: existingPhoneInvestor } = await supabase
    .from('investors')
    .select('id')
    .eq('phone', phone)
    .maybeSingle()

  if (existingPhoneInvestor) {
    return { error: 'This mobile number is already registered with another investor.' }
  }

  const { data: existingCodeInvestor } = await supabase
    .from('investors')
    .select('id')
    .eq('investor_code', investorCode)
    .maybeSingle()

  if (existingCodeInvestor) {
    return { error: 'This Investor ID is already in use.' }
  }

  // 1. Create Supabase Auth user with admin-set password.
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
    password,
  })

  if (authError) {
    return { error: authError.message }
  }

  const userId = authData.user.id

  // 2. Insert investor profile
  const { error: profileError } = await supabase.from('investors').insert({
    id: userId,
    name,
    email,
    investor_code: investorCode,
    phone,
    created_at: accountCreatedOn,
    invested_amount,
    prior_released_amount: Number.isFinite(prior_released_amount) ? prior_released_amount : 0,
    released_amount: 0,
    unreleased_amount: 0,
    fixed_return_value,
    fixed_return_percentage,
    is_active: true,
  })

  if (profileError) {
    // Roll back auth user if profile insert fails
    await supabase.auth.admin.deleteUser(userId)
    if (profileError.code === '23505' && /phone/i.test(profileError.message)) {
      return { error: 'This mobile number is already used. Please use a different number.' }
    }
    return { error: profileError.message }
  }

  // 3. Send credential email (non-fatal if email service is unavailable)
  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: `RK Trading <noreply@${process.env.RESEND_DOMAIN ?? 'rktrading.in'}>`,
        to: email,
        subject: 'Your RK Trading Investor Credentials',
        html: `
          <div style="font-family:sans-serif;max-width:560px;margin:auto;background:#111b2e;color:#e8eaf0;padding:32px;border-radius:12px;border:1px solid rgba(212,175,55,0.3)">
            <h1 style="color:#d4af37;margin-top:0">Welcome, ${name}!</h1>
            <p>Your account has been created by admin.</p>
            <p><strong>Investor ID:</strong> ${investorCode}</p>
            <p><strong>Login Email:</strong> ${email}</p>
            <p><strong>Password:</strong> ${password}</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/login"
               style="display:inline-block;margin-top:16px;padding:12px 28px;background:#d4af37;color:#0a0f1e;font-weight:700;text-decoration:none;border-radius:6px;">
              Login to Dashboard
            </a>
            <p style="margin-top:24px;font-size:12px;color:#7a8aa0">Please change your password after first login.</p>
          </div>
        `,
      })
    } catch {
      // Non-fatal: account creation succeeded even if email delivery fails.
    }
  }

  return { success: true }
}

export async function deleteInvestorAction(formData: FormData) {
  const authz = await requireAdmin()
  if ('error' in authz) return authz

  const investorId = formData.get('investorId') as string
  if (!investorId) return { error: 'Missing investor ID' }

  const supabase = await createServiceClient()

  // Delete from auth (cascades to investors table via FK)
  const { error } = await supabase.auth.admin.deleteUser(investorId)
  if (error) return { error: error.message }

  return { success: true }
}

export async function addInvestorInvestmentAction(formData: FormData) {
  const authz = await requireAdmin()
  if ('error' in authz) return authz

  const investorId = (formData.get('investor_id') as string)?.trim()
  const amountToAdd = Number(formData.get('amount'))

  if (!investorId || !Number.isFinite(amountToAdd) || amountToAdd <= 0) {
    return { error: 'Please enter a valid amount to add.' }
  }

  const supabase = await createServiceClient()
  const { data: investor, error: fetchError } = await supabase
    .from('investors')
    .select('invested_amount')
    .eq('id', investorId)
    .maybeSingle()

  if (fetchError) return { error: fetchError.message }
  if (!investor) return { error: 'Investor not found' }

  const currentInvested = Number(investor.invested_amount ?? 0)
  const nextInvested = currentInvested + amountToAdd

  const { error: updateError } = await supabase
    .from('investors')
    .update({ invested_amount: nextInvested })
    .eq('id', investorId)

  if (updateError) return { error: updateError.message }

  revalidatePath('/admin/investors')
  revalidatePath('/admin')

  return { success: true, invested_amount: nextInvested }
}
