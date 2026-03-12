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

  const [{ data: investor }, { data: updates }] = await Promise.all([
    supabase
      .from('investors')
      .select('name, invested_amount, fixed_return_value, fixed_return_percentage')
      .eq('id', user.id)
      .single(),
    supabase
      .from('daily_updates')
      .select('id, eod_amount, trade_notes, update_date, created_at')
      .eq('investor_id', user.id)
      .gte('update_date', format(new Date(Date.now() - 30 * 86400000), 'yyyy-MM-dd'))
      .order('update_date', { ascending: false })
      .limit(30),
  ])

  if (!investor) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Profile not found. Contact support.</p>
      </div>
    )
  }

  const latestUpdate = updates?.[0] ?? null

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Welcome, {investor.name}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Portfolio overview · Last 30 days
        </p>
      </div>

      {/* Stats cards */}
      <DashboardStats
        investedAmount={investor.invested_amount}
        fixedReturnValue={investor.fixed_return_value}
        fixedReturnPct={investor.fixed_return_percentage}
        latestEod={latestUpdate?.eod_amount ?? null}
        latestUpdateDate={latestUpdate ? format(new Date(latestUpdate.update_date + 'T00:00:00'), 'dd MMM yyyy') : null}
      />

      {/* Updates table */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Recent Daily Updates</h2>
        {!updates || updates.length === 0 ? (
          <div className="rounded-xl border border-gold/20 bg-charcoal p-10 text-center">
            <p className="text-muted-foreground text-sm">No updates in the last 30 days.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-gold/20 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-gold/20 bg-charcoal hover:bg-charcoal">
                  <TableHead className="text-muted-foreground text-xs uppercase tracking-widest">Date</TableHead>
                  <TableHead className="text-muted-foreground text-xs uppercase tracking-widest text-right">EOD Value</TableHead>
                  <TableHead className="text-muted-foreground text-xs uppercase tracking-widest text-right">P&L vs Invested</TableHead>
                  <TableHead className="text-muted-foreground text-xs uppercase tracking-widest">Trade Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {updates.map((u) => {
                  const pnl = u.eod_amount - investor.invested_amount
                  const isUp = pnl >= 0
                  return (
                    <TableRow
                      key={u.id}
                      className="border-gold/10 hover:bg-charcoal/50 transition-colors"
                    >
                      <TableCell className="font-medium terminal-text text-sm">
                        {format(new Date(u.update_date + 'T00:00:00'), 'dd MMM yyyy')}
                      </TableCell>
                      <TableCell className="text-right terminal-text font-tabular">
                        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(u.eod_amount)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant="outline"
                          className={`terminal-text font-tabular text-xs ${
                            isUp
                              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                              : 'border-red-500/30 bg-red-500/10 text-red-400'
                          }`}
                        >
                          {isUp ? '+' : ''}
                          {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(pnl)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                        {u.trade_notes ?? '—'}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
}
