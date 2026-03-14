'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import { hash } from 'bcryptjs'

const VERIFICATION_WINDOW_HOURS = 24

function normalizePhone(input: string | null | undefined) {
  const raw = (input || '').trim()
  if (!raw) return null

  // Keep optional leading plus and digits only for stable uniqueness checks.
  const cleaned = raw.replace(/(?!^\+)\D/g, '')
  return cleaned || null
}

async function findAuthUserIdByEmail(email: string) {
  const service = await createServiceClient()
  let page = 1

  while (page <= 10) {
    const { data, error } = await service.auth.admin.listUsers({ page, perPage: 200 })
    if (error) {
      return { userId: null, error: error.message }
    }

    const found = data.users.find((u) => (u.email || '').toLowerCase() === email)
    if (found) {
      return { userId: found.id, error: null }
    }

    if (data.users.length < 200) break
    page += 1
  }

  return { userId: null, error: null }
}

export async function loginAction(formData: FormData) {
  const email = ((formData.get('email') as string) || '').trim().toLowerCase()
  const password = (formData.get('password') as string) || ''

  const supabase = await createClient()
  let { error, data } = await supabase.auth.signInWithPassword({ email, password })

  // Development convenience: allow bootstrapping admin login from env credentials.
  // If admin user does not exist yet, create it. If it exists, enforce this password.
  const isAdminEnvLogin =
    !!process.env.ADMIN_EMAIL &&
    !!process.env.ADMIN_PASSWORD &&
    email === process.env.ADMIN_EMAIL.toLowerCase() &&
    password === process.env.ADMIN_PASSWORD

  if (error && isAdminEnvLogin) {
    const service = await createServiceClient()

    // First try create (works when admin user doesn't exist).
    const { data: createdUser, error: createError } = await service.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    // If already exists, locate and reset password to ADMIN_PASSWORD.
    if (createError && !/already registered/i.test(createError.message)) {
      return { error: createError.message }
    }

    if (createError && /already registered/i.test(createError.message)) {
      let page = 1
      let foundUserId: string | null = null

      while (page <= 10 && !foundUserId) {
        const { data: listData, error: listError } = await service.auth.admin.listUsers({ page, perPage: 200 })
        if (listError) return { error: listError.message }
        const matched = listData.users.find((u) => (u.email || '').toLowerCase() === email)
        if (matched) foundUserId = matched.id
        if (listData.users.length < 200) break
        page += 1
      }

      if (!foundUserId) {
        return { error: 'Admin account exists but could not be located for password sync.' }
      }

      const { error: updateError } = await service.auth.admin.updateUserById(foundUserId, {
        password,
        email_confirm: true,
      })
      if (updateError) return { error: updateError.message }
    } else if (createdUser?.user?.id) {
      // Keep type narrowing explicit and future-safe.
      void createdUser.user.id
    }

    // Retry sign-in after admin bootstrap/sync.
    const retry = await supabase.auth.signInWithPassword({ email, password })
    error = retry.error
    data = retry.data
  }

  if (error) {
    const service = await createServiceClient()

    const { data: pendingRequest } = await service
      .from('registration_requests')
      .select('status, verification_expires_at')
      .eq('email', email)
      .maybeSingle()

    if (pendingRequest?.status === 'pending') {
      return { error: 'Your registration is pending admin approval. Please wait for approval email.' }
    }

    if (pendingRequest?.status === 'rejected') {
      return { error: 'Your registration request was not approved. Please contact admin.' }
    }

    if (pendingRequest?.status === 'approved') {
      const expired =
        !!pendingRequest.verification_expires_at &&
        Date.now() > new Date(pendingRequest.verification_expires_at).getTime()

      if (expired) {
        return { error: 'Verification link expired. Use Resend Verification Link on login page.' }
      }

      return { error: 'Your account is approved. Please verify your email from the approval mail, then continue login.' }
    }

    return { error: 'Invalid credentials. Check email/password or register first.' }
  }

  const service = await createServiceClient()
  const { data: requestRow } = await service
    .from('registration_requests')
    .select('status, verification_expires_at')
    .eq('email', email)
    .maybeSingle()

  if (requestRow?.status === 'pending') {
    await supabase.auth.signOut()
    return { error: 'Your account is pending admin approval. Login is blocked until approval.' }
  }

  if (requestRow?.status === 'rejected') {
    await supabase.auth.signOut()
    return { error: 'Your registration request was not approved. Login is blocked.' }
  }

  if (requestRow?.status === 'approved' && !data.user?.email_confirmed_at) {
    await supabase.auth.signOut()
    const expired =
      !!requestRow.verification_expires_at &&
      Date.now() > new Date(requestRow.verification_expires_at).getTime()

    if (expired) {
      return { error: 'Verification link expired. Use Resend Verification Link to continue.' }
    }

    return { error: 'Please verify your email first. Then login will be enabled.' }
  }

  if (data.user?.email_confirmed_at && data.user?.id) {
    await service
      .from('investors')
      .update({ is_active: true })
      .eq('id', data.user.id)
      .eq('is_active', false)

    await service
      .from('registration_requests')
      .update({ status: 'active', verified_at: new Date().toISOString() })
      .eq('email', email)
      .eq('status', 'approved')
  }

  revalidatePath('/', 'layout')

  const isAdmin = data.user?.email === process.env.ADMIN_EMAIL
  redirect(isAdmin ? '/admin' : '/dashboard')
}

export async function logoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

export async function submitRegistrationRequestAction(formData: FormData) {
  const name = (formData.get('name') as string)?.trim()
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const phone = normalizePhone((formData.get('phone') as string) || '')
  const password = (formData.get('password') as string)?.trim()
  const investedAmount = Number(formData.get('invested_amount') || 0)
  const fixedReturnValue = Number(formData.get('fixed_return_value') || 0)
  const fixedReturnPercentage = Number(formData.get('fixed_return_percentage') || 0)

  if (!name || !email) {
    return { error: 'Name and email are required' }
  }

  if (!password || password.length < 8) {
    return { error: 'Password must be at least 8 characters' }
  }

  if (!phone) {
    return { error: 'Mobile number is required' }
  }

  const digitsOnlyLength = phone.replace(/\D/g, '').length
  if (digitsOnlyLength < 8 || digitsOnlyLength > 15) {
    return { error: 'Enter a valid mobile number' }
  }

  const passwordHash = await hash(password, 12)

  if (!Number.isFinite(investedAmount) || investedAmount < 0) {
    return { error: 'Invested amount must be 0 or more' }
  }

  if (!Number.isFinite(fixedReturnValue) || fixedReturnValue < 0) {
    return { error: 'Fixed return value must be 0 or more' }
  }

  if (!Number.isFinite(fixedReturnPercentage) || fixedReturnPercentage < 0 || fixedReturnPercentage > 100) {
    return { error: 'Return percentage must be between 0 and 100' }
  }

  const supabase = await createServiceClient()

  const { data: existingInvestor } = await supabase
    .from('investors')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  if (existingInvestor) {
    return { error: 'This email is already registered. Please log in.' }
  }

  const { data: existingInvestorPhone } = await supabase
    .from('investors')
    .select('id')
    .eq('phone', phone)
    .maybeSingle()

  if (existingInvestorPhone) {
    return { error: 'This mobile number is already registered with another investor.' }
  }

  const { data: existingRequest } = await supabase
    .from('registration_requests')
    .select('id, status')
    .eq('email', email)
    .maybeSingle()

  if (existingRequest && existingRequest.status === 'pending') {
    return { error: 'Registration request already submitted and pending admin approval.' }
  }

  if (existingRequest && existingRequest.status === 'rejected') {
    return { error: 'Your previous request was rejected. Contact admin to submit again.' }
  }

  if (existingRequest && (existingRequest.status === 'approved' || existingRequest.status === 'active')) {
    return { error: 'This email is already approved. Please verify email and login.' }
  }

  const { data: existingPhoneRequest } = await supabase
    .from('registration_requests')
    .select('id, email, status')
    .eq('phone', phone)
    .in('status', ['pending', 'approved', 'active'])
    .maybeSingle()

  if (existingPhoneRequest && existingPhoneRequest.email !== email) {
    return { error: 'This mobile number is already used in another account request.' }
  }

  const { error } = await supabase.from('registration_requests').upsert(
    {
      name,
      email,
      phone,
      invested_amount: investedAmount,
      fixed_return_value: fixedReturnValue,
      fixed_return_percentage: fixedReturnPercentage,
      temp_password: null,
      temp_password_hash: passwordHash,
      status: 'pending',
      reviewed_at: null,
      reviewed_by: null,
      investor_id: null,
      verified_at: null,
      verification_sent_at: null,
      verification_expires_at: null,
    },
    { onConflict: 'email' },
  )

  if (error) {
    if (error.code === '23505' && /phone/i.test(error.message)) {
      return { error: 'This mobile number is already used. Please use a different number.' }
    }
    return { error: error.message }
  }

  revalidatePath('/admin/investors')

  const adminEmail = process.env.ADMIN_EMAIL
  if (adminEmail) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: `RK Trading Registration <noreply@${process.env.RESEND_DOMAIN ?? 'rktrading.in'}>`,
        to: adminEmail,
        subject: `New Investor Registration Request - ${name}`,
        html: `
          <div style="font-family:sans-serif;max-width:560px;margin:auto;background:#111b2e;color:#e8eaf0;padding:32px;border-radius:12px;border:1px solid rgba(212,175,55,0.3)">
            <h2 style="color:#d4af37;margin-top:0">New Registration Request</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> ${phone ?? 'N/A'}</p>
            <p><strong>Invested Amount:</strong> ${investedAmount}</p>
            <p><strong>Fixed Return:</strong> ${fixedReturnValue} (${fixedReturnPercentage}%)</p>
            <p style="margin-top:16px">Review and approve from Admin > Investors.</p>
          </div>
        `,
      })
    } catch {
      // Non-fatal: request is saved even if email fails.
    }
  }

  return { success: true }
}

export async function resendVerificationLinkAction(formData: FormData) {
  const email = ((formData.get('email') as string) || '').trim().toLowerCase()
  if (!email) {
    return { error: 'Enter your email first.' }
  }

  const service = await createServiceClient()
  const { data: request } = await service
    .from('registration_requests')
    .select('name, status')
    .eq('email', email)
    .maybeSingle()

  if (!request) {
    return { error: 'No registration found for this email.' }
  }

  if (request.status === 'pending') {
    return { error: 'Your account is still pending admin approval.' }
  }

  if (request.status === 'rejected') {
    return { error: 'Your registration request was not approved.' }
  }

  if (request.status === 'active') {
    return { error: 'Your account is already active. Please login.' }
  }

  const userLookup = await findAuthUserIdByEmail(email)
  if (userLookup.error) {
    return { error: userLookup.error }
  }

  if (!userLookup.userId) {
    return { error: 'Account setup is incomplete. Please contact admin.' }
  }

  const { data: userData, error: userError } = await service.auth.admin.getUserById(userLookup.userId)
  if (userError) {
    return { error: userError.message }
  }

  if (userData.user?.email_confirmed_at) {
    await service
      .from('registration_requests')
      .update({ status: 'active', verified_at: new Date().toISOString() })
      .eq('email', email)
      .eq('status', 'approved')

    return { success: true, message: 'Email already verified. Please login now.' }
  }

  const expiresAt = new Date(Date.now() + VERIFICATION_WINDOW_HOURS * 60 * 60 * 1000)

  const { error: resendError } = await service.auth.resend({
    type: 'signup',
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/login`,
    },
  })

  if (resendError) {
    return { error: resendError.message }
  }

  await service
    .from('registration_requests')
    .update({
      verification_sent_at: new Date().toISOString(),
      verification_expires_at: expiresAt.toISOString(),
    })
    .eq('email', email)
    .eq('status', 'approved')

  return { success: true, message: 'Verification email sent. Please check your inbox.' }
}
