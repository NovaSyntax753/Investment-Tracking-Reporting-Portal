'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export default function AdminError({
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
        <h2 className="text-xl font-semibold">Admin Console Error</h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-sm">
          An unexpected error occurred. Check the server logs for details.
        </p>
      </div>
      <Button onClick={reset} className="bg-gold text-navy-deep font-semibold hover:bg-gold-light">
        Try Again
      </Button>
    </div>
  )
}
