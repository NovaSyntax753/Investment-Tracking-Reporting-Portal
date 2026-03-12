import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import {
  sendDailyUpdateEmail,
  sendDailySMS,
  sendDailyWhatsApp,
  sendReportReadyEmail,
} from '@/lib/notifications'

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { type, investorId } = body

  if (!type || !investorId || typeof investorId !== 'string') {
    return NextResponse.json({ error: 'Missing type or investorId' }, { status: 400 })
  }

  const supabase = await createServiceClient()

  // Fetch investor contact info
  const { data: investor, error } = await supabase
    .from('investors')
    .select('name, email, phone')
    .eq('id', investorId)
    .single()

  if (error || !investor) {
    return NextResponse.json({ error: 'Investor not found' }, { status: 404 })
  }

  const errors: string[] = []

  if (type === 'daily_update') {
    const eodAmount = Number(body.eodAmount)
    const tradeNotes = typeof body.tradeNotes === 'string' ? body.tradeNotes : null
    const updateDate = typeof body.updateDate === 'string' ? body.updateDate : new Date().toISOString().split('T')[0]

    if (isNaN(eodAmount)) {
      return NextResponse.json({ error: 'Invalid eodAmount' }, { status: 400 })
    }

    // Email
    if (investor.email) {
      try {
        await sendDailyUpdateEmail(investor.email, investor.name, eodAmount, tradeNotes, updateDate)
      } catch (e) {
        errors.push(`Email: ${(e as Error).message}`)
      }
    }

    // SMS
    if (investor.phone) {
      try {
        await sendDailySMS(investor.phone, investor.name, eodAmount, updateDate)
      } catch (e) {
        errors.push(`SMS: ${(e as Error).message}`)
      }

      // WhatsApp
      try {
        await sendDailyWhatsApp(investor.phone, investor.name, eodAmount, updateDate)
      } catch (e) {
        errors.push(`WhatsApp: ${(e as Error).message}`)
      }
    }
  } else if (type === 'monthly_report') {
    const reportMonth = typeof body.reportMonth === 'string' ? body.reportMonth : ''

    if (investor.email) {
      try {
        await sendReportReadyEmail(investor.email, investor.name, reportMonth)
      } catch (e) {
        errors.push(`Email: ${(e as Error).message}`)
      }
    }

    // Mark report as notified
    await supabase
      .from('monthly_reports')
      .update({ notified: true })
      .eq('investor_id', investorId)
      .eq('report_month', reportMonth)
  } else {
    return NextResponse.json({ error: `Unknown notification type: ${type}` }, { status: 400 })
  }

  if (errors.length > 0) {
    // Partial success — at least one channel failed
    return NextResponse.json({ success: false, errors }, { status: 207 })
  }

  return NextResponse.json({ success: true })
}
