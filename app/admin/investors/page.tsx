import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/server'
import InvestorTable from '@/components/InvestorTable'
import { buttonVariants } from '@/lib/buttonVariants'
import { cn } from '@/lib/utils'
import { UserPlus } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function InvestorsPage() {
  const supabase = await createServiceClient()

  const { data: investorsWithCode, error: investorsWithCodeError } = await supabase
    .from('investors')
    .select('id, investor_code, name, email, phone, invested_amount, fixed_return_value, fixed_return_percentage, is_active, created_at')
    .order('created_at', { ascending: false })

  let schemaWarning: string | null = null
  let investors = investorsWithCode

  if (investorsWithCodeError && /investor_code/i.test(investorsWithCodeError.message)) {
    const { data: fallbackInvestors, error: fallbackError } = await supabase
      .from('investors')
      .select('id, name, email, phone, invested_amount, fixed_return_value, fixed_return_percentage, is_active, created_at')
      .order('created_at', { ascending: false })

    if (fallbackError) {
      return <p className="text-destructive text-sm">{fallbackError.message}</p>
    }

    investors = (fallbackInvestors ?? []).map((inv) => ({
      ...inv,
      investor_code: null,
    }))

    schemaWarning = 'Database migration pending: run migration 006 to enable Investor ID column.'
  } else if (investorsWithCodeError) {
    return <p className="text-destructive text-sm">{investorsWithCodeError.message}</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Investors</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {investors?.length ?? 0} accounts registered
          </p>
          {schemaWarning ? (
            <p className="text-amber-400 text-xs mt-1">{schemaWarning}</p>
          ) : null}
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
