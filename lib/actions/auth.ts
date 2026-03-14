'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

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
      .select('status')
      .eq('email', email)
      .maybeSingle()

    if (pendingRequest?.status === 'pending') {
      return { error: 'Your registration is pending admin approval. Please wait for approval email.' }
    }

    if (pendingRequest?.status === 'approved') {
      return { error: 'Your account is approved. Please set your password from the approval email before logging in.' }
    }

    return { error: 'Invalid credentials. Check email/password or register first.' }
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
  const phone = ((formData.get('phone') as string) || '').trim() || null
  const investedAmount = Number(formData.get('invested_amount') || 0)
  const fixedReturnValue = Number(formData.get('fixed_return_value') || 0)
  const fixedReturnPercentage = Number(formData.get('fixed_return_percentage') || 0)

  if (!name || !email) {
    return { error: 'Name and email are required' }
  }

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

  const { data: existingRequest } = await supabase
    .from('registration_requests')
    .select('id, status')
    .eq('email', email)
    .maybeSingle()

  if (existingRequest && existingRequest.status === 'pending') {
    return { error: 'Registration request already submitted and pending admin approval.' }
  }

  const { error } = await supabase.from('registration_requests').upsert(
    {
      name,
      email,
      phone,
      invested_amount: investedAmount,
      fixed_return_value: fixedReturnValue,
      fixed_return_percentage: fixedReturnPercentage,
      status: 'pending',
      reviewed_at: null,
      reviewed_by: null,
      investor_id: null,
    },
    { onConflict: 'email' },
  )

  if (error) {
    return { error: error.message }
  }

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
