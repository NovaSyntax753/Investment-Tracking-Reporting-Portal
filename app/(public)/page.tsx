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

const confidencePillars = [
  {
    title: 'Risk-Controlled Trading',
    text: 'Every trade follows a predefined risk framework designed to protect investor capital during volatile market sessions.',
  },
  {
    title: 'Disciplined Capital Allocation',
    text: 'Investor funds are allocated based on strategy performance, liquidity, and market conditions instead of short-term speculation.',
  },
  {
    title: 'Transparent Communication',
    text: 'From daily updates to monthly statements, investors can clearly understand where performance comes from and how returns are maintained.',
  },
]

export default function HomePage() {
  return (
    <>
      <section className="relative flex min-h-[88vh] items-center justify-center overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1920&q=80"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 -z-10 h-full w-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 -z-10 bg-navy-deep/70" />
        <div className="absolute bottom-0 left-0 right-0 -z-10 h-32 bg-gradient-to-t from-navy-deep to-transparent" />
        <div className="relative mx-auto max-w-6xl px-6 text-center">
          <HeroItem delay={0}>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-charcoal px-6 py-2.5 text-lg font-bold text-gold tracking-widest uppercase">
              RK Smart Money
            </div>
          </HeroItem>
          <HeroItem delay={0.1}>
            <h1 className="text-5xl font-extrabold leading-tight tracking-tight sm:text-6xl">
              Smart Investments. <span className="text-gold">Consistent Returns.</span>
            </h1>
          </HeroItem>
          <HeroItem delay={0.2}>
            <p className="mx-auto mt-6 max-w-3xl text-2xl font-medium leading-relaxed text-foreground/90">
              We help investors grow their wealth through strategic market trading while
              delivering fixed monthly returns.
            </p>
          </HeroItem>
          <HeroItem delay={0.35}>
            <div className="mt-12 flex flex-wrap items-center justify-center gap-5">
              <Link href="/contact" className={cn(buttonVariants({ size: 'lg' }), 'bg-gold text-navy-deep font-bold text-lg hover:bg-gold-light px-10 py-7')}>
                Get Started
              </Link>
              <Link href="/login" className={cn(buttonVariants({ size: 'lg', variant: 'outline' }), 'border-gold/40 text-foreground text-lg hover:bg-charcoal px-10 py-7')}>
                Login to Dashboard
              </Link>
            </div>
          </HeroItem>
        </div>
      </section>

      <section className="bg-navy py-24">
        <div className="mx-auto max-w-6xl px-6">
          <FadeUp className="mb-12 text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">About Us</h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              At RK Smart Money, we specialize in managing investments through advanced stock market
              trading strategies. Our goal is simple - to deliver reliable monthly returns while maintaining
              transparency and trust.
            </p>
            <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              We work with a closed group of investors and provide them with fixed return commitments,
              daily performance tracking, and monthly reporting.
            </p>
            <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Our approach combines deep market execution experience with a process-first operations model so
              investors can focus on income planning instead of short-term market noise.
            </p>
          </FadeUp>

          <FadeUp delay={0.1} className="mx-auto max-w-4xl rounded-xl border border-gold/20 bg-charcoal p-8 md:p-10 bg-dot-grid">
            <h3 className="mb-6 text-4xl font-bold text-center">Why Choose Us</h3>
            <div className="grid gap-5 sm:grid-cols-2 sm:justify-items-center">
              {whyChoose.map((item) => (
                <div key={item} className="flex w-full max-w-xs items-center gap-3 text-xl font-medium text-foreground">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-gold" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </FadeUp>

          <Stagger className="mt-10 grid gap-8 md:grid-cols-3">
            {confidencePillars.map((pillar) => (
              <StaggerItem key={pillar.title}>
                <Card className="bg-charcoal border-gold/20 h-full card-glow">
                  <CardContent className="p-7">
                    <h3 className="text-2xl font-semibold text-gold">{pillar.title}</h3>
                    <p className="mt-3 text-lg text-muted-foreground leading-relaxed">{pillar.text}</p>
                  </CardContent>
                </Card>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      <section className="border-y border-gold/20 bg-charcoal py-12 bg-dot-grid">
        <div className="mx-auto max-w-6xl px-6">
          <Stagger className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {stats.map((s) => (
              <StaggerItem key={s.label} className="text-center">
                <p className="shimmer-text text-3xl font-extrabold terminal-text">{s.value}</p>
                <p className="mt-1 text-base text-muted-foreground uppercase tracking-wider">{s.label}</p>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      <section className="bg-navy py-28">
        <div className="mx-auto max-w-6xl px-6">
          <FadeUp className="mb-14 text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">
              How It Works <span className="text-gold">(Detailed)</span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Clear process from investment onboarding to monthly return delivery.
            </p>
          </FadeUp>

          <div className="grid items-start gap-10 lg:grid-cols-2">
            <Stagger className="grid gap-6">
              {howItWorks.map((item) => (
                <StaggerItem key={item.step}>
                  <Card className="bg-charcoal border-gold/20 h-full card-glow">
                    <CardContent className="p-7">
                      <h3 className="mb-2 text-2xl font-bold text-gold">{item.step}</h3>
                      <p className="text-lg text-muted-foreground leading-relaxed">{item.text}</p>
                    </CardContent>
                  </Card>
                </StaggerItem>
              ))}
            </Stagger>

            <FadeUp delay={0.2} className="hidden lg:block">
              <div className="space-y-6">
                <div className="relative overflow-hidden rounded-2xl">
                  <img
                    src="https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=800&q=80"
                    alt="Professional trading analysis"
                    className="h-[520px] w-full rounded-2xl object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-navy-deep/60 to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6">
                    <p className="border-l-2 border-gold pl-3 text-sm italic text-white/80">
                      "Professional market execution. Transparent reporting. Consistent returns."
                    </p>
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-2xl">
                  <img
                    src="https://images.unsplash.com/photo-1559526324-593bc073d938?auto=format&fit=crop&w=800&q=80"
                    alt="Portfolio monitoring"
                    className="h-[320px] w-full rounded-2xl object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-navy-deep/70 via-navy-deep/20 to-transparent" />
                  <div className="absolute bottom-5 left-5 right-5">
                    <p className="text-sm text-white/85 border-l-2 border-gold pl-3 italic">
                      "Data-driven decisions with disciplined risk management."
                    </p>
                  </div>
                </div>
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-t border-gold/20 py-24">
        <img
          src="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1920&q=80"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 -z-10 h-full w-full object-cover opacity-5"
          loading="lazy"
        />
        <div className="mx-auto max-w-6xl px-6">
          <FadeUp className="mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">Long-Term Investor Commitment</h2>
            <p className="mt-5 text-lg text-muted-foreground leading-relaxed">
              We are committed to building multi-year investor relationships through process discipline,
              consistent monthly reporting, and responsive support at every stage of your investment journey.
            </p>
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
              Whether you are an experienced investor or entering structured investing for the first time,
              our objective remains the same: predictable outcomes, clear communication, and trust-based growth.
            </p>
          </FadeUp>
        </div>
      </section>
    </>
  )
}
