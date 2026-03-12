import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { logoutAction } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import {
  TrendingUp,
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
    <div className="flex min-h-screen bg-navy-deep">
      {/* Sidebar */}
      <aside className="flex w-60 shrink-0 flex-col border-r border-gold/15 bg-[#0a0f1e]">
        <div className="flex items-center gap-2 border-b border-gold/15 px-5 py-5">
          <TrendingUp className="h-5 w-5 text-gold" />
          <span className="font-bold text-sm">
            <span className="text-gold">Alpha</span>
            <span className="text-foreground">Capital</span>
          </span>
        </div>

        <div className="border-b border-gold/15 px-5 py-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-2.5 py-0.5 text-xs font-semibold text-gold">
            Admin Console
          </span>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-3">
          {navLinks.map(({ href, label, icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-charcoal hover:text-foreground transition-colors"
            >
              {icon}
              {label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-gold/15 p-3">
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
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="border-b border-gold/15 bg-navy px-8 py-4">
          <p className="text-xs text-muted-foreground uppercase tracking-widest">Admin Console</p>
        </header>
        <main className="flex-1 overflow-auto p-8">{children}</main>
      </div>
    </div>
  )
}
