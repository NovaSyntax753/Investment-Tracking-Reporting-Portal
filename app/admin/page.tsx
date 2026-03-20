import { createServiceClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Users, DollarSign, Activity, TrendingUp } from 'lucide-react'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
}

export default async function AdminOverviewPage() {
  const supabase = await createServiceClient()

  const [
    { data: investors, error: investorsError },
    { data: updates, error: updatesError },
  ] = await Promise.all([
    supabase.from('investors').select('id, name, invested_amount, is_active'),
    supabase
      .from('daily_updates')
      .select('id, eod_amount, update_date, investor_id, investors(name)')
      .order('update_date', { ascending: false })
      .limit(10),
  ])

  if (investorsError) {
    return <p className="text-destructive text-sm">{investorsError.message}</p>
  }

  if (updatesError) {
    return <p className="text-destructive text-sm">{updatesError.message}</p>
  }

  const activeCount = investors?.filter((i) => i.is_active).length ?? 0
  const totalAUM = investors?.reduce((sum, i) => sum + Number(i.invested_amount ?? 0), 0) ?? 0

  const stats = [
    {
      label: 'Total Investors',
      value: String(investors?.length ?? 0),
      sub: `${activeCount} active`,
      icon: <Users className="h-5 w-5 text-gold" />,
    },
    {
      label: 'Total AUM',
      value: fmt(totalAUM),
      sub: 'Sum of invested capital',
      icon: <DollarSign className="h-5 w-5 text-gold" />,
    },
    {
      label: 'Updates Today',
      value: String(updates?.filter(u => u.update_date === format(new Date(), 'yyyy-MM-dd')).length ?? 0),
      sub: 'Daily update records',
      icon: <Activity className="h-5 w-5 text-gold" />,
    },
    {
      label: 'Avg. AUM / Investor',
      value: investors?.length ? fmt(totalAUM / investors.length) : '—',
      sub: 'Per account',
      icon: <TrendingUp className="h-5 w-5 text-gold" />,
    },
  ]

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between rounded-xl border border-gold/20 bg-gradient-to-r from-charcoal to-navy p-5">
        <div>
          <h1 className="text-2xl font-bold">Admin Console</h1>
          <p className="text-muted-foreground text-base mt-1">Platform-wide statistics & management</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/10 px-3 py-1.5 text-sm font-medium text-gold">
          Admin
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="bg-gradient-to-br from-charcoal to-navy border-gold/20 border-t-2 border-t-gold/60 card-glow">
            <CardContent className="px-5 pt-6">
              <div className="flex items-start justify-between">
                <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">{s.label}</p>
                {s.icon}
              </div>
              <p className="mt-3 text-3xl font-bold terminal-text font-tabular text-foreground">{s.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.sub}</p>
              <svg viewBox="0 0 120 16" className="w-full h-3 mt-3 opacity-25">
                <polyline
                  points="0,14 24,10 48,12 72,6 96,8 120,3"
                  fill="none"
                  stroke="#d4af37"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent updates feed */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Recent Daily Updates</h2>
        {!updates || updates.length === 0 ? (
          <p className="text-muted-foreground text-base">No updates yet.</p>
        ) : (
          <div className="space-y-2">
            {updates.map((u) => {
              const inv = (Array.isArray(u.investors) ? u.investors[0] : u.investors) as { name: string } | null
              return (
                <div
                  key={u.id}
                  className="flex items-center justify-between rounded-lg border border-gold/15 bg-charcoal px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-gold" />
                    <span className="text-base font-medium">{inv?.name ?? 'Unknown'}</span>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(u.update_date + 'T00:00:00'), 'dd MMM yyyy')}
                    </span>
                  </div>
                  <span className="terminal-text font-tabular text-base text-gold">
                    {fmt(u.eod_amount)}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
