import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/server'
import DashboardStats from '@/components/DashboardStats'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: investorWithNewCols, error: investorWithNewColsError }, { data: updatesWithStatus, error: updatesWithStatusError }, { data: transactionsData, error: transactionsError }] = await Promise.all([
    supabase
      .from('investors')
      .select('name, invested_amount, fixed_return_value, fixed_return_percentage, released_amount, unreleased_amount, prior_released_amount')
      .eq('id', user.id)
      .single(),
    supabase
      .from('daily_updates')
      .select('id, eod_amount, trade_notes, update_date, created_at, status')
      .eq('investor_id', user.id)
      .gte('update_date', format(new Date(Date.now() - 30 * 86400000), 'yyyy-MM-dd'))
      .order('update_date', { ascending: false })
      .limit(30),
    supabase
      .from('monthly_transactions')
      .select('id, transaction_date, method_of_payment, utr_number, amount, status')
      .eq('investor_id', user.id)
      .order('transaction_date', { ascending: false }),
  ])

  // Backward-compatible fallback if migration 003 columns are not present yet.
  let investor = investorWithNewCols
  if (!investor && investorWithNewColsError && /(released_amount|unreleased_amount|prior_released_amount)/i.test(investorWithNewColsError.message)) {
    const { data: fallbackInvestor } = await supabase
      .from('investors')
      .select('name, invested_amount, fixed_return_value, fixed_return_percentage')
      .eq('id', user.id)
      .single()

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
      .eq('investor_id', user.id)
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
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Profile not found. Contact support.</p>
      </div>
    )
  }

  const safeUpdates = updates ?? []

  // Use latest row per distinct date so today's P&L does not compare two same-day entries.
  const distinctDateUpdates = safeUpdates.filter((u, index, arr) => index === arr.findIndex((x) => x.update_date === u.update_date))

  const todayUpdate = distinctDateUpdates[0] ?? null
  const yesterdayUpdate = distinctDateUpdates[1] ?? null

  const investedAmount = Number(investor.invested_amount ?? 0)
  const rawReleasedAmount = Number(investor.released_amount ?? 0)
  const priorReleasedAmount = Number(investor.prior_released_amount ?? 0)
  const rawUnreleasedAmount = Number(investor.unreleased_amount ?? 0)
  const investedAmountLabel = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(investedAmount)

  // If new tracking values are still zero but historic invested data exists, derive a temporary UI fallback.
  const fallbackUnreleased = todayUpdate ? Number(todayUpdate.eod_amount) - investedAmount : 0
  const useLegacyDisplayFallback = rawReleasedAmount === 0 && rawUnreleasedAmount === 0 && priorReleasedAmount === 0 && investedAmount > 0

  const releasedAmount = useLegacyDisplayFallback ? investedAmount : rawReleasedAmount
  const unreleasedAmount = useLegacyDisplayFallback ? fallbackUnreleased : rawUnreleasedAmount

  const methodLabel: Record<string, string> = {
    cash: 'Cash',
    bank_transfer: 'Bank Transfer',
    upi: 'UPI',
    other: 'Other',
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between rounded-xl border border-gold/20 bg-gradient-to-r from-charcoal to-navy p-5">
        <div>
          <h1 className="text-2xl font-bold">Welcome, {investor.name}</h1>
          <p className="text-muted-foreground text-base mt-1">Portfolio overview · Last 30 days</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="rounded-lg border border-gold/35 bg-gradient-to-r from-gold/15 via-gold/5 to-transparent px-3 py-2 text-right shadow-[0_0_20px_rgba(212,175,55,0.12)]">
            <p className="text-[10px] uppercase tracking-[0.16em] text-gold/80">Invested Capital</p>
            <p className="terminal-text text-lg font-semibold text-gold">{investedAmountLabel}</p>
          </div>
          <div className="hidden items-center gap-2 text-sm sm:flex">
            <span className="pulse-dot pulse-dot-green" />
            <span className="text-sm font-medium text-emerald-400">Markets Active</span>
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <DashboardStats
        investedAmount={investedAmount}
        releasedAmount={releasedAmount}
        previouslyReleasedAmount={priorReleasedAmount}
        unreleasedAmount={unreleasedAmount}
        todayEod={todayUpdate?.eod_amount ?? null}
        yesterdayEod={yesterdayUpdate?.eod_amount ?? null}
        todayDate={todayUpdate ? format(new Date(todayUpdate.update_date + 'T00:00:00'), 'dd MMM yyyy') : null}
      />

      {/* Updates table */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Recent Daily Updates</h2>
        {safeUpdates.length === 0 ? (
          <div className="rounded-xl border border-gold/20 bg-charcoal p-10 text-center">
            <p className="text-muted-foreground text-base">No updates in the last 30 days.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-gold/20 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-gold/20 bg-charcoal hover:bg-charcoal">
                  <TableHead className="text-muted-foreground text-sm uppercase tracking-widest">Date</TableHead>
                  <TableHead className="text-muted-foreground text-sm uppercase tracking-widest">Trade Notes</TableHead>
                  <TableHead className="text-muted-foreground text-sm uppercase tracking-widest text-right">Unreleased PNL</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {safeUpdates.map((u, i) => {
                  const next = safeUpdates[i + 1]
                  const pnl = next ? Number(u.eod_amount) - Number(next.eod_amount) : null
                  const isUp = pnl != null && pnl >= 0
                  return (
                    <TableRow
                      key={u.id}
                      className="border-gold/10 hover:bg-charcoal/50 transition-colors"
                    >
                      <TableCell className="font-medium terminal-text text-base">
                        {format(new Date(u.update_date + 'T00:00:00'), 'dd MMM yyyy')}
                      </TableCell>
                      <TableCell className="text-base text-muted-foreground max-w-xs truncate">
                        {u.trade_notes ?? '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        {u.status === 'ongoing' ? (
                          <span className="inline-flex items-center gap-2 text-amber-300">
                            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                            Ongoing
                          </span>
                        ) : pnl == null ? (
                          <span className="text-muted-foreground">—</span>
                        ) : (
                          <Badge
                            variant="outline"
                            className={`terminal-text font-tabular text-sm ${
                              isUp
                                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                                : 'border-red-500/30 bg-red-500/10 text-red-400'
                            }`}
                          >
                            {isUp ? '+' : '-'}
                            {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Math.abs(pnl))}
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold">Monthly Transactions</h2>
        {!transactions || transactions.length === 0 ? (
          <div className="rounded-xl border border-gold/20 bg-charcoal p-10 text-center">
            <p className="text-muted-foreground text-base">No transactions recorded yet.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-gold/20 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-gold/20 bg-charcoal hover:bg-charcoal">
                  <TableHead className="text-muted-foreground text-sm uppercase tracking-widest">Date</TableHead>
                  <TableHead className="text-muted-foreground text-sm uppercase tracking-widest">Method</TableHead>
                  <TableHead className="text-muted-foreground text-sm uppercase tracking-widest">UTR Number</TableHead>
                  <TableHead className="text-muted-foreground text-sm uppercase tracking-widest text-right">Amount</TableHead>
                  <TableHead className="text-muted-foreground text-sm uppercase tracking-widest">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((txn) => (
                  <TableRow key={txn.id} className="border-gold/10 hover:bg-charcoal/50 transition-colors">
                    <TableCell className="font-medium terminal-text text-base">
                      {format(new Date(txn.transaction_date + 'T00:00:00'), 'dd MMM yyyy')}
                    </TableCell>
                    <TableCell>{methodLabel[txn.method_of_payment] ?? txn.method_of_payment}</TableCell>
                    <TableCell className="text-muted-foreground">{txn.utr_number ?? '—'}</TableCell>
                    <TableCell className="text-right terminal-text font-tabular">
                      {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(txn.amount))}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={txn.status === 'paid'
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                          : 'border-amber-500/30 bg-amber-500/10 text-amber-300'}
                      >
                        {txn.status === 'paid' ? 'Completed' : 'Pending'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
}
