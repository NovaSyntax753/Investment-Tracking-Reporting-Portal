import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/server'
import InvestorTable from '@/components/InvestorTable'
import PendingRegistrationTable from '@/components/PendingRegistrationTable'
import { buttonVariants } from '@/lib/buttonVariants'
import { cn } from '@/lib/utils'
import { UserPlus } from 'lucide-react'

export default async function InvestorsPage() {
  const supabase = await createServiceClient()

  const { data: investors, error } = await supabase
    .from('investors')
    .select('id, name, email, phone, invested_amount, fixed_return_value, fixed_return_percentage, is_active, created_at')
    .order('created_at', { ascending: false })

  const { data: pendingRequests, error: pendingError } = await supabase
    .from('registration_requests')
    .select('id, name, email, phone, invested_amount, fixed_return_value, fixed_return_percentage, created_at')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) {
    return <p className="text-destructive text-sm">{error.message}</p>
  }

  if (pendingError) {
    return <p className="text-destructive text-sm">{pendingError.message}</p>
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Pending Registrations</h2>
        <p className="text-muted-foreground text-sm mt-1">
          {pendingRequests?.length ?? 0} requests awaiting admin verification
        </p>
      </div>

      <PendingRegistrationTable initialRequests={pendingRequests ?? []} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Investors</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {investors?.length ?? 0} accounts registered
          </p>
        </div>
        <Link href="/admin/investors/new" className={cn(buttonVariants(), 'bg-gold text-navy-deep font-semibold hover:bg-gold-light')}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Investor
        </Link>
      </div>

      <InvestorTable initialInvestors={investors ?? []} />
    </div>
  )
}
