import { Card, CardContent } from '@/components/ui/card'
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react'

interface Stat {
  label: string
  value: string
  subtext?: string
  trend?: 'up' | 'down' | 'neutral'
  icon: React.ReactNode
}

interface DashboardStatsProps {
  releasedAmount: number
  unreleasedAmount: number
  todayEod: number | null
  yesterdayEod: number | null
  todayDate: string | null
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(n)
}

export default function DashboardStats({
  releasedAmount,
  unreleasedAmount,
  todayEod,
  yesterdayEod,
  todayDate,
}: DashboardStatsProps) {
  const todayPnl = todayEod != null && yesterdayEod != null ? todayEod - yesterdayEod : null
  const trend: 'up' | 'down' | 'neutral' = todayPnl == null ? 'neutral' : todayPnl >= 0 ? 'up' : 'down'

  const stats: Stat[] = [
    {
      label: 'Released Amount',
      value: fmt(releasedAmount),
      icon: <DollarSign className="h-5 w-5 text-muted-foreground" />,
      trend: 'neutral',
    },
    {
      label: 'Unreleased This Month',
      value: fmt(unreleasedAmount),
      icon: <TrendingUp className="h-5 w-5 text-gold" />,
      trend: 'up',
    },
    {
      label: "Today's P&L",
      value: todayPnl != null ? `${todayPnl >= 0 ? '+' : '-'}${fmt(Math.abs(todayPnl))}` : '—',
      subtext: todayDate ?? undefined,
      icon: trend === 'up'
        ? <TrendingUp className="h-5 w-5 stat-up" />
        : trend === 'down'
          ? <TrendingDown className="h-5 w-5 stat-down" />
          : <TrendingUp className="h-5 w-5 text-gold" />,
      trend,
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {stats.map((s) => (
        <Card key={s.label} className="bg-charcoal border-gold/20 hover:border-gold/40 transition-colors">
          <CardContent className="px-5 pt-6">
            <div className="flex items-start justify-between">
              <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
                {s.label}
              </p>
              {s.icon}
            </div>
            <p
              className={`mt-3 text-3xl font-bold terminal-text font-tabular ${
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
              <p className="mt-1 text-sm text-muted-foreground">{s.subtext}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
