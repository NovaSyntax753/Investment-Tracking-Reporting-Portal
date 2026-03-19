'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/actions/guards'

async function applyInvestorReleaseDelta(
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
  investorId: string,
  releasedDelta: number,
  unreleasedDelta: number,
) {
  const { data: investor, error: investorError } = await supabase
    .from('investors')
    .select('released_amount, unreleased_amount')
    .eq('id', investorId)
    .maybeSingle()

  if (investorError) return { error: investorError.message }
  if (!investor) return { error: 'Investor not found' }

  const nextReleased = Number(investor.released_amount ?? 0) + releasedDelta
  const nextUnreleased = Number(investor.unreleased_amount ?? 0) + unreleasedDelta

  const { error: updateError } = await supabase
    .from('investors')
    .update({
      released_amount: nextReleased,
      unreleased_amount: nextUnreleased,
    })
    .eq('id', investorId)

  if (updateError) return { error: updateError.message }
  return { success: true }
}

// Create a monthly transaction (admin only)
export async function createMonthlyTransactionAction(formData: FormData) {
  const authz = await requireAdmin()
  if ('error' in authz) return authz

  const investorId = formData.get('investor_id') as string
  const transactionDate = formData.get('transaction_date') as string
  const methodOfPayment = formData.get('method_of_payment') as string
  const utrNumberRaw = formData.get('utr_number')
  const amount = Number(formData.get('amount'))
  const statusRaw = formData.get('status')
  const status = statusRaw === 'paid' ? 'paid' : 'pending'

  const allowedMethods = new Set(['cash', 'bank_transfer', 'upi', 'other'])
  if (!investorId || !transactionDate || !allowedMethods.has(methodOfPayment) || !Number.isFinite(amount) || amount <= 0) {
    return { error: 'Missing or invalid fields' }
  }

  const utrNumber = typeof utrNumberRaw === 'string' && utrNumberRaw.trim().length > 0
    ? utrNumberRaw.trim()
    : null

  const supabase = await createServiceClient()
  const { data, error } = await supabase
    .from('monthly_transactions')
    .insert({
      investor_id: investorId,
      transaction_date: transactionDate,
      method_of_payment: methodOfPayment,
      utr_number: utrNumber,
      amount,
      status,
    })
    .select('id, created_at')
    .single()

  if (error) return { error: error.message }

  if (status === 'paid') {
    const deltaRes = await applyInvestorReleaseDelta(supabase, investorId, amount, -amount)
    if ('error' in deltaRes) {
      // Best-effort rollback to keep records consistent when totals update fails.
      await supabase.from('monthly_transactions').delete().eq('id', data.id)
      return { error: deltaRes.error }
    }
  }

  revalidatePath('/dashboard')
  revalidatePath('/admin/investors')
  return { success: true, id: data.id, created_at: data.created_at }
}

// Delete a monthly transaction (admin only)
export async function deleteMonthlyTransactionAction(formData: FormData) {
  const authz = await requireAdmin()
  if ('error' in authz) return authz

  const id = formData.get('id') as string
  if (!id) return { error: 'Missing id' }

  const supabase = await createServiceClient()
  const { data: existing, error: existingError } = await supabase
    .from('monthly_transactions')
    .select('id, investor_id, amount, status')
    .eq('id', id)
    .maybeSingle()

  if (existingError) return { error: existingError.message }
  if (!existing) return { error: 'Transaction not found' }

  const { error } = await supabase
    .from('monthly_transactions')
    .delete()
    .eq('id', id)

  if (error) return { error: error.message }

  if (existing.status === 'paid') {
    const amount = Number(existing.amount ?? 0)
    const deltaRes = await applyInvestorReleaseDelta(supabase, existing.investor_id, -amount, amount)
    if ('error' in deltaRes) return { error: deltaRes.error }
  }

  revalidatePath('/dashboard')
  revalidatePath('/admin/investors')
  return { success: true }
}

// Mark a monthly transaction as completed/paid (admin only)
export async function markMonthlyTransactionPaidAction(formData: FormData) {
  const authz = await requireAdmin()
  if ('error' in authz) return authz

  const id = formData.get('id') as string
  if (!id) return { error: 'Missing id' }

  const supabase = await createServiceClient()
  const { data: existing, error: existingError } = await supabase
    .from('monthly_transactions')
    .select('id, investor_id, amount, status')
    .eq('id', id)
    .maybeSingle()

  if (existingError) return { error: existingError.message }
  if (!existing) return { error: 'Transaction not found' }
  if (existing.status === 'paid') return { success: true }

  const { error } = await supabase
    .from('monthly_transactions')
    .update({ status: 'paid' })
    .eq('id', id)

  if (error) return { error: error.message }

  const amount = Number(existing.amount ?? 0)
  const deltaRes = await applyInvestorReleaseDelta(supabase, existing.investor_id, amount, -amount)
  if ('error' in deltaRes) {
    // Best-effort rollback so status does not diverge from totals.
    await supabase.from('monthly_transactions').update({ status: 'pending' }).eq('id', id)
    return { error: deltaRes.error }
  }

  revalidatePath('/dashboard')
  revalidatePath('/admin/investors')
  return { success: true }
}
