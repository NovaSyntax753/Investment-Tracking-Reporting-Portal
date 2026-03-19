'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/actions/guards'

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
  const { error } = await supabase
    .from('monthly_transactions')
    .delete()
    .eq('id', id)

  if (error) return { error: error.message }

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
  const { error } = await supabase
    .from('monthly_transactions')
    .update({ status: 'paid' })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  revalidatePath('/admin/investors')
  return { success: true }
}
