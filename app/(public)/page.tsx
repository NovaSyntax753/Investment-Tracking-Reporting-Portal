'use client'

import Link from 'next/link'
import { buttonVariants } from '@/lib/buttonVariants'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle2 } from 'lucide-react'
import { HeroItem, FadeUp, Stagger, StaggerItem } from '@/components/Animate'

const stats = [
  { label: 'Total Investors', value: '48+' },
  { label: 'Total Funds Managed', value: '₹14.2 Crore+' },
  { label: 'Monthly Returns Delivered', value: '₹2.1 Crore+' },
]

const whyChoose = [
  'Fixed Monthly Returns',
  'Professional Market Trading',
  'Daily Tracking Transparency',
  'Secure & Trusted System',
]

const howItWorks = [
  {
    step: 'Step 1: Investment',
    text: 'You invest a fixed amount (for example ₹10,00,000).',
  },
  {
    step: 'Step 2: Agreement',
    text: 'A fixed monthly return percentage is decided and locked.',
  },
  {
    step: 'Step 3: Trading Execution',
    text: 'Our expert team trades in the stock market using your funds.',
  },
  {
    step: 'Step 4: Daily Tracking',
    text: 'Your account is updated daily and visible in your dashboard.',
  },
  {
    step: 'Step 5: Monthly Returns',
    text: 'You receive fixed returns every month, irrespective of market performance.',
  },
]

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden bg-navy-deep py-28">
        <div
          className="pointer-events-none absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'radial-gradient(ellipse 80% 60% at 50% 0%, #d4af37, transparent)',
          }}
        />
        <div className="relative mx-auto max-w-5xl px-6 text-center">
          <HeroItem delay={0}>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-charcoal px-4 py-1.5 text-xs font-medium text-gold tracking-widest uppercase">
              RK Smart Money
            </div>
          </HeroItem>
          <HeroItem delay={0.1}>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
              Smart Investments. <span className="text-gold">Consistent Returns.</span>
            </h1>
          </HeroItem>
          <HeroItem delay={0.2}>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              We help investors grow their wealth through strategic market trading while
              delivering fixed monthly returns.
            </p>
          </HeroItem>
          <HeroItem delay={0.35}>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link href="/contact" className={cn(buttonVariants({ size: 'lg' }), 'bg-gold text-navy-deep font-bold text-base hover:bg-gold-light px-8')}>
                Get Started
              </Link>
              <Link href="/login" className={cn(buttonVariants({ size: 'lg', variant: 'outline' }), 'border-gold/40 text-foreground hover:bg-charcoal px-8')}>
                Login to Dashboard
              </Link>
            </div>
          </HeroItem>
        </div>
      </section>

      <section className="py-20 bg-navy">
        <div className="mx-auto max-w-6xl px-6">
          <FadeUp className="mb-10 text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">About Preview</h2>
            <p className="mt-4 text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              At RK Smart Money, we specialize in managing investments through advanced stock market
              trading strategies. Our goal is simple - to deliver reliable monthly returns while maintaining
              transparency and trust.
            </p>
            <p className="mt-4 text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              We work with a closed group of investors and provide them with fixed return commitments,
              daily performance tracking, and monthly reporting.
            </p>
          </FadeUp>

          <FadeUp delay={0.1} className="mx-auto max-w-3xl rounded-xl border border-gold/20 bg-charcoal p-6">
            <h3 className="text-xl font-semibold text-center mb-5">Why Choose Us</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {whyChoose.map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-gold" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </FadeUp>
        </div>
      </section>

      <section className="border-y border-gold/20 bg-charcoal py-8">
        <div className="mx-auto max-w-6xl px-6">
          <Stagger className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {stats.map((s) => (
              <StaggerItem key={s.label} className="text-center">
                <p className="text-3xl font-extrabold terminal-text text-gold">{s.value}</p>
                <p className="mt-1 text-xs text-muted-foreground uppercase tracking-wider">{s.label}</p>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      <section className="py-24 bg-navy">
        <div className="mx-auto max-w-6xl px-6">
          <FadeUp className="mb-14 text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">
              How It Works <span className="text-gold">(Detailed)</span>
            </h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              Clear process from investment onboarding to monthly return delivery.
            </p>
          </FadeUp>

          <Stagger className="grid gap-6 md:grid-cols-2">
            {howItWorks.map((item) => (
              <StaggerItem key={item.step}>
                <Card className="bg-charcoal border-gold/20 h-full">
                  <CardContent className="pt-6">
                    <h3 className="mb-2 font-semibold text-gold">{item.step}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.text}</p>
                  </CardContent>
                </Card>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>
    </>
  )
}
