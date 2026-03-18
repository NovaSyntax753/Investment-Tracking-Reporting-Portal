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

export default function AboutPage() {
  return (
    <div className="py-20">
      <div className="mx-auto max-w-4xl px-6">
        <FadeUp className="mb-16 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gold">About Us</p>
          <h1 className="text-4xl font-extrabold sm:text-5xl">RK Smart Money</h1>
          <p className="mt-5 text-lg text-muted-foreground leading-relaxed">
            A financial management platform designed for individuals seeking consistent and predictable returns on their investments.
          </p>
        </FadeUp>

        <FadeUp delay={0.1} className="mb-8">
          <Card className="bg-charcoal border-gold/20">
            <CardContent className="pt-6 space-y-4">
              <h2 className="text-2xl font-bold">Who We Are</h2>
              <p className="text-muted-foreground leading-relaxed">
                We operate by pooling investor funds and deploying them into carefully analyzed stock market opportunities.
                Unlike traditional investing, we offer fixed return commitments, making it easier for investors to plan
                their financial future.
              </p>
            </CardContent>
          </Card>
        </FadeUp>

        <Stagger className="grid gap-5 sm:grid-cols-2">
          <StaggerItem>
            <Card className="bg-charcoal border-gold/20 h-full">
              <CardContent className="pt-5">
                <h3 className="font-semibold text-gold">Our Philosophy</h3>
                <p className="mt-2 text-sm text-muted-foreground">We believe that investing should be simple, transparent, and reliable.</p>
                <p className="mt-2 text-sm text-muted-foreground">Our system ensures that investors do not have to worry about daily market fluctuations.</p>
              </CardContent>
            </Card>
          </StaggerItem>

          <StaggerItem>
            <Card className="bg-charcoal border-gold/20 h-full">
              <CardContent className="pt-5">
                <h3 className="font-semibold text-gold">Our Mission</h3>
                <p className="mt-2 text-sm text-muted-foreground">To provide a secure and reliable investment ecosystem where investors can earn consistent monthly income.</p>
              </CardContent>
            </Card>
          </StaggerItem>

          <StaggerItem>
            <Card className="bg-charcoal border-gold/20 h-full">
              <CardContent className="pt-5">
                <h3 className="font-semibold text-gold">Our Vision</h3>
                <p className="mt-2 text-sm text-muted-foreground">To become a trusted name in investment management by delivering stable returns and maintaining long-term investor relationships.</p>
              </CardContent>
            </Card>
          </StaggerItem>

          <StaggerItem>
            <Card className="bg-charcoal border-gold/20 h-full">
              <CardContent className="pt-5">
                <h3 className="font-semibold text-gold">Why Trust Us?</h3>
                <div className="mt-3 space-y-2 text-sm">
                  {trustPoints.map((point) => (
                    <p key={point} className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-gold" />
                      {point}
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>
          </StaggerItem>
        </Stagger>
      </div>
    </div>
  )
}
