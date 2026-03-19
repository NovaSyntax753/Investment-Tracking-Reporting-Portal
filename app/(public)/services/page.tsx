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

const workflowSteps = [
  {
    title: '1. Investor Onboarding',
    text: 'We begin with profile setup, investment mapping, and return plan alignment so every investor starts with complete clarity.',
  },
  {
    title: '2. Capital Deployment',
    text: 'Funds are deployed using strategy-based execution with controlled risk and disciplined market participation.',
  },
  {
    title: '3. Daily Monitoring',
    text: 'Performance is tracked daily and updates are recorded to maintain transparency on portfolio movement.',
  },
  {
    title: '4. Monthly Performance Review',
    text: 'At month end, reports summarize account activity, returns delivered, and actionable insights for continuity.',
  },
]

const commitmentPoints = [
  'Structured risk management before every execution cycle',
  'Transparent reporting standards with regular communication',
  'Human support for investor queries and operational assistance',
  'Process-driven approach focused on consistency over speculation',
]

const supportPoints = [
  'Dedicated contact support for onboarding and account help',
  'Guidance for understanding reports and monthly performance',
  'Timely communication for updates, alerts, and key events',
]

export default function ServicesPage() {
  return (
    <div className="py-24">
      <div className="mx-auto max-w-6xl px-6">
        <FadeUp className="mb-14 text-center">
          <p className="mb-3 text-2xl font-semibold uppercase tracking-widest text-gold">Services</p>
          <h1 className="text-5xl font-extrabold sm:text-5xl">What We Offer</h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Detailed investor services designed for transparency, consistency, and reliable monthly outcomes.
          </p>
        </FadeUp>

        <Stagger className="grid gap-8 md:grid-cols-2">
          {services.map((service) => (
            <StaggerItem key={service.title}>
              <Card className="bg-charcoal border-gold/20 h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-2xl text-gold">{service.title}</CardTitle>
                </CardHeader>
                <CardContent className="pb-7">
                  <p className="text-lg text-muted-foreground leading-relaxed">{service.description}</p>
                </CardContent>
              </Card>
            </StaggerItem>
          ))}
        </Stagger>

        <div className="mt-8 grid gap-8 md:grid-cols-3">
          <Card className="bg-charcoal border-gold/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl">Investor Dashboard</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {dashboardPoints.map((point) => (
                <p key={point} className="flex items-center gap-2 text-lg text-muted-foreground">
                  <CheckCircle2 className="h-5 w-5 text-gold" />
                  {point}
                </p>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-charcoal border-gold/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl">Automated Notifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {notificationPoints.map((point) => (
                <p key={point} className="flex items-center gap-2 text-lg text-muted-foreground">
                  <CheckCircle2 className="h-5 w-5 text-gold" />
                  {point}
                </p>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-charcoal border-gold/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl">Monthly Reporting Includes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {reportingPoints.map((point) => (
                <p key={point} className="flex items-center gap-2 text-lg text-muted-foreground">
                  <CheckCircle2 className="h-5 w-5 text-gold" />
                  {point}
                </p>
              ))}
            </CardContent>
          </Card>
        </div>

        <FadeUp delay={0.15} className="mt-14 text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">Our Service Workflow</h2>
          <p className="mx-auto mt-4 max-w-3xl text-lg text-muted-foreground leading-relaxed">
            Our delivery model is designed to keep investors informed at every stage, from onboarding to monthly performance review.
          </p>
        </FadeUp>

        <Stagger className="mt-10 grid gap-8 md:grid-cols-2">
          {workflowSteps.map((step) => (
            <StaggerItem key={step.title}>
              <Card className="bg-charcoal border-gold/20 h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-2xl text-gold">{step.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg text-muted-foreground leading-relaxed">{step.text}</p>
                </CardContent>
              </Card>
            </StaggerItem>
          ))}
        </Stagger>

        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          <Card className="bg-charcoal border-gold/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl text-gold">Our Commitment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {commitmentPoints.map((point) => (
                <p key={point} className="flex items-start gap-2 text-lg text-muted-foreground leading-relaxed">
                  <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-gold" />
                  <span>{point}</span>
                </p>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-charcoal border-gold/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl text-gold">Investor Support</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {supportPoints.map((point) => (
                <p key={point} className="flex items-start gap-2 text-lg text-muted-foreground leading-relaxed">
                  <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-gold" />
                  <span>{point}</span>
                </p>
              ))}
            </CardContent>
          </Card>
        </div>

        <FadeUp delay={0.2} className="mt-14 rounded-xl border border-gold/20 bg-charcoal p-8 md:p-10 text-center">
          <h3 className="text-2xl font-bold text-gold">Built for Long-Term Investor Confidence</h3>
          <p className="mx-auto mt-4 max-w-3xl text-lg text-muted-foreground leading-relaxed">
            Every service we provide is focused on reliability, clarity, and disciplined market execution so investors can plan confidently and track performance with ease.
          </p>
        </FadeUp>
      </div>
    </div>
  )
}
