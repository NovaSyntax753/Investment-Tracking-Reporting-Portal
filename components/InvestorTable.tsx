'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { Trash2, Loader2 } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { deleteInvestorAction } from '@/lib/actions/investors'

export interface Investor {
  id: string
  investor_code: string | null
  name: string
  email: string
  phone: string | null
  invested_amount: number
  fixed_return_value: number
  fixed_return_percentage: number
  is_active: boolean
  created_at: string
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
}

function DeleteDialog({ investor, onDeleted }: { investor: Investor; onDeleted: () => void }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    const fd = new FormData()
    fd.append('investorId', investor.id)
    const res = await deleteInvestorAction(fd)
    setLoading(false)
    if (res?.error) {
      toast.error(res.error)
    } else {
      toast.success(`${investor.name} removed`)
      setOpen(false)
      onDeleted()
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className={cn(
          buttonVariants({ variant: 'ghost', size: 'icon' }),
          'text-muted-foreground hover:text-destructive',
        )}
      >
        <Trash2 className="h-4 w-4" />
      </DialogTrigger>
      <DialogContent className="bg-charcoal border-gold/20">
        <DialogHeader>
          <DialogTitle>Remove Investor</DialogTitle>
          <DialogDescription>
            This will permanently delete <strong>{investor.name}</strong>&apos;s account and all
            associated data. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" className="border-gold/30" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function InvestorTable({
  initialInvestors,
}: {
  initialInvestors: Investor[]
}) {
  const [investors, setInvestors] = useState(initialInvestors)

  function handleDeleted(id: string) {
    setInvestors((prev) => prev.filter((i) => i.id !== id))
  }

  if (investors.length === 0) {
    return (
      <div className="rounded-xl border border-gold/20 bg-charcoal p-12 text-center">
        <p className="text-muted-foreground">No investors yet. Add your first investor.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gold/20 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-gold/20 bg-charcoal hover:bg-charcoal">
            <TableHead className="text-muted-foreground text-xs uppercase tracking-widest">Investor ID</TableHead>
            <TableHead className="text-muted-foreground text-xs uppercase tracking-widest">Name</TableHead>
            <TableHead className="text-muted-foreground text-xs uppercase tracking-widest">Email</TableHead>
            <TableHead className="text-muted-foreground text-xs uppercase tracking-widest text-right">Invested</TableHead>
            <TableHead className="text-muted-foreground text-xs uppercase tracking-widest text-right">Fixed Return</TableHead>
            <TableHead className="text-muted-foreground text-xs uppercase tracking-widest">Status</TableHead>
            <TableHead className="text-muted-foreground text-xs uppercase tracking-widest">Joined</TableHead>
            <TableHead className="w-16" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {investors.map((inv) => (
            <TableRow key={inv.id} className="border-gold/10 hover:bg-charcoal/50 transition-colors">
              <TableCell className="font-mono text-xs text-gold">{inv.investor_code ?? '—'}</TableCell>
              <TableCell className="font-medium">{inv.name}</TableCell>
              <TableCell className="text-muted-foreground text-sm">{inv.email}</TableCell>
              <TableCell className="text-right terminal-text font-tabular">{fmt(inv.invested_amount)}</TableCell>
              <TableCell className="text-right terminal-text font-tabular text-gold">
                {fmt(inv.fixed_return_value)}{' '}
                <span className="text-xs text-muted-foreground">({inv.fixed_return_percentage}%)</span>
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={inv.is_active
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                    : 'border-red-500/30 bg-red-500/10 text-red-400'}
                >
                  {inv.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {format(new Date(inv.created_at), 'dd MMM yyyy')}
              </TableCell>
              <TableCell>
                <DeleteDialog investor={inv} onDeleted={() => handleDeleted(inv.id)} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
