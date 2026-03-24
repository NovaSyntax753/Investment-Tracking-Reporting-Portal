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
      .select('id, name, investor_code, invested_amount, released_amount, unreleased_amount, prior_released_amount')
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
  if (!investor && investorWithNewColsError && /(invested_amount|released_amount|unreleased_amount|prior_released_amount)/i.test(investorWithNewColsError.message)) {
    const { data: fallbackInvestor } = await supabase
      .from('investors')
      .select('id, name, investor_code')
      .eq('id', id)
      .maybeSingle()

    investor = fallbackInvestor
      ? {
          ...fallbackInvestor,
          invested_amount: 0,
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
  const investedAmount = Number(investor.invested_amount ?? 0)
  const releasedAmount = Number(investor.released_amount ?? 0)
  const previouslyReleasedAmount = Number(investor.prior_released_amount ?? 0)

  const investedAmountLabel = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(investedAmount)

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-5 rounded-xl border border-gold/20 bg-gradient-to-r from-charcoal to-navy p-6">
        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full border-2 border-gold/35 bg-gold/15">
          <span className="text-xl font-bold text-gold">
            {investor.name.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold">{investor.name}</h1>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400">
              <span className="pulse-dot pulse-dot-green h-1.5 w-1.5" />
              Active
            </span>
          </div>
          <p className="mt-1 font-mono text-sm text-muted-foreground">{investor.investor_code ?? '—'}</p>
          <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-gold/35 bg-gradient-to-r from-gold/15 via-gold/5 to-transparent px-3 py-2 shadow-[0_0_20px_rgba(212,175,55,0.12)]">
            <span className="text-[10px] uppercase tracking-[0.16em] text-gold/80">Invested Capital</span>
            <span className="terminal-text text-sm font-semibold text-gold">{investedAmountLabel}</span>
          </div>
        </div>
        <Link href="/admin/investors" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'text-muted-foreground')}>
          <ArrowLeft className="mr-2 h-4 w-4" />Back
        </Link>
      </div>

      <DashboardStats
        investedAmount={investedAmount}
        releasedAmount={releasedAmount}
        previouslyReleasedAmount={previouslyReleasedAmount}
        unreleasedAmount={Number(investor.unreleased_amount ?? 0)}
        todayEod={today?.eod_amount ?? null}
        yesterdayEod={yesterday?.eod_amount ?? null}
        todayDate={today ? format(new Date(today.update_date + 'T00:00:00'), 'dd MMM yyyy') : null}
      />

      <AdminInvestorDetailClient
        investorId={investor.id}
        investedAmount={investedAmount}
        initialUpdates={updates ?? []}
        initialTransactions={transactions ?? []}
      />
    </div>
  )
}
