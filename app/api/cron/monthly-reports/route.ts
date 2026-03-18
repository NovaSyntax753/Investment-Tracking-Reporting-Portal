import { NextRequest, NextResponse } from 'next/server'
import {
  deliverPendingMonthlyReports,
  generateMonthlyReportsForPreviousMonth,
} from '@/lib/monthly-reports'

function isAuthorized(request: NextRequest) {
  const configuredSecret = process.env.CRON_SECRET
  if (!configuredSecret) return true

  const bearer = request.headers.get('authorization')
  const token = bearer?.startsWith('Bearer ') ? bearer.slice(7) : request.headers.get('x-cron-secret')
  return token === configuredSecret
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const generation = await generateMonthlyReportsForPreviousMonth(new Date())
  if ('error' in generation) {
    return NextResponse.json({ error: generation.error }, { status: 500 })
  }

  const delivery = await deliverPendingMonthlyReports(generation.monthLabel)
  if ('error' in delivery) {
    return NextResponse.json(
      {
        error: delivery.error,
        generated: generation,
      },
      { status: 500 },
    )
  }

  return NextResponse.json({
    success: true,
    generated: generation,
    delivered: delivery,
  })
}
