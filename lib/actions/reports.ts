'use server'

import { createServiceClient } from '@/lib/supabase/server'

export async function uploadReportAction(formData: FormData) {
  const investorId = formData.get('investorId') as string
  const reportMonth = formData.get('reportMonth') as string
  const file = formData.get('file') as File | null

  if (!investorId || !reportMonth || !file) {
    return { error: 'Missing required fields' }
  }

  if (file.type !== 'application/pdf') {
    return { error: 'Only PDF files are accepted' }
  }

  if (file.size > 20 * 1024 * 1024) {
    return { error: 'File size must be under 20 MB' }
  }

  const supabase = await createServiceClient()

  // Build a safe storage path: {investorId}/{sanitizedMonth}.pdf
  const safeName = reportMonth.replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '_')
  const storagePath = `${investorId}/${safeName}_${Date.now()}.pdf`

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const { error: storageError } = await supabase.storage
    .from('monthly-reports')
    .upload(storagePath, buffer, {
      contentType: 'application/pdf',
      upsert: false,
    })

  if (storageError) return { error: storageError.message }

  // Insert monthly_reports row
  const { error: dbError } = await supabase.from('monthly_reports').insert({
    investor_id: investorId,
    report_month: reportMonth,
    document_url: storagePath,
  })

  if (dbError) {
    // Attempt cleanup of uploaded file
    await supabase.storage.from('monthly-reports').remove([storagePath])
    return { error: dbError.message }
  }

  // Trigger email notification
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  fetch(`${baseUrl}/api/notify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'monthly_report',
      investorId,
      reportMonth,
    }),
  }).catch(() => {})

  return { success: true }
}
