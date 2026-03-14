'use server'

import { createServiceClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import { requireAdmin } from '@/lib/actions/guards'

export async function createInvestorAction(formData: FormData) {
  const authz = await requireAdmin()
  if ('error' in authz) return authz

  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const phone = (formData.get('phone') as string) || null
  const invested_amount = parseFloat(formData.get('invested_amount') as string)
  const fixed_return_value = parseFloat(formData.get('fixed_return_value') as string)
  const fixed_return_percentage = parseFloat(formData.get('fixed_return_percentage') as string)

  if (!name || !email || isNaN(invested_amount)) {
    return { error: 'Missing required fields' }
  }

  const supabase = await createServiceClient()

  // 1. Create Supabase Auth user (auto-confirm, no password — they set via magic link)
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
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
    phone,
    invested_amount,
    fixed_return_value,
    fixed_return_percentage,
  })

  if (profileError) {
    // Roll back auth user if profile insert fails
    await supabase.auth.admin.deleteUser(userId)
    return { error: profileError.message }
  }

  // 3. Generate a password-reset link so the investor can set their password
  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: 'recovery',
    email,
  })

  if (!linkError && linkData?.properties?.action_link) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: `RK Trading <noreply@${process.env.RESEND_DOMAIN ?? 'rktrading.in'}>`,
        to: email,
        subject: 'Welcome to RK Trading — Set Your Password',
        html: `
          <div style="font-family:sans-serif;max-width:560px;margin:auto;background:#111b2e;color:#e8eaf0;padding:32px;border-radius:12px;border:1px solid rgba(212,175,55,0.3)">
            <h1 style="color:#d4af37;margin-top:0">Welcome, ${name}!</h1>
            <p>Your investor account has been created. Click the button below to set your password and access your dashboard.</p>
            <a href="${linkData.properties.action_link}"
               style="display:inline-block;margin-top:16px;padding:12px 28px;background:#d4af37;color:#0a0f1e;font-weight:700;text-decoration:none;border-radius:6px;">
              Set Password &amp; Login
            </a>
            <p style="margin-top:24px;font-size:12px;color:#7a8aa0">This link expires in 24 hours. If you didn't expect this email, please ignore it.</p>
          </div>
        `,
      })
    } catch {
      // Non-fatal — account was created, email delivery failed silently
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

export async function approveRegistrationRequestAction(formData: FormData) {
  const authz = await requireAdmin()
  if ('error' in authz) return authz

  const requestId = formData.get('requestId') as string
  if (!requestId) return { error: 'Missing request ID' }

  const supabase = await createServiceClient()

  const { data: adminData } = await supabase.auth.getUser()

  const { data: request, error: requestError } = await supabase
    .from('registration_requests')
    .select('id, name, email, phone, invested_amount, fixed_return_value, fixed_return_percentage, status')
    .eq('id', requestId)
    .single()

  if (requestError || !request) {
    return { error: requestError?.message ?? 'Registration request not found' }
  }

  if (request.status !== 'pending') {
    return { error: 'This request is no longer pending' }
  }

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: request.email,
    email_confirm: true,
  })

  if (authError || !authData.user) {
    return { error: authError?.message ?? 'Failed to create auth user' }
  }

  const userId = authData.user.id

  const { error: profileError } = await supabase.from('investors').insert({
    id: userId,
    name: request.name,
    email: request.email,
    phone: request.phone,
    invested_amount: request.invested_amount,
    fixed_return_value: request.fixed_return_value,
    fixed_return_percentage: request.fixed_return_percentage,
    is_active: true,
  })

  if (profileError) {
    await supabase.auth.admin.deleteUser(userId)
    return { error: profileError.message }
  }

  const { error: markError } = await supabase
    .from('registration_requests')
    .update({
      status: 'approved',
      reviewed_at: new Date().toISOString(),
      reviewed_by: adminData.user?.id ?? null,
      investor_id: userId,
    })
    .eq('id', request.id)

  if (markError) {
    return { error: markError.message }
  }

  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: 'recovery',
    email: request.email,
  })

  if (!linkError && linkData?.properties?.action_link) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: `RK Trading <noreply@${process.env.RESEND_DOMAIN ?? 'rktrading.in'}>`,
        to: request.email,
        subject: 'Your registration is approved - Set your password',
        html: `
          <div style="font-family:sans-serif;max-width:560px;margin:auto;background:#111b2e;color:#e8eaf0;padding:32px;border-radius:12px;border:1px solid rgba(212,175,55,0.3)">
            <h1 style="color:#d4af37;margin-top:0">Hi ${request.name},</h1>
            <p>Your investor registration has been approved by the admin.</p>
            <p>Click below to set your password and access your dashboard.</p>
            <a href="${linkData.properties.action_link}"
               style="display:inline-block;margin-top:16px;padding:12px 28px;background:#d4af37;color:#0a0f1e;font-weight:700;text-decoration:none;border-radius:6px;">
              Set Password &amp; Login
            </a>
          </div>
        `,
      })
    } catch {
      // Non-fatal: account is approved even if email sending fails.
    }
  }

  return { success: true }
}
