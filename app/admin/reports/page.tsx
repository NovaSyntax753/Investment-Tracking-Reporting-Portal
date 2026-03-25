import { createServiceClient } from '@/lib/supabase/server'
import ReportUploader from '@/components/ReportUploader'
import BulkExportReports from '@/components/BulkExportReports'

export default async function AdminReportsPage() {
  const supabase = await createServiceClient()

  const { data: investors } = await supabase
    .from('investors')
    .select('id, name')
    .eq('is_active', true)
    .order('name')

  return (
    <div className="space-y-10">
      <section className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Generate & Download Excel Reports</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Generate monthly performance reports in Excel format based on daily updates.
          </p>
        </div>

        <div className="rounded-xl border border-gold/20 bg-charcoal p-6">
          <BulkExportReports investors={investors ?? []} />
        </div>
      </section>

      <div className="flex items-center gap-4">
        <div className="flex-1 border-t border-gold/20"></div>
        <span className="text-xs uppercase tracking-widest text-gold/60 font-medium">Then</span>
        <div className="flex-1 border-t border-gold/20"></div>
      </div>

      <section className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Upload Report to Investor Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Upload the downloaded reports (converted to PDF or as-is) to the investor vaults.
          </p>
        </div>

        <div className="rounded-xl border border-gold/20 bg-charcoal p-6">
          <ReportUploader investors={investors ?? []} />
        </div>
      </section>
    </div>
  )
}
