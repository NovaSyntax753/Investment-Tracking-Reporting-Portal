'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { createDailyUpdateAction } from '@/lib/actions/updates'

interface Investor {
  id: string
  name: string
}

const schema = z.object({
  investorId: z.string().min(1, 'Select an investor'),
  eodAmount: z.coerce.number().positive('Enter a valid positive amount'),
  tradeNotes: z.string().optional(),
  updateDate: z.string().min(1, 'Select a date'),
})

type FormData = z.infer<typeof schema>

export default function DailyUpdateForm({ investors }: { investors: Investor[] }) {
  const [selectedInvestor, setSelectedInvestor] = useState('')

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { updateDate: format(new Date(), 'yyyy-MM-dd') },
  })

  async function onSubmit(data: FormData) {
    const fd = new FormData()
    fd.append('investorId', data.investorId)
    fd.append('eodAmount', String(data.eodAmount))
    fd.append('tradeNotes', data.tradeNotes ?? '')
    fd.append('updateDate', data.updateDate)

    const res = await createDailyUpdateAction(fd)
    if (res?.error) {
      toast.error(res.error)
    } else {
      const label = data.investorId === 'all' ? 'All investors' : investors.find(i => i.id === data.investorId)?.name
      toast.success(`Daily update posted for ${label}`)
      reset({ updateDate: format(new Date(), 'yyyy-MM-dd') })
      setSelectedInvestor('')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-xl">
      {/* Investor selector */}
      <div className="space-y-1.5">
        <Label>Investor</Label>
        <Select
          value={selectedInvestor}
          onValueChange={(v) => { if (v) { setSelectedInvestor(v); setValue('investorId', v, { shouldValidate: true }) } }}
        >
          <SelectTrigger className="bg-navy border-gold/20">
            <SelectValue placeholder="Select investor…" />
          </SelectTrigger>
          <SelectContent className="bg-charcoal border-gold/20">
            <SelectItem value="all" className="text-gold font-medium">📊 All Investors</SelectItem>
            {investors.map((inv) => (
              <SelectItem key={inv.id} value={inv.id}>{inv.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.investorId && <p className="text-sm text-destructive">{errors.investorId.message}</p>}
      </div>

      {/* EOD Amount */}
      <div className="space-y-1.5">
        <Label htmlFor="eodAmount">EOD Portfolio Value (₹)</Label>
        <Input
          id="eodAmount"
          type="number"
          step="0.01"
          placeholder="e.g. 1050000"
          className="bg-navy border-gold/20 focus:border-gold terminal-text font-tabular"
          {...register('eodAmount')}
        />
        {errors.eodAmount && <p className="text-sm text-destructive">{errors.eodAmount.message}</p>}
      </div>

      {/* Date */}
      <div className="space-y-1.5">
        <Label htmlFor="updateDate">Update Date</Label>
        <Input
          id="updateDate"
          type="date"
          className="bg-navy border-gold/20 focus:border-gold"
          {...register('updateDate')}
        />
        {errors.updateDate && <p className="text-sm text-destructive">{errors.updateDate.message}</p>}
      </div>

      {/* Trade notes */}
      <div className="space-y-1.5">
        <Label htmlFor="tradeNotes">Trade Notes (optional)</Label>
        <Textarea
          id="tradeNotes"
          rows={4}
          placeholder="Market outlook, key trades, strategy notes…"
          className="bg-navy border-gold/20 focus:border-gold resize-none"
          {...register('tradeNotes')}
        />
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="bg-gold text-navy-deep font-bold hover:bg-gold-light w-full"
      >
        {isSubmitting ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Posting Update…</>
        ) : (
          'Post Daily Update'
        )}
      </Button>
    </form>
  )
}
