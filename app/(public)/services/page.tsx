'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2 } from 'lucide-react'
import { FadeUp, Stagger, StaggerItem } from '@/components/Animate'

const services = [
  {
    title: 'Investment Management',
    description:
      'We manage investor funds through disciplined and strategic trading in the stock market. Our focus is on risk management and consistent performance.',
  },
  {
    title: 'Fixed Return Investment Plans',
    description:
      'Unlike traditional market investments, we offer pre-agreed fixed returns, giving investors clarity and stability.',
  },
  {
    title: 'Daily Updates',
    description:
      'We provide end-of-day updates so you always know your investment status.',
  },
  {
    title: 'Monthly Reporting',
    description:
      'At the end of every month, a detailed report is generated including investment summary, returns delivered, and performance overview.',
  },
]

const dashboardPoints = [
  'View invested amount',
  'Track daily updates',
  'Monitor performance',
  'Access reports',
]

const notificationPoints = [
  'WhatsApp updates',
  'SMS alerts',
  'Email notifications',
]

const reportingPoints = [
  'Investment summary',
  'Returns delivered',
  'Performance overview',
]

export default function ServicesPage() {
  return (
    <div className="py-20">
      <div className="mx-auto max-w-5xl px-6">
        <FadeUp className="mb-14 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gold">Services</p>
          <h1 className="text-4xl font-extrabold sm:text-5xl">What We Offer</h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Detailed investor services designed for transparency, consistency, and reliable monthly outcomes.
          </p>
        </FadeUp>

        <Stagger className="grid gap-6 md:grid-cols-2">
          {services.map((service) => (
            <StaggerItem key={service.title}>
              <Card className="bg-charcoal border-gold/20 h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl text-gold">{service.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">{service.description}</p>
                </CardContent>
              </Card>
            </StaggerItem>
          ))}
        </Stagger>

        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <Card className="bg-charcoal border-gold/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Investor Dashboard</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {dashboardPoints.map((point) => (
                <p key={point} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-gold" />
                  {point}
                </p>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-charcoal border-gold/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Automated Notifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {notificationPoints.map((point) => (
                <p key={point} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-gold" />
                  {point}
                </p>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-charcoal border-gold/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Monthly Reporting Includes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {reportingPoints.map((point) => (
                <p key={point} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-gold" />
                  {point}
                </p>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
