'use server'

import { createClient } from '@/lib/supabase/server'

export async function requireAdmin() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data.user) {
    return { error: 'Unauthorized' as const }
  }

  if (!process.env.ADMIN_EMAIL || data.user.email !== process.env.ADMIN_EMAIL) {
    return { error: 'Forbidden' as const }
  }

  return { ok: true as const }
}