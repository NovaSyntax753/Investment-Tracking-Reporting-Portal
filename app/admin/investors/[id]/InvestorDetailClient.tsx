'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { updateDailyUpdateAction, deleteDailyUpdateAction, createOngoingEntryAction } from '@/lib/actions/updates'
import { createMonthlyTransactionAction, deleteMonthlyTransactionAction } from '@/lib/actions/transactions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type DailyUpdate = {
  id: string
  eod_amount: number
  trade_notes: string | null
  update_date: string
  created_at: string
  status: string
}

type MonthlyTransaction = {
  id: string
  transaction_date: string
  method_of_payment: string
  utr_number: string | null
  amount: number
  status: string
  created_at: string
}

function sortUpdatesDesc(updates: DailyUpdate[]) {
  return [...updates].sort((a, b) => {
    if (a.update_date === b.update_date) {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }
    return a.update_date < b.update_date ? 1 : -1
  })
}

function sortTransactionsDesc(transactions: MonthlyTransaction[]) {
  return [...transactions].sort((a, b) => {
    if (a.transaction_date === b.transaction_date) {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }
    return a.transaction_date < b.transaction_date ? 1 : -1
  })
}

function fmtCurrency(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(value)
}

function methodLabel(method: string) {
  const labels: Record<string, string> = {
    cash: 'Cash',
    bank_transfer: 'Bank Transfer',
    upi: 'UPI',
    other: 'Other',
  }
  return labels[method] ?? method
}

function EditUpdateDialog({
  row,
  onSaved,
}: {
  row: DailyUpdate
  onSaved: (patch: { eod_amount: number; trade_notes: string | null; status: string }) => void
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [eodAmount, setEodAmount] = useState(String(row.eod_amount ?? 0))
  const [tradeNotes, setTradeNotes] = useState(row.trade_notes ?? '')
  const [status, setStatus] = useState(row.status === 'ongoing' ? 'ongoing' : 'completed')

  async function handleSave() {
    setLoading(true)
    const fd = new FormData()
    fd.append('id', row.id)
    fd.append('eod_amount', eodAmount)
    fd.append('trade_notes', tradeNotes)
    fd.append('status', status)

    const res = await updateDailyUpdateAction(fd)
    setLoading(false)

    if (res?.error) {
      toast.error(res.error)
      return
    }

    onSaved({
      eod_amount: Number(eodAmount),
      trade_notes: tradeNotes.trim() ? tradeNotes.trim() : null,
      status,
    })
    toast.success('Daily update saved')
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'text-muted-foreground hover:text-gold')}>
        <Pencil className="h-4 w-4" />
      </DialogTrigger>
      <DialogContent className="bg-charcoal border-gold/20">
        <DialogHeader>
          <DialogTitle>Edit Daily Update</DialogTitle>
          <DialogDescription>
            Update EOD amount and notes for {format(new Date(row.update_date + 'T00:00:00'), 'dd MMM yyyy')}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor={`eod-${row.id}`}>EOD Amount (₹)</Label>
            <Input
              id={`eod-${row.id}`}
              type="number"
              step="0.01"
              className="bg-navy border-gold/20"
              value={eodAmount}
              onChange={(e) => setEodAmount(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={`status-${row.id}`}>Status</Label>
            <Select value={status} onValueChange={(value) => setStatus(value ?? 'completed')}>
              <SelectTrigger id={`status-${row.id}`} className="bg-navy border-gold/20">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent className="bg-charcoal border-gold/20">
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="ongoing">Ongoing</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={`notes-${row.id}`}>Trade Notes</Label>
            <Textarea
              id={`notes-${row.id}`}
              rows={4}
              className="bg-navy border-gold/20 resize-none"
              value={tradeNotes}
              onChange={(e) => setTradeNotes(e.target.value)}
              placeholder="Optional notes"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" className="border-gold/30" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button className="bg-gold text-navy-deep hover:bg-gold-light" onClick={handleSave} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DeleteUpdateDialog({ id, onDeleted }: { id: string; onDeleted: () => void }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    const fd = new FormData()
    fd.append('id', id)
    const res = await deleteDailyUpdateAction(fd)
    setLoading(false)

    if (res?.error) {
      toast.error(res.error)
      return
    }

    onDeleted()
    toast.success('Daily update deleted')
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'text-muted-foreground hover:text-destructive')}>
        <Trash2 className="h-4 w-4" />
      </DialogTrigger>
      <DialogContent className="bg-charcoal border-gold/20">
        <DialogHeader>
          <DialogTitle>Delete Daily Update</DialogTitle>
          <DialogDescription>
            This entry will be removed permanently.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" className="border-gold/30" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function AddTransactionDialog({ investorId, onAdded }: { investorId: string; onAdded: (txn: MonthlyTransaction) => void }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [transactionDate, setTransactionDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [method, setMethod] = useState('cash')
  const [utrNumber, setUtrNumber] = useState('')
  const [amount, setAmount] = useState('')
  const [status, setStatus] = useState('pending')

  async function handleSubmit() {
    setLoading(true)
    const fd = new FormData()
    fd.append('investor_id', investorId)
    fd.append('transaction_date', transactionDate)
    fd.append('method_of_payment', method)
    fd.append('utr_number', utrNumber)
    fd.append('amount', amount)
    fd.append('status', status)

    const res = await createMonthlyTransactionAction(fd)
    setLoading(false)

    if (res?.error) {
      toast.error(res.error)
      return
    }

    const createdId = 'id' in res ? res.id : crypto.randomUUID()
    const createdAt = 'created_at' in res ? res.created_at : new Date().toISOString()

    onAdded({
      id: String(createdId),
      transaction_date: transactionDate,
      method_of_payment: method,
      utr_number: utrNumber.trim() ? utrNumber.trim() : null,
      amount: Number(amount),
      status,
      created_at: String(createdAt),
    })

    toast.success('Transaction added')
    setOpen(false)
    setUtrNumber('')
    setAmount('')
    setStatus('pending')
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={cn(buttonVariants(), 'bg-gold text-navy-deep hover:bg-gold-light')}>
        <Plus className="mr-2 h-4 w-4" />
        Add Transaction
      </DialogTrigger>
      <DialogContent className="bg-charcoal border-gold/20">
        <DialogHeader>
          <DialogTitle>Add Transaction</DialogTitle>
          <DialogDescription>
            Record a monthly release/payment transaction.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Date</Label>
            <Input type="date" className="bg-navy border-gold/20" value={transactionDate} onChange={(e) => setTransactionDate(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label>Method of Payment</Label>
            <Select value={method} onValueChange={(value) => setMethod(value ?? 'cash')}>
              <SelectTrigger className="bg-navy border-gold/20">
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent className="bg-charcoal border-gold/20">
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="upi">UPI</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>UTR Number (optional)</Label>
            <Input className="bg-navy border-gold/20" value={utrNumber} onChange={(e) => setUtrNumber(e.target.value)} placeholder="Enter UTR/reference" />
          </div>

          <div className="space-y-1.5">
            <Label>Amount (₹)</Label>
            <Input type="number" step="0.01" className="bg-navy border-gold/20" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={status} onValueChange={(value) => setStatus(value ?? 'pending')}>
              <SelectTrigger className="bg-navy border-gold/20">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent className="bg-charcoal border-gold/20">
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" className="border-gold/30" onClick={() => setOpen(false)}>Cancel</Button>
          <Button className="bg-gold text-navy-deep hover:bg-gold-light" onClick={handleSubmit} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DeleteTransactionDialog({ id, onDeleted }: { id: string; onDeleted: () => void }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    const fd = new FormData()
    fd.append('id', id)
    const res = await deleteMonthlyTransactionAction(fd)
    setLoading(false)

    if (res?.error) {
      toast.error(res.error)
      return
    }

    onDeleted()
    toast.success('Transaction deleted')
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'text-muted-foreground hover:text-destructive')}>
        <Trash2 className="h-4 w-4" />
      </DialogTrigger>
      <DialogContent className="bg-charcoal border-gold/20">
        <DialogHeader>
          <DialogTitle>Delete Transaction</DialogTitle>
          <DialogDescription>
            This transaction will be removed permanently.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" className="border-gold/30" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function AdminInvestorDetailClient({
  investorId,
  initialUpdates,
  initialTransactions,
}: {
  investorId: string
  initialUpdates: DailyUpdate[]
  initialTransactions: MonthlyTransaction[]
}) {
  const router = useRouter()
  const [updates, setUpdates] = useState(() => sortUpdatesDesc(initialUpdates))
  const [transactions, setTransactions] = useState(() => sortTransactionsDesc(initialTransactions))
  const [creatingOngoing, setCreatingOngoing] = useState(false)

  const updatesWithPnl = useMemo(() => {
    return updates.map((u, i) => {
      const next = updates[i + 1]
      const pnl = next ? Number(u.eod_amount) - Number(next.eod_amount) : null
      return { ...u, pnl }
    })
  }, [updates])

  async function handleCreateOngoing() {
    setCreatingOngoing(true)
    const today = format(new Date(), 'yyyy-MM-dd')
    const fd = new FormData()
    fd.append('investor_id', investorId)
    fd.append('update_date', today)

    const res = await createOngoingEntryAction(fd)
    setCreatingOngoing(false)

    if (res?.error) {
      toast.error(res.error)
      return
    }

    const createdId = 'id' in res ? res.id : crypto.randomUUID()

    setUpdates((prev) => sortUpdatesDesc([
      {
        id: String(createdId),
        eod_amount: 0,
        trade_notes: null,
        update_date: today,
        created_at: new Date().toISOString(),
        status: 'ongoing',
      },
      ...prev,
    ]))

    toast.success('Ongoing entry added')
    router.refresh()
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="mb-4 text-lg font-semibold">Recent Daily Updates</h2>
        {updates.length === 0 ? (
          <div className="rounded-xl border border-gold/20 bg-charcoal p-10 text-center">
            <p className="text-muted-foreground text-base">No updates in the last 30 days.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-gold/20 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-gold/20 bg-charcoal hover:bg-charcoal">
                  <TableHead className="text-muted-foreground text-sm uppercase tracking-widest">Date</TableHead>
                  <TableHead className="text-muted-foreground text-sm uppercase tracking-widest">Trade Notes</TableHead>
                  <TableHead className="text-muted-foreground text-sm uppercase tracking-widest text-right">Unreleased PNL</TableHead>
                  <TableHead className="text-muted-foreground text-sm uppercase tracking-widest text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {updatesWithPnl.map((u) => {
                  const isUp = u.pnl != null && u.pnl >= 0
                  return (
                    <TableRow key={u.id} className="border-gold/10 hover:bg-charcoal/50 transition-colors">
                      <TableCell className="font-medium terminal-text text-base">
                        {format(new Date(u.update_date + 'T00:00:00'), 'dd MMM yyyy')}
                      </TableCell>
                      <TableCell className="text-base text-muted-foreground max-w-xs truncate">
                        {u.trade_notes ?? '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        {u.status === 'ongoing' ? (
                          <span className="inline-flex items-center gap-2 text-amber-300">
                            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                            Ongoing
                          </span>
                        ) : u.pnl == null ? (
                          <span className="text-muted-foreground">—</span>
                        ) : (
                          <Badge
                            variant="outline"
                            className={`terminal-text font-tabular text-sm ${
                              isUp
                                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                                : 'border-red-500/30 bg-red-500/10 text-red-400'
                            }`}
                          >
                            {isUp ? '+' : '-'}{fmtCurrency(Math.abs(u.pnl))}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex items-center gap-1">
                          <EditUpdateDialog
                            row={u}
                            onSaved={(patch) => {
                              setUpdates((prev) => prev.map((item) => item.id === u.id ? { ...item, ...patch } : item))
                              router.refresh()
                            }}
                          />
                          <DeleteUpdateDialog
                            id={u.id}
                            onDeleted={() => {
                              setUpdates((prev) => prev.filter((item) => item.id !== u.id))
                              router.refresh()
                            }}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <Button
            className="bg-gold text-navy-deep hover:bg-gold-light"
            onClick={handleCreateOngoing}
            disabled={creatingOngoing}
          >
            {creatingOngoing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            + New Entry
          </Button>
        </div>
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Monthly Transactions</h2>
          <AddTransactionDialog
            investorId={investorId}
            onAdded={(txn) => {
              setTransactions((prev) => sortTransactionsDesc([txn, ...prev]))
              router.refresh()
            }}
          />
        </div>

        {transactions.length === 0 ? (
          <div className="rounded-xl border border-gold/20 bg-charcoal p-10 text-center">
            <p className="text-muted-foreground text-base">No transactions recorded yet.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-gold/20 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-gold/20 bg-charcoal hover:bg-charcoal">
                  <TableHead className="text-muted-foreground text-sm uppercase tracking-widest">Date</TableHead>
                  <TableHead className="text-muted-foreground text-sm uppercase tracking-widest">Method</TableHead>
                  <TableHead className="text-muted-foreground text-sm uppercase tracking-widest">UTR Number</TableHead>
                  <TableHead className="text-muted-foreground text-sm uppercase tracking-widest text-right">Amount</TableHead>
                  <TableHead className="text-muted-foreground text-sm uppercase tracking-widest">Status</TableHead>
                  <TableHead className="text-muted-foreground text-sm uppercase tracking-widest text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((txn) => (
                  <TableRow key={txn.id} className="border-gold/10 hover:bg-charcoal/50 transition-colors">
                    <TableCell className="font-medium terminal-text text-base">
                      {format(new Date(txn.transaction_date + 'T00:00:00'), 'dd MMM yyyy')}
                    </TableCell>
                    <TableCell>{methodLabel(txn.method_of_payment)}</TableCell>
                    <TableCell className="text-muted-foreground">{txn.utr_number ?? '—'}</TableCell>
                    <TableCell className="text-right terminal-text font-tabular">{fmtCurrency(Number(txn.amount))}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={txn.status === 'paid'
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                          : 'border-amber-500/30 bg-amber-500/10 text-amber-300'}
                      >
                        {txn.status === 'paid' ? 'Paid' : 'Pending'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DeleteTransactionDialog
                        id={txn.id}
                        onDeleted={() => {
                          setTransactions((prev) => prev.filter((item) => item.id !== txn.id))
                          router.refresh()
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
}
