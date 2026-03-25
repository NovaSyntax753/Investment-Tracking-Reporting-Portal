'use client'

import { useState } from 'react'
import { FileDown, Loader2, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type Investor = {
  id: string
  name: string
}

export default function BulkExportReports({ investors }: { investors: Investor[] }) {
  const today = new Date()
  const prevMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1)
  
  const [month, setMonth] = useState((prevMonthDate.getMonth() + 1).toString())
  const [year, setYear] = useState(prevMonthDate.getFullYear().toString())

  const [downloading, setDownloading] = useState<Record<string, boolean>>({})
  const [downloaded, setDownloaded] = useState<Set<string>>(new Set())
  const [bulkInProgress, setBulkInProgress] = useState(false)

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: (i + 1).toString(),
    label: format(new Date(2000, i, 1), 'MMMM')
  }))

  const years = [today.getFullYear(), today.getFullYear() - 1, today.getFullYear() - 2].map(String)

  // Reset state on month/year change
  const handlePeriodChange = (val: string, type: 'month' | 'year') => {
    if (type === 'month') setMonth(val)
    if (type === 'year') setYear(val)
    setDownloaded(new Set())
  }

  const downloadOne = async (inv: Investor) => {
    setDownloading(prev => ({ ...prev, [inv.id]: true }))
    try {
      const res = await fetch(`/api/admin/export/investor-report?investorId=${inv.id}&month=${month}&year=${year}`)
      if (!res.ok) throw new Error(`Failed to generate report for ${inv.name}`)

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const contentDisposition = res.headers.get('Content-Disposition')
      let filename = `${inv.name}_${month}.xlsx`
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/)
        if (match) filename = match[1]
      }
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      setDownloaded(prev => {
        const next = new Set(prev)
        next.add(inv.id)
        return next
      })
      toast.success(`Downloaded: ${inv.name}`)
    } catch (err: any) {
      toast.error(err.message || `Error downloading report for ${inv.name}`)
    } finally {
      setDownloading(prev => ({ ...prev, [inv.id]: false }))
    }
  }

  const handleBulkDownload = async () => {
    setBulkInProgress(true)
    for (const inv of investors) {
      if (!downloaded.has(inv.id)) {
        await downloadOne(inv)
        // 400ms delay
        await new Promise(r => setTimeout(r, 400))
      }
    }
    setBulkInProgress(false)
    toast.success('Bulk export completed')
  }

  const isDownloadingAny = Object.values(downloading).some(Boolean) || bulkInProgress

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-gold/10 pb-6">
        <div className="flex gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Month</label>
            <Select
              value={month}
              onValueChange={(v) => {
                if (v) handlePeriodChange(v, 'month')
              }}
            >
              <SelectTrigger className="w-32 border-gold/20 bg-navy text-white">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent className="border-gold/20 bg-charcoal text-white">
                {months.map(m => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Year</label>
            <Select
              value={year}
              onValueChange={(v) => {
                if (v) handlePeriodChange(v, 'year')
              }}
            >
              <SelectTrigger className="w-32 border-gold/20 bg-navy text-white">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent className="border-gold/20 bg-charcoal text-white">
                {years.map(y => (
                  <SelectItem key={y} value={y}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:items-end">
          <Button 
            onClick={handleBulkDownload} 
            disabled={isDownloadingAny || investors.length === 0}
            className="bg-gold text-navy hover:bg-gold/90 w-full sm:w-auto"
          >
            {bulkInProgress ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileDown className="h-4 w-4 mr-2" />}
            Export All ({investors.length})
          </Button>
          
          {downloaded.size > 0 && (
            <p className="text-sm font-medium text-emerald-500">
              {downloaded.size} of {investors.length} reports downloaded for {months.find(m => m.value === month)?.label} {year}
            </p>
          )}
        </div>
      </div>

      <div className="rounded-md border border-gold/10 overflow-hidden">
        <Table>
          <TableHeader className="bg-navy/50">
            <TableRow className="border-gold/10 hover:bg-transparent">
              <TableHead className="text-gold">Investor Name</TableHead>
              <TableHead className="text-gold">Status</TableHead>
              <TableHead className="text-gold w-[150px] text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="bg-charcoal/50">
            {investors.map((inv) => (
              <TableRow key={inv.id} className="border-gold/10 hover:bg-gold/5">
                <TableCell className="font-medium text-white">{inv.name}</TableCell>
                <TableCell>
                  {downloaded.has(inv.id) ? (
                    <Badge variant="outline" className="border-emerald-500/30 text-emerald-500 bg-emerald-500/10 gap-1.5">
                      <CheckCircle2 className="h-3 w-3" /> Downloaded
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-muted/30 text-muted-foreground bg-muted/10">
                      Pending
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => downloadOne(inv)}
                    disabled={downloading[inv.id] || bulkInProgress}
                    className="text-gold hover:text-gold hover:bg-gold/10 h-8"
                  >
                    {downloading[inv.id] ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <><FileDown className="h-4 w-4 mr-2" /> Download</>
                    )}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {investors.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">
                  No active investors found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="rounded-md border border-gold/10 bg-navy/30 p-4">
        <h4 className="text-sm font-medium text-gold mb-1">Workflow Tip</h4>
        <p className="text-sm text-muted-foreground">
          Step 1: Download reports here (either individually or in bulk).<br/>
          Step 2: Review the generated Excel files.<br/>
          Step 3: Upload the files below to make them visible to investors.
        </p>
      </div>
    </div>
  )
}
