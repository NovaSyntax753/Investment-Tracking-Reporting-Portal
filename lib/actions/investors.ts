'use server'

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
  const phone = normalizePhone(formData.get('phone') as string)
  const invested_amount = parseFloat(formData.get('invested_amount') as string)
  const fixed_return_value = parseFloat(formData.get('fixed_return_value') as string)
  const fixed_return_percentage = parseFloat(formData.get('fixed_return_percentage') as string)

  if (!name || !email || !phone || isNaN(invested_amount)) {
    return { error: 'Missing required fields' }
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
    if (profileError.code === '23505' && /phone/i.test(profileError.message)) {
      return { error: 'This mobile number is already used. Please use a different number.' }
    }
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
    .select('id, name, email, phone, invested_amount, fixed_return_value, fixed_return_percentage, status, temp_password_hash')
    .eq('id', requestId)
    .single()

  if (requestError || !request) {
    return { error: requestError?.message ?? 'Registration request not found' }
  }

  if (request.status !== 'pending') {
    return { error: 'This request is no longer pending' }
  }

  if (!request.temp_password_hash) {
    return { error: 'Missing secure password hash for this request.' }
  }

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: request.email,
    email_confirm: false,
    password_hash: request.temp_password_hash,
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
    is_active: false,
  })

  if (profileError) {
    await supabase.auth.admin.deleteUser(userId)
    if (profileError.code === '23505' && /phone/i.test(profileError.message)) {
      return { error: 'This mobile number is already used. Please review the request.' }
    }
    return { error: profileError.message }
  }

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

  const { error: markError } = await supabase
    .from('registration_requests')
    .update({
      status: 'approved',
      reviewed_at: new Date().toISOString(),
      reviewed_by: adminData.user?.id ?? null,
      investor_id: userId,
      temp_password: null,
      temp_password_hash: null,
      verification_sent_at: new Date().toISOString(),
      verification_expires_at: expiresAt,
    })
    .eq('id', request.id)

  if (markError) {
    return { error: markError.message }
  }

  const { error: resendError } = await supabase.auth.resend({
    type: 'signup',
    email: request.email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/login`,
    },
  })

  if (resendError) {
    return { success: true, emailSent: false, emailError: resendError.message }
  }

  return { success: true, emailSent: true, emailError: null }
}

async function findAuthUserIdByEmail(email: string) {
  const supabase = await createServiceClient()
  let page = 1

  while (page <= 10) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 })
    if (error) {
      return { userId: null, error: error.message }
    }

    const found = data.users.find((u) => (u.email || '').toLowerCase() === email.toLowerCase())
    if (found) {
      return { userId: found.id, error: null }
    }

    if (data.users.length < 200) break
    page += 1
  }

  return { userId: null, error: null }
}

export async function rejectRegistrationRequestAction(formData: FormData) {
  const authz = await requireAdmin()
  if ('error' in authz) return authz

  const requestId = formData.get('requestId') as string
  if (!requestId) return { error: 'Missing request ID' }

  const supabase = await createServiceClient()
  const { data: adminData } = await supabase.auth.getUser()

  const { data: request, error: requestError } = await supabase
    .from('registration_requests')
    .select('id, name, email, status')
    .eq('id', requestId)
    .single()

  if (requestError || !request) {
    return { error: requestError?.message ?? 'Registration request not found' }
  }

  if (request.status !== 'pending') {
    return { error: 'This request is no longer pending' }
  }

  const { error: rejectError } = await supabase
    .from('registration_requests')
    .update({
      status: 'rejected',
      reviewed_at: new Date().toISOString(),
      reviewed_by: adminData.user?.id ?? null,
      investor_id: null,
      verification_sent_at: null,
      verification_expires_at: null,
    })
    .eq('id', request.id)

  if (rejectError) return { error: rejectError.message }

  const userLookup = await findAuthUserIdByEmail(request.email)
  if (userLookup.userId) {
    const { data: userData } = await supabase.auth.admin.getUserById(userLookup.userId)
    if (userData.user && !userData.user.email_confirmed_at) {
      await supabase.auth.admin.deleteUser(userLookup.userId)
    }
  }

  if (!process.env.RESEND_API_KEY) {
    return { success: true, emailSent: false, emailError: 'RESEND_API_KEY is not configured.' }
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const { error: sendError } = await resend.emails.send({
      from: `RK Trading <noreply@${process.env.RESEND_DOMAIN ?? 'rktrading.in'}>`,
      to: request.email,
      subject: 'Your registration request was not approved',
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:auto;background:#111b2e;color:#e8eaf0;padding:32px;border-radius:12px;border:1px solid rgba(212,175,55,0.3)">
          <h1 style="color:#d4af37;margin-top:0">Hi ${request.name},</h1>
          <p>Your account request was not approved.</p>
          <p>If you believe this is a mistake, please contact admin for assistance.</p>
        </div>
      `,
    })

    if (sendError) {
      return { success: true, emailSent: false, emailError: sendError.message }
    }
  } catch (e) {
    return { success: true, emailSent: false, emailError: e instanceof Error ? e.message : 'Failed to send rejection email.' }
  }

  return { success: true, emailSent: true, emailError: null }
}
