import { createServiceClient } from '@/lib/supabase/server'
import ReportUploader from '@/components/ReportUploader'

export default async function AdminReportsPage() {
  const supabase = await createServiceClient()

  const { data: investors } = await supabase
    .from('investors')
    .select('id, name')
    .eq('is_active', true)
    .order('name')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Upload Monthly Report</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Monthly summaries are auto-generated from daily updates at the start of each month.
          Use this section only when you need to upload a custom PDF report manually.
        </p>
      </div>

      <div className="rounded-xl border border-gold/20 bg-charcoal p-6">
        <ReportUploader investors={investors ?? []} />
      </div>
    </div>
  )
}
