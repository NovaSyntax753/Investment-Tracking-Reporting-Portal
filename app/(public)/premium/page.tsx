'use client'

import Link from 'next/link'
import { buttonVariants } from '@/lib/buttonVariants'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FadeUp, Stagger, StaggerItem } from '@/components/Animate'
import { CheckCircle2, TriangleAlert } from 'lucide-react'

const signalPoints = [
  'Accurate Entry Points',
  'Target Levels',
  'Stop Loss Guidance',
]

const marketPoints = [
  'Regular updates on market trends',
  'Key levels and breakout alerts',
]

const realtimePoints = [
  'Instant signal delivery',
  'Quick reaction to market movements',
]

const consistencyPoints = [
  'Trades designed for disciplined execution',
  'Risk-managed strategies',
]

const whoShouldJoin = [
  'Traders looking for expert guidance',
  'Beginners who need direction',
  "Busy individuals who can’t track markets full-time",
]

const steps = [
  'Subscribe to Premium Membership',
  'Get access to our private Telegram group',
  'Receive daily trading signals',
  'Execute trades on your own account',
  'Follow targets and stop loss for best results',
]

const guidelines = [
  'Always follow proper risk management',
  'Do not overtrade',
  'Stick to given stop loss and targets',
  'Trade responsibly',
]

export default function PremiumPage() {
  const whatsappJoinUrl = process.env.NEXT_PUBLIC_PREMIUM_WHATSAPP_URL || 'https://wa.me/'
  const telegramJoinUrl = process.env.NEXT_PUBLIC_PREMIUM_TELEGRAM_URL || 'https://t.me/'

  return (
    <div className="py-24">
      <div className="mx-auto max-w-6xl px-6">
        <FadeUp className="text-center mb-16">
          <p className="mb-3 text-2xl font-semibold uppercase tracking-widest text-gold">Premium Membership</p>
          <h1 className="text-5xl font-extrabold sm:text-5xl">RK Smart Money Premium Membership</h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
            Get Expert Trading Signals. Maximize Your Profits.
          </p>
          <p className="mt-3 text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Join our exclusive Telegram community and receive high-quality trade signals, market insights,
            and expert guidance - designed to help you make smarter trading decisions.
          </p>
          <p className="mt-3 text-2xl text-gold font-bold">Trade smarter, not harder.</p>
        </FadeUp>

        <div className="mb-10 grid gap-8 lg:grid-cols-3">
          <Card className="bg-charcoal border-gold/20 lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl text-gold">What is Premium Membership?</CardTitle>
            </CardHeader>
            <CardContent className="text-lg text-muted-foreground leading-relaxed">
              RK Smart Money Premium Membership is a subscription-based service where members receive carefully analyzed
              trading signals directly on Telegram. These signals are based on market research, technical analysis,
              and experience - helping you identify profitable opportunities in real-time.
            </CardContent>
          </Card>

          <Card className="bg-charcoal border-gold">
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl text-gold">Membership Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-lg">
              <p><span className="text-muted-foreground">Monthly Subscription Fee:</span> <span className="font-semibold">₹2500</span></p>
              <p><span className="text-muted-foreground">Validity:</span> <span className="font-semibold">30 Days</span></p>
              <p><span className="text-muted-foreground">Platform:</span> <span className="font-semibold">Private Telegram Group</span></p>
            </CardContent>
          </Card>
        </div>

        <FadeUp className="mb-8">
          <h2 className="text-4xl font-bold">What You Will Get</h2>
        </FadeUp>

        <Stagger className="grid gap-8 md:grid-cols-2">
          <StaggerItem>
            <Card className="bg-charcoal border-gold/20 h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl text-gold">Daily Trade Signals</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-lg">
                {signalPoints.map((point) => (
                  <p key={point} className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle2 className="h-5 w-5 text-gold" />
                    {point}
                  </p>
                ))}
              </CardContent>
            </Card>
          </StaggerItem>

          <StaggerItem>
            <Card className="bg-charcoal border-gold/20 h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl text-gold">Market Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-lg">
                {marketPoints.map((point) => (
                  <p key={point} className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle2 className="h-5 w-5 text-gold" />
                    {point}
                  </p>
                ))}
              </CardContent>
            </Card>
          </StaggerItem>

          <StaggerItem>
            <Card className="bg-charcoal border-gold/20 h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl text-gold">Real-Time Updates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-lg">
                {realtimePoints.map((point) => (
                  <p key={point} className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle2 className="h-5 w-5 text-gold" />
                    {point}
                  </p>
                ))}
              </CardContent>
            </Card>
          </StaggerItem>

          <StaggerItem>
            <Card className="bg-charcoal border-gold/20 h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl text-gold">Focus on Consistency</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-lg">
                {consistencyPoints.map((point) => (
                  <p key={point} className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle2 className="h-5 w-5 text-gold" />
                    {point}
                  </p>
                ))}
              </CardContent>
            </Card>
          </StaggerItem>
        </Stagger>

        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <Card className="bg-charcoal border-gold/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl text-gold">Who Should Join?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-lg">
              {whoShouldJoin.map((point) => (
                <p key={point} className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle2 className="h-5 w-5 text-gold" />
                  {point}
                </p>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-charcoal border-gold/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl text-gold">How It Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-lg">
              {steps.map((step, index) => (
                <p key={step} className="text-muted-foreground">
                  <span className="text-lg text-gold font-bold">{index + 1}.</span> {step}
                </p>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card className="mt-10 bg-charcoal border-gold/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl text-gold">Important Guidelines</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2 text-lg">
            {guidelines.map((point) => (
              <p key={point} className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle2 className="h-5 w-5 text-gold" />
                {point}
              </p>
            ))}
          </CardContent>
        </Card>

        <FadeUp className="mt-12 text-center">
          <h3 className="text-3xl font-bold text-gold">Join Premium Now - ₹2500/month</h3>
          <p className="mt-3 text-lg text-muted-foreground">Start receiving expert trading signals today.</p>
          <div className="mt-6 flex items-center justify-center gap-4 flex-wrap">
            <Link href={whatsappJoinUrl} target="_blank" rel="noopener noreferrer" className={cn(buttonVariants({ size: 'lg' }), 'bg-gold text-navy-deep text-lg font-bold hover:bg-gold-light px-8')}>
              Join on WhatsApp
            </Link>
            <Link href={telegramJoinUrl} target="_blank" rel="noopener noreferrer" className={cn(buttonVariants({ size: 'lg', variant: 'outline' }), 'border-gold/40 text-lg px-8')}>
              Join on Telegram
            </Link>
            <Link href="/login" className={cn(buttonVariants({ size: 'lg', variant: 'ghost' }), 'text-lg px-8')}>
              Investor Login
            </Link>
          </div>
        </FadeUp>

        <Card className="mt-12 border-amber-500/40 bg-amber-500/10">
          <CardContent className="pt-6">
            <p className="flex items-start gap-2 text-base text-amber-200 leading-relaxed">
              <TriangleAlert className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                RK Smart Money provides trading signals for educational and informational purposes only. We do not guarantee
                profits. Trading in financial markets involves risk. Users are advised to trade at their own discretion.
              </span>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
