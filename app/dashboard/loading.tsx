import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-8 w-48 bg-charcoal" />
        <Skeleton className="h-4 w-64 mt-2 bg-charcoal" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl bg-charcoal" />
        ))}
      </div>

      {/* Table */}
      <div>
        <Skeleton className="h-6 w-40 mb-4 bg-charcoal" />
        <div className="rounded-xl border border-gold/20 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 border-b border-gold/10 px-4 py-3">
              <Skeleton className="h-4 w-24 bg-charcoal" />
              <Skeleton className="h-4 w-32 bg-charcoal" />
              <Skeleton className="h-4 w-24 bg-charcoal" />
              <Skeleton className="h-4 flex-1 bg-charcoal" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
