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
  { href: '/admin', label: 'Overview', icon: <LayoutDashboard className="h-4 w-4" /> },
  { href: '/admin/investors', label: 'Investors', icon: <Users className="h-4 w-4" /> },
  { href: '/admin/updates', label: 'Daily Updates', icon: <Activity className="h-4 w-4" /> },
  { href: '/admin/reports', label: 'Reports', icon: <UploadCloud className="h-4 w-4" /> },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    redirect('/login')
  }

  return (
    <div className="flex min-h-screen flex-col bg-navy-deep md:flex-row">
      {/* Mobile top nav + desktop sidebar */}
      <aside className="w-full shrink-0 border-b border-gold/15 bg-[#0a0f1e] md:w-60 md:border-b-0 md:border-r">
        <div className="flex items-center justify-between border-b border-gold/15 px-4 py-3 md:px-5 md:py-5">
          <BrandLogo href="/admin" imageClassName="h-9 w-auto" textClassName="text-sm font-bold" />
          <form action={logoutAction} className="md:hidden">
            <Button type="submit" size="sm" variant="ghost" className="gap-2 text-muted-foreground hover:text-destructive">
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </form>
        </div>

        <div className="hidden border-b border-gold/15 px-5 py-3 md:block">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-2.5 py-0.5 text-xs font-semibold text-gold">
            Admin Console
          </span>
        </div>

        <nav className="flex gap-2 overflow-x-auto px-3 py-3 md:flex-1 md:flex-col md:gap-1 md:p-3">
          {navLinks.map(({ href, label, icon }) => (
            <Link
              key={href}
              href={href}
              className="flex shrink-0 items-center gap-2 rounded-lg border border-gold/20 bg-navy px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-charcoal hover:text-foreground md:border-transparent md:bg-transparent md:gap-3 md:px-3 md:py-2.5"
            >
              {icon}
              <span className="whitespace-nowrap">{label}</span>
            </Link>
          ))}
        </nav>

        <div className="hidden border-t border-gold/15 p-3 md:block">
          <form action={logoutAction}>
            <Button
              type="submit"
              variant="ghost"
              className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
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
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Admin Console</p>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-8 bg-line-grid">{children}</main>
      </div>
    </div>
  )
}
