'use client'

import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle2 } from 'lucide-react'
import { FadeUp, Stagger, StaggerItem } from '@/components/Animate'

const trustPoints = [
  'Experienced market handling',
  'Structured investment system',
  'Transparent reporting',
  'Long-term client relationships',
]

const investorBenefits = [
  'Fixed monthly return commitment for better financial planning',
  'Daily update visibility through a structured reporting system',
  'Professional stock market execution by an experienced team',
  'Dedicated investor communication and long-term relationship support',
]

const operatingPrinciples = [
  {
    title: 'Capital Protection First',
    text: 'Our first priority is preserving investor capital through position sizing, exposure limits, and controlled risk execution.',
  },
  {
    title: 'Process Over Emotion',
    text: 'Trades are executed using a system-driven approach instead of emotional market decisions, helping maintain consistency over time.',
  },
  {
    title: 'Measured Growth',
    text: 'We focus on sustainable monthly returns and stable long-term outcomes rather than chasing unsustainable short-term spikes.',
  },
]

export default function AboutPage() {
  return (
    <div className="py-24">
      <div className="mx-auto max-w-4xl px-6">
        <FadeUp className="mb-16 text-center">
          <p className="mb-3 text-2xl font-semibold uppercase tracking-widest text-gold">About Us</p>
          <h1 className="text-5xl font-extrabold sm:text-5xl">RK Smart Money</h1>
          <p className="mt-5 text-xl text-muted-foreground leading-relaxed">
            A financial management platform designed for individuals seeking consistent and predictable returns on their investments.
          </p>
        </FadeUp>

        <FadeUp delay={0.1} className="mb-10">
          <Card className="bg-charcoal border-gold/20">
            <CardContent className="p-8 space-y-4">
              <h2 className="text-3xl font-bold">Who We Are</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                We operate by pooling investor funds and deploying them into carefully analyzed stock market opportunities.
                Unlike traditional investing, we offer fixed return commitments, making it easier for investors to plan
                their financial future.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Over time, we have built a disciplined investor-focused framework that combines market expertise,
                structured communication, and performance accountability.
              </p>
            </CardContent>
          </Card>
        </FadeUp>

        <Stagger className="grid gap-6 sm:grid-cols-2">
          <StaggerItem>
            <Card className="bg-charcoal border-gold/20 h-full">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-gold">Our Philosophy</h3>
                <p className="mt-2 text-lg text-muted-foreground">We believe that investing should be simple, transparent, and reliable.</p>
                <p className="mt-2 text-lg text-muted-foreground">Our system ensures that investors do not have to worry about daily market fluctuations.</p>
              </CardContent>
            </Card>
          </StaggerItem>

          <StaggerItem>
            <Card className="bg-charcoal border-gold/20 h-full">
              <CardContent className="p-6">
                <h3 className="text-2xl font-semibold text-gold">Our Mission</h3>
                <p className="mt-2 text-lg text-muted-foreground">To provide a secure and reliable investment ecosystem where investors can earn consistent monthly income.</p>
              </CardContent>
            </Card>
          </StaggerItem>

          <StaggerItem>
            <Card className="bg-charcoal border-gold/20 h-full">
              <CardContent className="p-6">
                <h3 className="text-2xl font-semibold text-gold">Our Vision</h3>
                <p className="mt-2 text-lg text-muted-foreground">To become a trusted name in investment management by delivering stable returns and maintaining long-term investor relationships.</p>
              </CardContent>
            </Card>
          </StaggerItem>

          <StaggerItem>
            <Card className="bg-charcoal border-gold/20 h-full">
              <CardContent className="p-6">
                <h3 className="text-2xl font-semibold text-gold">Why Trust Us?</h3>
                <div className="mt-3 space-y-2 text-lg">
                  {trustPoints.map((point) => (
                    <p key={point} className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle2 className="h-5 w-5 text-gold" />
                      {point}
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>
          </StaggerItem>
        </Stagger>

        <FadeUp delay={0.15} className="mt-10">
          <Card className="bg-charcoal border-gold/20">
            <CardContent className="p-8">
              <h2 className="text-3xl font-bold">What Investors Receive</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {investorBenefits.map((benefit) => (
                  <p key={benefit} className="flex items-start gap-2 text-lg text-muted-foreground leading-relaxed">
                    <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-gold" />
                    <span>{benefit}</span>
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>
        </FadeUp>

        <Stagger className="mt-10 grid gap-6 md:grid-cols-3">
          {operatingPrinciples.map((principle) => (
            <StaggerItem key={principle.title}>
              <Card className="bg-charcoal border-gold/20 h-full">
                <CardContent className="p-6">
                  <h3 className="text-2xl font-semibold text-gold">{principle.title}</h3>
                  <p className="mt-3 text-lg text-muted-foreground leading-relaxed">{principle.text}</p>
                </CardContent>
              </Card>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </div>
  )
}
