'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { buttonVariants } from '@/lib/buttonVariants'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'
import Link from 'next/link'
import { FadeUp, Stagger, StaggerItem } from '@/components/Animate'

const tiers = [
  {
    name: 'Starter',
    range: '₹5L – ₹20L',
    returnPct: '12–15% p.a.',
    features: [
      'Daily EOD update (email)',
      'Monthly PDF report',
      'Dedicated investor dashboard',
      'WhatsApp alerts',
    ],
  },
  {
    name: 'Growth',
    range: '₹20L – ₹1Cr',
    returnPct: '15–18% p.a.',
    features: [
      'All Starter features',
      'SMS + WhatsApp notifications',
      'Priority support',
      'Quarterly strategy review call',
    ],
    highlight: true,
  },
  {
    name: 'Premier',
    range: '₹1Cr+',
    returnPct: '18–22% p.a.',
    features: [
      'All Growth features',
      'Custom allocation strategy',
      'Monthly video review',
      'Direct fund manager access',
    ],
  },
]

export default function ServicesPage() {
  return (
    <div className="py-20">
      <div className="mx-auto max-w-5xl px-6">
        <FadeUp className="mb-14 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gold">Services</p>
          <h1 className="text-4xl font-extrabold sm:text-5xl">Investment Tiers</h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
            Choose the tier that matches your capital. All returns are fixed and guaranteed
            in your investor agreement.
          </p>
        </FadeUp>

        <Stagger className="grid gap-6 md:grid-cols-3">
          {tiers.map((t) => (
            <StaggerItem key={t.name}>
            <Card
              className={`relative flex flex-col h-full ${
                t.highlight
                  ? 'border-gold bg-charcoal shadow-[0_0_30px_rgba(212,175,55,0.15)]'
                  : 'border-gold/20 bg-charcoal hover:border-gold/40 transition-colors'
              }`}
            >
              {t.highlight && (
                <div className="absolute right-4 top-4 rounded-full bg-gold px-4 py-1 text-xs font-bold text-navy-deep">
                  Most Popular
                </div>
              )}
              <CardHeader className="pb-3">
                <CardTitle className="text-xl">{t.name}</CardTitle>
                <p className="text-2xl font-extrabold text-gold terminal-text">{t.returnPct}</p>
                <p className="text-sm text-muted-foreground">{t.range} investment</p>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col">
                <ul className="flex flex-1 flex-col gap-3">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/contact"
                  className={cn(
                    buttonVariants({ variant: t.highlight ? 'default' : 'outline' }),
                    'mt-6 w-full font-semibold',
                    t.highlight
                      ? 'bg-gold text-navy-deep hover:bg-gold-light'
                      : 'border border-gold/40 bg-transparent hover:bg-charcoal',
                  )}
                >
                  Enquire Now
                </Link>
              </CardContent>
            </Card>
            </StaggerItem>
          ))}
        </Stagger>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          All investment plans are subject to a signed investor agreement.{' '}
          <Link href="/contact" className="text-gold hover:underline">Contact us</Link>{' '}
          to get started.
        </p>
      </div>
    </div>
  )
}
