import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { logoutAction } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import BrandLogo from '@/components/BrandLogo'
import {
  LayoutDashboard,
  Users,
  Activity,
  UploadCloud,
  LogOut,
} from 'lucide-react'

const navLinks = [
  { href: '/admin', label: 'Overview', icon: <LayoutDashboard className="h-5 w-5" /> },
  { href: '/admin/investors', label: 'Investors', icon: <Users className="h-5 w-5" /> },
  { href: '/admin/updates', label: 'Daily Updates', icon: <Activity className="h-5 w-5" /> },
  { href: '/admin/reports', label: 'Reports', icon: <UploadCloud className="h-5 w-5" /> },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    redirect('/login')
  }

  return (
    <div className="admin-zone flex min-h-screen flex-col bg-navy-deep md:flex-row">
      {/* Mobile top nav + desktop sidebar */}
      <aside className="w-full shrink-0 border-b border-gold/15 bg-gradient-to-b from-[#0a0f1e] via-[#09132a] to-[#050c1f] md:w-64 md:border-b-0 md:border-r">
        <div className="flex items-center justify-between border-b border-gold/15 px-4 py-3 md:px-5 md:py-5">
          <BrandLogo href="/admin" imageClassName="h-9 w-auto" textClassName="text-sm font-bold" />
          <form action={logoutAction} className="md:hidden">
            <Button type="submit" size="sm" variant="ghost" className="gap-2 text-muted-foreground hover:text-destructive">
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </form>
        </div>

        <div className="hidden border-b border-gold/15 px-5 py-4 md:block">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/45 bg-gold/10 px-3 py-1 text-sm font-semibold tracking-wide text-gold shadow-[0_0_24px_rgba(212,175,55,0.12)]">
            Admin Console
          </span>
        </div>

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

        <div className="hidden border-t border-gold/15 p-3 md:block">
          <form action={logoutAction}>
            <Button
              type="submit"
              variant="ghost"
              className="h-12 w-full justify-start gap-3 rounded-xl text-lg text-muted-foreground hover:bg-charcoal hover:text-destructive"
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
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Admin Console</p>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-8 bg-line-grid">{children}</main>
      </div>
    </div>
  )
}
