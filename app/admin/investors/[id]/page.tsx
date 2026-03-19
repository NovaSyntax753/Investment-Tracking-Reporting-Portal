import Link from 'next/link'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { ArrowLeft } from 'lucide-react'
import { createServiceClient } from '@/lib/supabase/server'
import DashboardStats from '@/components/DashboardStats'
import AdminInvestorDetailClient from './InvestorDetailClient'
import { buttonVariants } from '@/lib/buttonVariants'
import { cn } from '@/lib/utils'

interface InvestorDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function AdminInvestorDetailPage({ params }: InvestorDetailPageProps) {
  const { id } = await params
  const supabase = await createServiceClient()

  const [{ data: investorWithNewCols, error: investorWithNewColsError }, { data: updatesWithStatus, error: updatesWithStatusError }, { data: transactionsData, error: transactionsError }] = await Promise.all([
    supabase
      .from('investors')
      .select('id, name, investor_code, released_amount, unreleased_amount, prior_released_amount')
      .eq('id', id)
      .maybeSingle(),
    supabase
      .from('daily_updates')
      .select('id, eod_amount, trade_notes, update_date, created_at, status')
      .eq('investor_id', id)
      .gte('update_date', format(new Date(Date.now() - 30 * 86400000), 'yyyy-MM-dd'))
      .order('update_date', { ascending: false })
      .limit(30),
    supabase
      .from('monthly_transactions')
      .select('id, transaction_date, method_of_payment, utr_number, amount, status, created_at')
      .eq('investor_id', id)
      .order('transaction_date', { ascending: false }),
  ])

  // Backward-compatible fallback when migration 003 columns are not present yet.
  let investor = investorWithNewCols
  if (!investor && investorWithNewColsError && /(released_amount|unreleased_amount|prior_released_amount)/i.test(investorWithNewColsError.message)) {
    const { data: fallbackInvestor } = await supabase
      .from('investors')
      .select('id, name, investor_code')
      .eq('id', id)
      .maybeSingle()

    investor = fallbackInvestor
      ? {
          ...fallbackInvestor,
          released_amount: 0,
          unreleased_amount: 0,
          prior_released_amount: 0,
        }
      : null
  }

  // Backward-compatible fallback when daily_updates.status column is not present yet.
  let updates = updatesWithStatus
  if (!updates && updatesWithStatusError && /status/i.test(updatesWithStatusError.message)) {
    const { data: fallbackUpdates } = await supabase
      .from('daily_updates')
      .select('id, eod_amount, trade_notes, update_date, created_at')
      .eq('investor_id', id)
      .gte('update_date', format(new Date(Date.now() - 30 * 86400000), 'yyyy-MM-dd'))
      .order('update_date', { ascending: false })
      .limit(30)

    updates = (fallbackUpdates ?? []).map((u) => ({ ...u, status: 'completed' }))
  }

  // If monthly_transactions table is not created yet, keep section empty instead of failing.
  const transactions = transactionsError && /monthly_transactions/i.test(transactionsError.message)
    ? []
    : (transactionsData ?? [])

  if (!investor) {
    notFound()
  }

  const today = updates?.[0] ?? null
  const yesterday = updates?.[1] ?? null
  const releasedAmount = Number(investor.released_amount ?? 0) + Number(investor.prior_released_amount ?? 0)

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Link href="/admin/investors" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'text-muted-foreground hover:text-foreground')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Investors
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{investor.name}</h1>
          <p className="text-muted-foreground text-sm mt-1">{investor.investor_code ?? '—'}</p>
        </div>
      </div>

      <DashboardStats
        releasedAmount={releasedAmount}
        unreleasedAmount={Number(investor.unreleased_amount ?? 0)}
        todayEod={today?.eod_amount ?? null}
        yesterdayEod={yesterday?.eod_amount ?? null}
        todayDate={today ? format(new Date(today.update_date + 'T00:00:00'), 'dd MMM yyyy') : null}
      />

      <AdminInvestorDetailClient
        investorId={investor.id}
        initialUpdates={updates ?? []}
        initialTransactions={transactions ?? []}
      />
    </div>
  )
}
