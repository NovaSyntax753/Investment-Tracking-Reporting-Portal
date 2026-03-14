'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { approveRegistrationRequestAction } from '@/lib/actions/investors'

export interface PendingRegistration {
  id: string
  name: string
  email: string
  phone: string | null
  invested_amount: number
  fixed_return_value: number
  fixed_return_percentage: number
  created_at: string
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n)
}

export default function PendingRegistrationTable({
  initialRequests,
}: {
  initialRequests: PendingRegistration[]
}) {
  const [requests, setRequests] = useState(initialRequests)
  const [approvingId, setApprovingId] = useState<string | null>(null)

  async function handleApprove(requestId: string) {
    setApprovingId(requestId)
    const fd = new FormData()
    fd.append('requestId', requestId)
    const res = await approveRegistrationRequestAction(fd)
    setApprovingId(null)

    if (res?.error) {
      toast.error(res.error)
      return
    }

    toast.success('Registration approved and activation email sent')
    setRequests((prev) => prev.filter((r) => r.id !== requestId))
  }

  if (requests.length === 0) {
    return (
      <div className="rounded-xl border border-gold/20 bg-charcoal p-10 text-center">
        <p className="text-muted-foreground text-sm">No pending registration requests.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gold/20 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-gold/20 bg-charcoal hover:bg-charcoal">
            <TableHead className="text-muted-foreground text-xs uppercase tracking-widest">Name</TableHead>
            <TableHead className="text-muted-foreground text-xs uppercase tracking-widest">Email</TableHead>
            <TableHead className="text-muted-foreground text-xs uppercase tracking-widest text-right">Invested</TableHead>
            <TableHead className="text-muted-foreground text-xs uppercase tracking-widest text-right">Fixed Return</TableHead>
            <TableHead className="text-muted-foreground text-xs uppercase tracking-widest">Requested</TableHead>
            <TableHead className="text-muted-foreground text-xs uppercase tracking-widest">Status</TableHead>
            <TableHead className="text-muted-foreground text-xs uppercase tracking-widest text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((req) => (
            <TableRow key={req.id} className="border-gold/10 hover:bg-charcoal/50 transition-colors">
              <TableCell className="font-medium">{req.name}</TableCell>
              <TableCell className="text-muted-foreground text-sm">{req.email}</TableCell>
              <TableCell className="text-right terminal-text font-tabular">{fmt(req.invested_amount)}</TableCell>
              <TableCell className="text-right terminal-text font-tabular text-gold">
                {fmt(req.fixed_return_value)}{' '}
                <span className="text-xs text-muted-foreground">({req.fixed_return_percentage}%)</span>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {format(new Date(req.created_at), 'dd MMM yyyy')}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-400">
                  Pending
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  onClick={() => handleApprove(req.id)}
                  disabled={approvingId === req.id}
                  className="bg-gold text-navy-deep font-semibold hover:bg-gold-light"
                >
                  {approvingId === req.id ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Approving...</>
                  ) : (
                    <><CheckCircle2 className="mr-2 h-4 w-4" />Approve</>
                  )}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
