import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { logoutAction } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { LayoutDashboard, FileText, LogOut } from 'lucide-react'
import BrandLogo from '@/components/BrandLogo'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: investor } = await supabase
    .from('investors')
    .select('name, email')
    .eq('id', user.id)
    .single()

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
    { href: '/dashboard/reports', label: 'Monthly Reports', icon: <FileText className="h-5 w-5" /> },
  ]

  return (
    <div className="investor-zone flex min-h-screen flex-col bg-navy-deep md:flex-row">
      {/* Mobile top bar + desktop sidebar */}
      <aside className="w-full shrink-0 border-b border-gold/15 bg-gradient-to-b from-[#0a0f1e] via-[#09132a] to-[#050c1f] md:w-64 md:border-b-0 md:border-r">
        {/* Logo row + mobile sign-out */}
        <div className="flex items-center justify-between border-b border-gold/15 px-4 py-3 md:px-5 md:py-5">
          <BrandLogo href="/dashboard" imageClassName="h-9 w-auto" textClassName="text-sm font-bold" />
          <form action={logoutAction} className="md:hidden">
            <Button type="submit" size="sm" variant="ghost" className="gap-2 text-muted-foreground hover:text-destructive">
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </form>
        </div>

        {/* Investor name — only visible on desktop */}
        <div className="hidden border-b border-gold/15 px-5 py-4 md:block">
          <p className="text-sm uppercase tracking-widest text-muted-foreground">Investor</p>
          <p className="mt-1 truncate text-lg font-semibold">{investor?.name ?? user.email}</p>
        </div>

        {/* Nav — horizontal scroll on mobile, vertical on desktop */}
        <nav className="flex gap-2 overflow-x-auto px-3 py-3 md:flex-1 md:flex-col md:gap-2 md:p-4">
          {navLinks.map(({ href, label, icon }) => (
            <Link
              key={href}
              href={href}
              className="group flex shrink-0 items-center gap-3 rounded-xl border border-gold/20 bg-navy/85 px-4 py-3 text-lg font-medium text-foreground/90 transition-all hover:-translate-y-0.5 hover:border-gold/40 hover:bg-charcoal hover:shadow-[0_10px_26px_rgba(0,0,0,0.35)] md:text-[1.2rem]"
            >
              <span className="text-gold/90 transition-transform group-hover:scale-105">{icon}</span>
              <span className="whitespace-nowrap">{label}</span>
            </Link>
          ))}
        </nav>

        {/* Desktop logout */}
        <div className="hidden border-t border-gold/15 p-3 md:block">
          <form action={logoutAction}>
            <Button
              type="submit"
              variant="ghost"
              className="h-12 w-full justify-start gap-3 rounded-xl text-lg text-muted-foreground transition-colors hover:bg-charcoal hover:text-destructive"
            >
              <LogOut className="h-5 w-5" />
              Sign Out
            </Button>
          </form>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <header className="border-b border-gold/15 bg-navy px-4 py-3 md:px-8 md:py-4">
          <p className="text-sm text-muted-foreground uppercase tracking-widest">Investor Portal</p>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-8 bg-line-grid">{children}</main>
      </div>
    </div>
  )
}
