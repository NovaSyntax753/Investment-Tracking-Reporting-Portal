'use server'

import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/actions/guards'

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

    // Trigger notifications for each investor (fire-and-forget)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    for (const inv of investors) {
      fetch(`${baseUrl}/api/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'daily_update',
          investorId: inv.id,
          eodAmount,
          tradeNotes,
          updateDate,
        }),
      }).catch(() => {}) // Non-fatal
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

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    fetch(`${baseUrl}/api/notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'daily_update',
        investorId,
        eodAmount,
        tradeNotes,
        updateDate,
      }),
    }).catch(() => {})
  }

  return { success: true }
}
