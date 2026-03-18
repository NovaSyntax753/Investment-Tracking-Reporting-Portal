'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function loginAction(formData: FormData) {
  const identifier = ((formData.get('identifier') as string) || '').trim()
  const password = (formData.get('password') as string) || ''

  const supabase = await createClient()
  const service = await createServiceClient()

  const normalizedIdentifier = identifier.toLowerCase()
  const isEmailIdentifier = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedIdentifier)

  let loginEmail = normalizedIdentifier
  if (!isEmailIdentifier) {
    const { data: investorByCode } = await service
      .from('investors')
      .select('email')
      .eq('investor_code', identifier.toUpperCase())
      .maybeSingle()

    if (!investorByCode?.email) {
      return { error: 'Invalid Investor ID or email.' }
    }

    loginEmail = String(investorByCode.email).toLowerCase()
  }

  let { error, data } = await supabase.auth.signInWithPassword({ email: loginEmail, password })

  // Development convenience: allow bootstrapping admin login from env credentials.
  // If admin user does not exist yet, create it. If it exists, enforce this password.
  const isAdminEnvLogin =
    !!process.env.ADMIN_EMAIL &&
    !!process.env.ADMIN_PASSWORD &&
    loginEmail === process.env.ADMIN_EMAIL.toLowerCase() &&
    password === process.env.ADMIN_PASSWORD

  if (error && isAdminEnvLogin) {
    // First try create (works when admin user doesn't exist).
    const { data: createdUser, error: createError } = await service.auth.admin.createUser({
      email: loginEmail,
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
        const matched = listData.users.find((u) => (u.email || '').toLowerCase() === loginEmail)
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
    const retry = await supabase.auth.signInWithPassword({ email: loginEmail, password })
    error = retry.error
    data = retry.data
  }

  if (error) {
    return { error: 'Invalid credentials. Check your Investor ID/email and password.' }
  }

  if (data.user?.email_confirmed_at && data.user?.id) {
    await service
      .from('investors')
      .update({ is_active: true })
      .eq('id', data.user.id)
      .eq('is_active', false)
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
