import Link from 'next/link'
import { buttonVariants } from '@/lib/buttonVariants'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Shield, TrendingUp, BarChart3, Bell, Lock, FileText } from 'lucide-react'

const stats = [
  { label: 'Assets Under Management', value: '₹12 Crore+' },
  { label: 'Active Investors', value: '45+' },
  { label: 'Avg. Annual Return', value: '18–22%' },
  { label: 'Years of Experience', value: '10+' },
]

const features = [
  {
    icon: <TrendingUp className="h-7 w-7 text-gold" />,
    title: 'Daily P&L Updates',
    desc: 'Receive your end-of-day portfolio value directly via email, SMS, and WhatsApp every trading session.',
  },
  {
    icon: <FileText className="h-7 w-7 text-gold" />,
    title: 'Monthly Reports',
    desc: 'Detailed PDF reports delivered to your portal each month with full trade breakdowns and analytics.',
  },
  {
    icon: <Shield className="h-7 w-7 text-gold" />,
    title: 'Capital Protection Focus',
    desc: 'Disciplined risk management with pre-defined fixed return structures to protect your capital.',
  },
  {
    icon: <BarChart3 className="h-7 w-7 text-gold" />,
    title: 'Transparent Reporting',
    desc: 'Real-time access to your personal investor dashboard with full historical data.',
  },
  {
    icon: <Bell className="h-7 w-7 text-gold" />,
    title: 'Instant Notifications',
    desc: 'Never miss a market update. Multi-channel alerts keep you informed around the clock.',
  },
  {
    icon: <Lock className="h-7 w-7 text-gold" />,
    title: 'Private & Secure',
    desc: 'Closed-access platform. Only verified investors have access to their accounts.',
  },
]

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-navy-deep py-28">
        <div
          className="pointer-events-none absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'radial-gradient(ellipse 80% 60% at 50% 0%, #d4af37, transparent)',
          }}
        />
        <div className="relative mx-auto max-w-5xl px-6 text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-charcoal px-4 py-1.5 text-xs font-medium text-gold tracking-widest uppercase">
            Private Investment Platform
          </div>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
            Grow Your Wealth with{' '}
            <span className="text-gold">Institutional Precision</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            AlphaCapital offers curated equity and derivatives strategies with a focus on
            controlled risk, fixed returns, and complete transparency — directly in your
            investor portal.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link href="/login" className={cn(buttonVariants({ size: 'lg' }), 'bg-gold text-navy-deep font-bold text-base hover:bg-gold-light px-8')}>
              Access Your Portal
            </Link>
            <Link href="/services" className={cn(buttonVariants({ size: 'lg', variant: 'outline' }), 'border-gold/40 text-foreground hover:bg-charcoal px-8')}>
              View Services
            </Link>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-gold/20 bg-charcoal py-8">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-extrabold terminal-text text-gold">{s.value}</p>
                <p className="mt-1 text-xs text-muted-foreground uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-navy">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">
              Everything You Need,{' '}
              <span className="text-gold">Nothing You Don&apos;t</span>
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              A Bloomberg-grade investor experience designed for serious capital allocators.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <Card key={f.title} className="bg-charcoal border-gold/20 hover:border-gold/40 transition-all hover:-translate-y-0.5">
                <CardContent className="pt-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-navy border border-gold/20">
                    {f.icon}
                  </div>
                  <h3 className="mb-2 font-semibold text-foreground">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-navy-deep">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Ready to Start <span className="text-gold">Investing Smarter</span>?
          </h2>
          <p className="mt-4 text-muted-foreground">
            Reach out to learn more about how AlphaCapital can work for your financial goals.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link href="/contact" className={cn(buttonVariants({ size: 'lg' }), 'bg-gold text-navy-deep font-bold hover:bg-gold-light px-8')}>
              Get In Touch
            </Link>
            <Link href="/about" className={cn(buttonVariants({ size: 'lg', variant: 'outline' }), 'border-gold/40 hover:bg-charcoal px-8')}>
              Learn About Us
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
