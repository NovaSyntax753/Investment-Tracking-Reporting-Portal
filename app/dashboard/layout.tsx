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
    { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
    { href: '/dashboard/reports', label: 'Monthly Reports', icon: <FileText className="h-4 w-4" /> },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-navy-deep md:flex-row">
      {/* Mobile top bar + desktop sidebar */}
      <aside className="w-full shrink-0 border-b border-gold/15 bg-[#0a0f1e] md:w-60 md:border-b-0 md:border-r">
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
          <p className="text-sm text-muted-foreground uppercase tracking-widest">Investor</p>
          <p className="mt-1 font-semibold text-base truncate">{investor?.name ?? user.email}</p>
        </div>

        {/* Nav — horizontal scroll on mobile, vertical on desktop */}
        <nav className="flex gap-2 overflow-x-auto px-3 py-3 md:flex-1 md:flex-col md:gap-1 md:p-3">
          {navLinks.map(({ href, label, icon }) => (
            <Link
              key={href}
              href={href}
              className="flex shrink-0 items-center gap-2 rounded-lg border border-gold/20 bg-navy px-3 py-2 text-base font-medium text-muted-foreground transition-colors hover:bg-charcoal hover:text-foreground md:border-transparent md:bg-transparent md:gap-3 md:px-3 md:py-2.5"
            >
              {icon}
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
              className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive transition-colors"
            >
              <LogOut className="h-4 w-4" />
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
