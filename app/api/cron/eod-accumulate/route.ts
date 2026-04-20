import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const maxDuration = 60
const EOD_CONCURRENCY = 8

type EodInvestorRow = {
  id: string
  unreleased_amount: number | null
  is_active: boolean
}

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

  const supabase = await createServiceClient()
  const { data: investors, error: investorsError } = await supabase
    .from('investors')
    .select('id, unreleased_amount, is_active')
    .eq('is_active', true)

  if (investorsError) {
    return NextResponse.json({ error: investorsError.message }, { status: 500 })
  }

  let updatedCount = 0
  const activeInvestors = (investors ?? []) as EodInvestorRow[]

  for (let i = 0; i < activeInvestors.length; i += EOD_CONCURRENCY) {
    const batch = activeInvestors.slice(i, i + EOD_CONCURRENCY)
    const results = await Promise.all(
      batch.map(async (investor) => {
        const { data: updates, error: updatesError } = await supabase
          .from('daily_updates')
          .select('eod_amount, update_date')
          .eq('investor_id', investor.id)
          .eq('status', 'completed')
          .order('update_date', { ascending: false })
          .limit(2)

        if (updatesError || !updates || updates.length < 2) {
          return false
        }

        const dailyPnl = Number(updates[0].eod_amount) - Number(updates[1].eod_amount)
        if (!Number.isFinite(dailyPnl) || dailyPnl <= 0) {
          return false
        }

        const { error: updateInvestorError } = await supabase
          .from('investors')
          .update({
            unreleased_amount: Number(investor.unreleased_amount ?? 0) + dailyPnl,
          })
          .eq('id', investor.id)

        return !updateInvestorError
      }),
    )

    updatedCount += results.filter(Boolean).length
  }

  return NextResponse.json({
    success: true,
    processed: investors?.length ?? 0,
    updatedCount,
  })
}
