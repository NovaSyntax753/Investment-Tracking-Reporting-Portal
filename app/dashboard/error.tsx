'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6 text-center">
      <AlertTriangle className="h-16 w-16 text-gold/40" />
      <div>
        <h2 className="text-xl font-semibold">Something went wrong</h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-sm">
          We couldn&apos;t load your dashboard. Please try again.
        </p>
      </div>
      <Button onClick={reset} className="bg-gold text-navy-deep font-semibold hover:bg-gold-light">
        Try Again
      </Button>
    </div>
  )
}
