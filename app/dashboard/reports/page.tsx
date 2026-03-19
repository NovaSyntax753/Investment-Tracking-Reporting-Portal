import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { buttonVariants } from '@/lib/buttonVariants'
import { cn } from '@/lib/utils'
import { FileDown, FileText } from 'lucide-react'

export default async function ReportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: reports } = await supabase
    .from('monthly_reports')
    .select('id, report_month, document_url, uploaded_at, auto_generated, opening_amount, closing_amount, average_amount, pnl_amount, pnl_percentage, trading_days')
    .eq('investor_id', user.id)
    .order('uploaded_at', { ascending: false })

  // Generate signed URLs for each report
  const reportsWithUrls = await Promise.all(
    (reports ?? []).map(async (r) => {
      if (!r.document_url) {
        return { ...r, signedUrl: null }
      }

      const { data } = await supabase.storage
        .from('monthly-reports')
        .createSignedUrl(r.document_url, 60 * 60) // 1 hour
      return { ...r, signedUrl: data?.signedUrl ?? null }
    }),
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Monthly Reports</h1>
        <p className="text-muted-foreground text-base mt-1">
          Download your monthly performance reports
        </p>
      </div>

      {reportsWithUrls.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-gold/20 bg-charcoal p-16 text-center">
          <FileText className="h-16 w-16 text-gold/30 mb-4" />
          <p className="font-semibold">No reports yet</p>
          <p className="mt-2 text-base text-muted-foreground">
            Your fund manager will upload monthly reports here after each period closes.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reportsWithUrls.map((r) => (
            <div
              key={r.id}
              className="flex flex-col justify-between rounded-xl border border-gold/20 bg-charcoal p-5 hover:border-gold/40 transition-colors"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-gold/30 bg-navy">
                  <FileText className="h-5 w-5 text-gold" />
                </div>
                <div>
                  <p className="font-semibold">{r.report_month}</p>
                  <p className="text-sm text-muted-foreground">
                    Uploaded {format(new Date(r.uploaded_at), 'dd MMM yyyy')}
                  </p>
                </div>
              </div>

              {r.auto_generated ? (
                <div className="mb-4 space-y-1 rounded-lg border border-gold/20 bg-navy/40 p-3 text-sm">
                  <p className="flex items-center justify-between"><span className="text-muted-foreground">Opening</span><span>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(r.opening_amount ?? 0)}</span></p>
                  <p className="flex items-center justify-between"><span className="text-muted-foreground">Closing</span><span>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(r.closing_amount ?? 0)}</span></p>
                  <p className="flex items-center justify-between"><span className="text-muted-foreground">Average</span><span>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(r.average_amount ?? 0)}</span></p>
                  <p className="flex items-center justify-between"><span className="text-muted-foreground">Trading Days</span><span>{r.trading_days ?? 0}</span></p>
                  <p className="flex items-center justify-between"><span className="text-muted-foreground">P/L</span><span className={(r.pnl_amount ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}>{(r.pnl_amount ?? 0) >= 0 ? '+' : ''}{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(r.pnl_amount ?? 0)} ({Number(r.pnl_percentage ?? 0).toFixed(2)}%)</span></p>
                </div>
              ) : null}

              {r.signedUrl ? (
                <a
                  href={r.signedUrl}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'w-full border-gold/30 hover:bg-navy hover:border-gold')}
                >
                  <FileDown className="mr-2 h-4 w-4 text-gold" />
                  Download PDF
                </a>
              ) : r.auto_generated ? (
                <Button disabled size="sm" variant="outline" className="w-full border-gold/20">
                  Auto-generated from daily updates
                </Button>
              ) : (
                <Button disabled size="sm" variant="outline" className="w-full border-gold/20">
                  Link unavailable
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
