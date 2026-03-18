'use server'

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
