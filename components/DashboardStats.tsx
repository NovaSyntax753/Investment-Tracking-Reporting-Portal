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
  investedAmount?: number | null
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
  investedAmount,
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
      label: investedAmount != null ? 'Invested Amount' : 'Released Amount',
      value: fmt(investedAmount ?? releasedAmount),
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

  const cardStyles = [
    { topBorder: 'border-t-2 border-gold', gradient: 'from-charcoal to-navy', bgIcon: '₹' },
    { topBorder: 'border-t-2 border-amber-400', gradient: 'from-charcoal to-navy', bgIcon: '◈' },
    {
      topBorder: trend === 'up' ? 'border-t-2 border-emerald-500' : 'border-t-2 border-red-500',
      gradient: trend === 'up' ? 'from-emerald-950/30 to-navy' : 'from-red-950/30 to-navy',
      bgIcon: '↑',
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {stats.map((s, i) => (
        <Card
          key={s.label}
          className={`relative overflow-hidden bg-gradient-to-br ${cardStyles[i].gradient} ${cardStyles[i].topBorder} border-gold/20 card-glow`}
        >
          <span className="pointer-events-none absolute -right-2 -top-2 select-none text-7xl leading-none opacity-[0.04]">
            {cardStyles[i].bgIcon}
          </span>
          <CardContent className="relative px-5 pt-6">
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

            {i < 2 && (
              <svg viewBox="0 0 120 20" className="mt-3 h-4 w-full opacity-30">
                <polyline
                  points={i === 0 ? '0,16 24,12 48,10 72,7 96,5 120,2' : '0,18 24,15 48,16 72,10 96,8 120,5'}
                  fill="none"
                  stroke={i === 0 ? '#d4af37' : '#f59e0b'}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
