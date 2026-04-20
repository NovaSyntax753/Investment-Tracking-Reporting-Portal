import { format } from 'date-fns'
import { createServiceClient } from '@/lib/supabase/server'
import { sendMonthlySummaryEmail } from '@/lib/notifications'

type InvestorRow = {
  id: string
  name: string
  email: string
  released_amount: number
  unreleased_amount: number
}

type DailyUpdateRow = {
  eod_amount: number
  update_date: string
}

const REPORT_GENERATION_CONCURRENCY = 8
const REPORT_DELIVERY_CONCURRENCY = 5

async function runInBatches<T, R>(
  items: T[],
  batchSize: number,
  worker: (item: T) => Promise<R>,
) {
  const results: R[] = []

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    const batchResults = await Promise.all(batch.map((item) => worker(item)))
    results.push(...batchResults)
  }

  return results
}

function buildPreviousMonthWindow(referenceDate: Date) {
  const year = referenceDate.getUTCFullYear()
  const month = referenceDate.getUTCMonth()

  // Month window is previous calendar month in UTC.
  const start = new Date(Date.UTC(year, month - 1, 1))
  const end = new Date(Date.UTC(year, month, 0))
  const label = format(start, 'MMMM yyyy')

  return {
    monthLabel: label,
    monthStart: format(start, 'yyyy-MM-dd'),
    monthEnd: format(end, 'yyyy-MM-dd'),
  }
}

function round2(value: number) {
  return Math.round(value * 100) / 100
}

function calculateMonthlySummary(rows: DailyUpdateRow[]) {
  const amounts = rows.map((row) => Number(row.eod_amount)).filter((value) => Number.isFinite(value))
  if (!amounts.length) return null

  const opening = amounts[0]
  const closing = amounts[amounts.length - 1]
  const highest = Math.max(...amounts)
  const lowest = Math.min(...amounts)
  const average = amounts.reduce((sum, n) => sum + n, 0) / amounts.length
  const pnl = closing - opening
  const pnlPct = opening > 0 ? (pnl / opening) * 100 : 0

  return {
    openingAmount: round2(opening),
    closingAmount: round2(closing),
    highestAmount: round2(highest),
    lowestAmount: round2(lowest),
    averageAmount: round2(average),
    pnlAmount: round2(pnl),
    pnlPercentage: round2(pnlPct),
    tradingDays: amounts.length,
  }
}

export async function generateMonthlyReportsForPreviousMonth(referenceDate = new Date()) {
  const supabase = await createServiceClient()
  const window = buildPreviousMonthWindow(referenceDate)

  const { data: investors, error: investorsError } = await supabase
    .from('investors')
    .select('id, name, email, released_amount, unreleased_amount')
    .eq('is_active', true)

  if (investorsError) {
    return { error: investorsError.message }
  }

  const investorRows = (investors ?? []) as InvestorRow[]
  const generationResults = await runInBatches(
    investorRows,
    REPORT_GENERATION_CONCURRENCY,
    async (investor) => {
      let generated = 0
      let skipped = 0

      const { data: updates, error: updatesError } = await supabase
        .from('daily_updates')
        .select('eod_amount, update_date')
        .eq('investor_id', investor.id)
        .gte('update_date', window.monthStart)
        .lte('update_date', window.monthEnd)
        .eq('status', 'completed')
        .order('update_date', { ascending: true })

      if (updatesError) {
        skipped += 1
      } else {
        const summary = calculateMonthlySummary((updates ?? []) as DailyUpdateRow[])
        if (!summary) {
          skipped += 1
        } else {
          const { error: upsertError } = await supabase
            .from('monthly_reports')
            .upsert(
              {
                investor_id: investor.id,
                report_month: window.monthLabel,
                document_url: null,
                month_start: window.monthStart,
                month_end: window.monthEnd,
                opening_amount: summary.openingAmount,
                closing_amount: summary.closingAmount,
                highest_amount: summary.highestAmount,
                lowest_amount: summary.lowestAmount,
                average_amount: summary.averageAmount,
                pnl_amount: summary.pnlAmount,
                pnl_percentage: summary.pnlPercentage,
                trading_days: summary.tradingDays,
                auto_generated: true,
                generated_at: new Date().toISOString(),
                notified: false,
                delivered_at: null,
              },
              { onConflict: 'investor_id,report_month' },
            )

          if (upsertError) {
            skipped += 1
          } else {
            generated += 1
          }
        }
      }

      const released = Number(investor.released_amount ?? 0)
      const unreleased = Number(investor.unreleased_amount ?? 0)
      const { error: rolloverError } = await supabase
        .from('investors')
        .update({
          released_amount: released + unreleased,
          unreleased_amount: 0,
        })
        .eq('id', investor.id)

      if (rolloverError) {
        skipped += 1
      }

      return { generated, skipped }
    },
  )

  const generatedCount = generationResults.reduce((sum, row) => sum + row.generated, 0)
  const skippedCount = generationResults.reduce((sum, row) => sum + row.skipped, 0)

  return {
    success: true,
    monthLabel: window.monthLabel,
    monthStart: window.monthStart,
    monthEnd: window.monthEnd,
    generatedCount,
    skippedCount,
  }
}

type PendingReportRow = {
  id: string
  report_month: string
  opening_amount: number
  closing_amount: number
  highest_amount: number
  lowest_amount: number
  average_amount: number
  pnl_amount: number
  pnl_percentage: number
  trading_days: number
  investors:
    | {
        name: string | null
        email: string | null
      }
    | {
        name: string | null
        email: string | null
      }[]
    | null
}

function pickInvestorContact(
  investors: PendingReportRow['investors'],
) {
  if (!investors) return null
  return Array.isArray(investors) ? (investors[0] ?? null) : investors
}

export async function deliverPendingMonthlyReports(monthLabel: string) {
  const supabase = await createServiceClient()

  const { data, error } = await supabase
    .from('monthly_reports')
    .select(`
      id,
      report_month,
      opening_amount,
      closing_amount,
      highest_amount,
      lowest_amount,
      average_amount,
      pnl_amount,
      pnl_percentage,
      trading_days,
      investors(name, email)
    `)
    .eq('report_month', monthLabel)
    .eq('notified', false)

  if (error) {
    return { error: error.message }
  }

  const deliveryResults = await runInBatches(
    (data ?? []) as PendingReportRow[],
    REPORT_DELIVERY_CONCURRENCY,
    async (row) => {
      const investor = pickInvestorContact(row.investors)
      if (!investor?.email) {
        return { delivered: false, failedId: row.id }
      }

      try {
        await sendMonthlySummaryEmail(investor.email, investor.name ?? 'Investor', row.report_month, {
          openingAmount: Number(row.opening_amount ?? 0),
          closingAmount: Number(row.closing_amount ?? 0),
          highestAmount: Number(row.highest_amount ?? 0),
          lowestAmount: Number(row.lowest_amount ?? 0),
          averageAmount: Number(row.average_amount ?? 0),
          pnlAmount: Number(row.pnl_amount ?? 0),
          pnlPercentage: Number(row.pnl_percentage ?? 0),
          tradingDays: Number(row.trading_days ?? 0),
        })

        const { error: markError } = await supabase
          .from('monthly_reports')
          .update({
            notified: true,
            delivered_at: new Date().toISOString(),
          })
          .eq('id', row.id)

        if (markError) {
          return { delivered: false, failedId: row.id }
        }

        return { delivered: true, failedId: null as string | null }
      } catch {
        return { delivered: false, failedId: row.id }
      }
    },
  )

  const deliveredCount = deliveryResults.filter((row) => row.delivered).length
  const failedReportIds = deliveryResults
    .map((row) => row.failedId)
    .filter((id): id is string => Boolean(id))

  return {
    success: true,
    deliveredCount,
    failedCount: failedReportIds.length,
    failedReportIds,
  }
}
