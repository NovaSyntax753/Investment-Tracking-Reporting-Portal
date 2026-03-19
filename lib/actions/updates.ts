'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/actions/guards'
import {
  sendDailySMS,
  sendDailyUpdateEmail,
  sendDailyWhatsApp,
} from '@/lib/notifications'

async function notifyDailyUpdate(investor: { name: string; email: string | null; phone: string | null }, eodAmount: number, tradeNotes: string | null, updateDate: string) {
  const tasks: Promise<unknown>[] = []

  if (investor.email) {
    tasks.push(sendDailyUpdateEmail(investor.email, investor.name, eodAmount, tradeNotes, updateDate))
  }

  if (investor.phone) {
    tasks.push(sendDailySMS(investor.phone, investor.name, eodAmount, updateDate))
    tasks.push(sendDailyWhatsApp(investor.phone, investor.name, eodAmount, updateDate))
  }

  await Promise.allSettled(tasks)
}

export async function createDailyUpdateAction(formData: FormData) {
  const authz = await requireAdmin()
  if ('error' in authz) return authz

  const investorId = formData.get('investorId') as string
  const eodAmount = parseFloat(formData.get('eodAmount') as string)
  const tradeNotes = (formData.get('tradeNotes') as string) || null
  const updateDate = formData.get('updateDate') as string

  if (!investorId || isNaN(eodAmount) || !updateDate) {
    return { error: 'Missing required fields' }
  }

  const supabase = await createServiceClient()

  if (investorId === 'all') {
    // Fetch all active investors
    const { data: investors, error: fetchError } = await supabase
      .from('investors')
      .select('id, name, email, phone')
      .eq('is_active', true)

    if (fetchError) return { error: fetchError.message }
    if (!investors?.length) return { error: 'No active investors found' }

    // Insert one record per investor
    const rows = investors.map((inv) => ({
      investor_id: inv.id,
      eod_amount: eodAmount,
      trade_notes: tradeNotes,
      update_date: updateDate,
      status: 'completed',
    }))

    const { error: insertError } = await supabase.from('daily_updates').insert(rows)
    if (insertError) return { error: insertError.message }

    for (const inv of investors) {
      await notifyDailyUpdate(inv, eodAmount, tradeNotes, updateDate)
    }
  } else {
    // Single investor
    const { error: insertError } = await supabase.from('daily_updates').insert({
      investor_id: investorId,
      eod_amount: eodAmount,
      trade_notes: tradeNotes,
      update_date: updateDate,
      status: 'completed',
    })
    if (insertError) return { error: insertError.message }

    const { data: investor } = await supabase
      .from('investors')
      .select('name, email, phone')
      .eq('id', investorId)
      .maybeSingle()

    if (investor) {
      await notifyDailyUpdate(investor, eodAmount, tradeNotes, updateDate)
    }
  }

  return { success: true }
}

// Update a single daily update entry (admin only)
export async function updateDailyUpdateAction(formData: FormData) {
  const authz = await requireAdmin()
  if ('error' in authz) return authz

  const id = formData.get('id') as string
  const eodAmount = Number(formData.get('eod_amount'))
  const tradeNotesRaw = formData.get('trade_notes')
  const tradeNotes = typeof tradeNotesRaw === 'string' && tradeNotesRaw.trim().length > 0
    ? tradeNotesRaw.trim()
    : null
  const statusRaw = formData.get('status')
  const status = statusRaw === 'ongoing' ? 'ongoing' : 'completed'

  if (!id || !Number.isFinite(eodAmount) || eodAmount < 0) {
    return { error: 'Missing or invalid fields' }
  }

  const supabase = await createServiceClient()
  const { error } = await supabase
    .from('daily_updates')
    .update({
      eod_amount: eodAmount,
      trade_notes: tradeNotes,
      status,
    })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  revalidatePath('/admin/updates')
  revalidatePath('/admin/investors')
  return { success: true }
}

// Delete a single daily update entry (admin only)
export async function deleteDailyUpdateAction(formData: FormData) {
  const authz = await requireAdmin()
  if ('error' in authz) return authz

  const id = formData.get('id') as string
  if (!id) return { error: 'Missing id' }

  const supabase = await createServiceClient()
  const { error } = await supabase
    .from('daily_updates')
    .delete()
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  revalidatePath('/admin/updates')
  revalidatePath('/admin/investors')
  return { success: true }
}

// Create an "ongoing" placeholder entry (admin only)
export async function createOngoingEntryAction(formData: FormData) {
  const authz = await requireAdmin()
  if ('error' in authz) return authz

  const investorId = formData.get('investor_id') as string
  const updateDateInput = formData.get('update_date') as string | null
  const updateDate = updateDateInput || new Date().toISOString().slice(0, 10)

  if (!investorId) return { error: 'Missing investor id' }

  const supabase = await createServiceClient()
  const { data, error } = await supabase
    .from('daily_updates')
    .insert({
      investor_id: investorId,
      update_date: updateDate,
      eod_amount: 0,
      trade_notes: null,
      status: 'ongoing',
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  revalidatePath('/admin/updates')
  revalidatePath('/admin/investors')
  return { success: true, id: data.id }
}
