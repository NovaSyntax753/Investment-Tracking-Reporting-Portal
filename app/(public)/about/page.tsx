'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Shield, Award, Target, Users } from 'lucide-react'
import { FadeUp, Stagger, StaggerItem } from '@/components/Animate'

const values = [
  { icon: <Shield className="h-6 w-6 text-gold" />, title: 'Capital Preservation', desc: 'Every position is sized to protect your principal before chasing returns.' },
  { icon: <Target className="h-6 w-6 text-gold" />, title: 'Disciplined Strategy', desc: 'Rule-based entry/exit criteria eliminate emotional decision-making.' },
  { icon: <Award className="h-6 w-6 text-gold" />, title: 'Performance Accountability', desc: 'Monthly reports and daily updates keep you fully informed on performance.' },
  { icon: <Users className="h-6 w-6 text-gold" />, title: 'Limited Capacity', desc: 'We onboard selectively to maintain strategy integrity and service quality.' },
]

export default function AboutPage() {
  return (
    <div className="py-20">
      <div className="mx-auto max-w-4xl px-6">
        {/* Header */}
        <FadeUp className="mb-16 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gold">About Us</p>
          <h1 className="text-4xl font-extrabold sm:text-5xl">The Fund Manager</h1>
          <p className="mt-5 text-lg text-muted-foreground leading-relaxed">
            A decade of experience navigating Indian equity markets with a focus on directional
            derivative strategies and systematic portfolio management.
          </p>
        </FadeUp>

        {/* Bio */}
        <FadeUp delay={0.1} className="mb-16">
        <div className="rounded-xl border border-gold/20 bg-charcoal p-8">
          <div className="flex flex-col items-start gap-6 md:flex-row">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-2 border-gold/50 bg-navy text-3xl font-bold text-gold">
              AC
            </div>
            <div>
              <h2 className="text-2xl font-bold">RK Trading Fund Management</h2>
              <p className="mt-1 text-sm text-gold">Founder & Principal Trader</p>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                With over 10 years of active trading in NSE Equity and F&O segments, we have developed
                a proprietary options-selling and momentum framework that consistently delivers
                double-digit returns while maintaining strict drawdown limits. Our investor base
                is kept small and curated to ensure personalised attention and strategy capacity.
              </p>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                All portfolios are individually tracked, and investors receive real-time visibility
                into their capital allocation, daily mark-to-market values, and monthly performance
                summaries — entirely through this private portal.
              </p>
            </div>
          </div>
        </div>
        </FadeUp>

        {/* Values */}
        <div>
          <FadeUp><h2 className="mb-8 text-center text-2xl font-bold">Our Investment Philosophy</h2></FadeUp>
          <Stagger className="grid gap-5 sm:grid-cols-2">
            {values.map((v) => (
              <StaggerItem key={v.title}>
                <Card className="bg-charcoal border-gold/20 hover:border-gold/40 transition-colors h-full">
                  <CardContent className="flex gap-4 pt-5">
                    <div className="mt-0.5 shrink-0">{v.icon}</div>
                    <div>
                      <h3 className="font-semibold">{v.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{v.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </div>
    </div>
  )
}
