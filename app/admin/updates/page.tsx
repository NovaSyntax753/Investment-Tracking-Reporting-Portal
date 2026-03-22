import { createServiceClient } from '@/lib/supabase/server'
import DailyUpdateForm from '@/components/DailyUpdateForm'

export default async function AdminUpdatesPage() {
  const supabase = await createServiceClient()

  const { data: investors } = await supabase
    .from('investors')
    .select('id, name')
    .eq('is_active', true)
    .order('name')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Daily Update Entry</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Post signed daily P&amp;L updates. Selecting &ldquo;All Investors&rdquo; applies the same signed P&amp;L
          to each active investor&apos;s latest EOD value and triggers multi-channel notifications.
        </p>
      </div>

      <div className="rounded-xl border border-gold/20 bg-charcoal p-6">
        <DailyUpdateForm investors={investors ?? []} />
      </div>
    </div>
  )
}
