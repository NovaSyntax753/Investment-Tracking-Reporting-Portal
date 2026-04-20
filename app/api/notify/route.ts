import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import {
  sendDailyUpdateEmail,
  sendDailySMS,
  sendDailyWhatsApp,
  sendReportReadyEmail,
} from '@/lib/notifications'

export const runtime = 'nodejs'
export const maxDuration = 20

type DeliveryTask = {
  label: string
  run: () => Promise<void>
}

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

    const tasks: DeliveryTask[] = []

    if (investor.email) {
      tasks.push({
        label: 'Email',
        run: () => sendDailyUpdateEmail(investor.email, investor.name, eodAmount, tradeNotes, updateDate),
      })
    }

    if (investor.phone) {
      tasks.push({
        label: 'SMS',
        run: () => sendDailySMS(investor.phone, investor.name, eodAmount, updateDate),
      })
      tasks.push({
        label: 'WhatsApp',
        run: () => sendDailyWhatsApp(investor.phone, investor.name, eodAmount, updateDate),
      })
    }

    const results = await Promise.allSettled(tasks.map((task) => task.run()))
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        const reason = result.reason instanceof Error ? result.reason.message : 'Unknown error'
        errors.push(`${tasks[index].label}: ${reason}`)
      }
    })

    if (!tasks.length) {
      errors.push('No delivery channel available for this investor')
    }
  } else if (type === 'monthly_report') {
    const reportMonth = typeof body.reportMonth === 'string' ? body.reportMonth : ''
    let sent = false

    if (investor.email) {
      try {
        await sendReportReadyEmail(investor.email, investor.name, reportMonth)
        sent = true
      } catch (e) {
        errors.push(`Email: ${(e as Error).message}`)
      }
    } else {
      errors.push('Email: Missing investor email')
    }

    if (sent) {
      const { error: updateError } = await supabase
        .from('monthly_reports')
        .update({ notified: true })
        .eq('investor_id', investorId)
        .eq('report_month', reportMonth)

      if (updateError) {
        errors.push(`DB: ${updateError.message}`)
      }
    }
  } else {
    return NextResponse.json({ error: `Unknown notification type: ${type}` }, { status: 400 })
  }

  if (errors.length > 0) {
    // Partial success — at least one channel failed
    return NextResponse.json({ success: false, errors }, { status: 207 })
  }

  return NextResponse.json({ success: true })
}
