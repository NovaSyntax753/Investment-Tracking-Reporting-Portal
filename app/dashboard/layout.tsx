import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { logoutAction } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { TrendingUp, LayoutDashboard, FileText, LogOut } from 'lucide-react'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: investor } = await supabase
    .from('investors')
    .select('name, email')
    .eq('id', user.id)
    .single()

  return (
    <div className="flex min-h-screen bg-navy-deep">
      {/* Sidebar */}
      <aside className="flex w-60 shrink-0 flex-col border-r border-gold/15 bg-[#0a0f1e]">
        {/* Logo */}
        <div className="flex items-center gap-2 border-b border-gold/15 px-5 py-5">
          <TrendingUp className="h-5 w-5 text-gold" />
          <span className="font-bold text-sm">
            <span className="text-gold">Alpha</span>
            <span className="text-foreground">Capital</span>
          </span>
        </div>

        {/* Investor name */}
        <div className="border-b border-gold/15 px-5 py-4">
          <p className="text-xs text-muted-foreground uppercase tracking-widest">Investor</p>
          <p className="mt-1 font-semibold text-sm truncate">{investor?.name ?? user.email}</p>
        </div>

        {/* Nav */}
        <nav className="flex flex-1 flex-col gap-1 p-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-charcoal hover:text-foreground transition-colors"
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
          <Link
            href="/dashboard/reports"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-charcoal hover:text-foreground transition-colors"
          >
            <FileText className="h-4 w-4" />
            Monthly Reports
          </Link>
        </nav>

        {/* Logout */}
        <div className="border-t border-gold/15 p-3">
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
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="border-b border-gold/15 bg-navy px-8 py-4">
          <p className="text-xs text-muted-foreground uppercase tracking-widest">Investor Portal</p>
        </header>
        <main className="flex-1 overflow-auto p-8">{children}</main>
      </div>
    </div>
  )
}
