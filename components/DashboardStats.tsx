import { Card, CardContent } from '@/components/ui/card'
import { TrendingUp, TrendingDown, DollarSign, BarChart3 } from 'lucide-react'

interface Stat {
  label: string
  value: string
  subtext?: string
  trend?: 'up' | 'down' | 'neutral'
  icon: React.ReactNode
}

interface DashboardStatsProps {
  investedAmount: number
  fixedReturnValue: number
  fixedReturnPct: number
  latestEod: number | null
  latestUpdateDate?: string | null
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(n)
}

export default function DashboardStats({
  investedAmount,
  fixedReturnValue,
  fixedReturnPct,
  latestEod,
  latestUpdateDate,
}: DashboardStatsProps) {
  const pnl = latestEod != null ? latestEod - investedAmount : null
  const pnlPct = pnl != null && investedAmount > 0 ? (pnl / investedAmount) * 100 : null
  const isUp = pnl != null && pnl >= 0

  const stats: Stat[] = [
    {
      label: 'Invested Capital',
      value: fmt(investedAmount),
      icon: <DollarSign className="h-5 w-5 text-gold" />,
      trend: 'neutral',
    },
    {
      label: 'Fixed Return',
      value: fmt(fixedReturnValue),
      subtext: `${fixedReturnPct.toFixed(2)}% p.a.`,
      icon: <BarChart3 className="h-5 w-5 text-gold" />,
      trend: 'up',
    },
    {
      label: 'Latest Portfolio Value',
      value: latestEod != null ? fmt(latestEod) : '— Awaiting update',
      subtext: latestUpdateDate ?? undefined,
      icon: <TrendingUp className="h-5 w-5 text-gold" />,
      trend: 'neutral',
    },
    {
      label: 'Unrealised P&L',
      value: pnl != null ? fmt(pnl) : '—',
      subtext: pnlPct != null ? `${pnlPct > 0 ? '+' : ''}${pnlPct.toFixed(2)}%` : undefined,
      icon: isUp
        ? <TrendingUp className="h-5 w-5 stat-up" />
        : <TrendingDown className="h-5 w-5 stat-down" />,
      trend: pnl == null ? 'neutral' : isUp ? 'up' : 'down',
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((s) => (
        <Card key={s.label} className="bg-charcoal border-gold/20 hover:border-gold/40 transition-colors">
          <CardContent className="pt-5">
            <div className="flex items-start justify-between">
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                {s.label}
              </p>
              {s.icon}
            </div>
            <p
              className={`mt-3 text-2xl font-bold terminal-text font-tabular ${
                s.trend === 'up'
                  ? 'stat-up'
                  : s.trend === 'down'
                  ? 'stat-down'
                  : 'text-foreground'
              }`}
            >
              {s.value}
            </p>
            {s.subtext && (
              <p className="mt-1 text-xs text-muted-foreground">{s.subtext}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
