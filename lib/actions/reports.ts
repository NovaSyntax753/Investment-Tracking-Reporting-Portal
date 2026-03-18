'use server'

import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/actions/guards'
import { sendReportReadyEmail } from '@/lib/notifications'

export async function uploadReportAction(formData: FormData) {
  const authz = await requireAdmin()
  if ('error' in authz) return authz

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
  const { data: insertedReport, error: dbError } = await supabase
    .from('monthly_reports')
    .insert({
    investor_id: investorId,
    report_month: reportMonth,
    document_url: storagePath,
      auto_generated: false,
      generated_at: new Date().toISOString(),
      notified: false,
    })
    .select('id')
    .single()

  if (dbError) {
    // Attempt cleanup of uploaded file
    await supabase.storage.from('monthly-reports').remove([storagePath])
    return { error: dbError.message }
  }

  const { data: investor } = await supabase
    .from('investors')
    .select('name, email')
    .eq('id', investorId)
    .maybeSingle()

  if (investor?.email) {
    try {
      await sendReportReadyEmail(investor.email, investor.name, reportMonth)
      if (insertedReport?.id) {
        await supabase
          .from('monthly_reports')
          .update({ notified: true, delivered_at: new Date().toISOString() })
          .eq('id', insertedReport.id)
      }
    } catch {
      // Non-fatal: report is uploaded even when notification fails.
    }
  }

  return { success: true }
}
