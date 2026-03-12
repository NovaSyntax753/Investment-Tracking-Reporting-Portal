'use client'

import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Upload } from 'lucide-react'
import { uploadReportAction } from '@/lib/actions/reports'

interface Investor {
  id: string
  name: string
}

const schema = z.object({
  investorId: z.string().min(1, 'Select an investor'),
  reportMonth: z.string().min(3, 'Enter a report month (e.g. June 2025)'),
})

type FormData = z.infer<typeof schema>

export default function ReportUploader({ investors }: { investors: Investor[] }) {
  const [selectedInvestor, setSelectedInvestor] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) })

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f && f.type !== 'application/pdf') {
      toast.error('Only PDF files are accepted')
      return
    }
    setFile(f ?? null)
  }

  async function onSubmit(data: FormData) {
    if (!file) {
      toast.error('Please select a PDF file')
      return
    }

    const fd = new FormData()
    fd.append('investorId', data.investorId)
    fd.append('reportMonth', data.reportMonth)
    fd.append('file', file)

    const res = await uploadReportAction(fd)
    if (res?.error) {
      toast.error(res.error)
    } else {
      toast.success('Report uploaded successfully')
      reset()
      setSelectedInvestor('')
      setFile(null)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-xl">
      {/* Investor */}
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
            {investors.map((inv) => (
              <SelectItem key={inv.id} value={inv.id}>{inv.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.investorId && <p className="text-xs text-destructive">{errors.investorId.message}</p>}
      </div>

      {/* Report month */}
      <div className="space-y-1.5">
        <Label htmlFor="reportMonth">Report Month</Label>
        <Input
          id="reportMonth"
          placeholder="e.g. June 2025"
          className="bg-navy border-gold/20 focus:border-gold"
          {...register('reportMonth')}
        />
        {errors.reportMonth && <p className="text-xs text-destructive">{errors.reportMonth.message}</p>}
      </div>

      {/* PDF upload */}
      <div className="space-y-1.5">
        <Label htmlFor="pdfFile">PDF Report</Label>
        <div
          className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gold/30 bg-navy p-8 hover:border-gold/60 transition-colors"
          onClick={() => fileRef.current?.click()}
        >
          <Upload className="h-8 w-8 text-gold/60" />
          {file ? (
            <p className="text-sm font-medium text-gold">{file.name}</p>
          ) : (
            <>
              <p className="text-sm font-medium">Click to upload PDF</p>
              <p className="text-xs text-muted-foreground">PDF files only, max 20 MB</p>
            </>
          )}
        </div>
        <input
          ref={fileRef}
          id="pdfFile"
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="bg-gold text-navy-deep font-bold hover:bg-gold-light w-full"
      >
        {isSubmitting ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading…</>
        ) : (
          'Upload Report'
        )}
      </Button>
    </form>
  )
}
