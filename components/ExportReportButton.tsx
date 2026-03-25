'use client'

import { useState } from 'react'
import { FileDown, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function ExportReportButton({ investorId, investorName }: { investorId: string, investorName: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const today = new Date()
  const prevMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1)
  
  const [month, setMonth] = useState((prevMonthDate.getMonth() + 1).toString())
  const [year, setYear] = useState(prevMonthDate.getFullYear().toString())

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: (i + 1).toString(),
    label: format(new Date(2000, i, 1), 'MMMM')
  }))

  const years = [today.getFullYear(), today.getFullYear() - 1, today.getFullYear() - 2].map(String)

  const handleDownload = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/admin/export/investor-report?investorId=${investorId}&month=${month}&year=${year}`)
      
      if (!res.ok) {
        throw new Error('Failed to generate report')
      }

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const contentDisposition = res.headers.get('Content-Disposition')
      let filename = `${investorName}_${month}.xlsx`
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/)
        if (match) filename = match[1]
      }
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success('Report downloaded successfully')
      setOpen(false)
    } catch (err: any) {
      toast.error(err.message || 'Error downloading report')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" className="border-gold/30 text-gold hover:bg-gold/10 gap-2">
            <FileDown className="h-4 w-4" />
            Export Monthly Report
          </Button>
        }
      />
      <DialogContent className="border-gold/20 bg-charcoal text-white sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-gold">Export Monthly Report</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Download a detailed .xlsx file with daily updates and summary for {investorName}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Month</label>
              <Select
                value={month}
                onValueChange={(value) => {
                  if (value) setMonth(value)
                }}
              >
                <SelectTrigger className="border-gold/20 bg-navy text-white">
                  <SelectValue placeholder="Select month" />
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
                onValueChange={(value) => {
                  if (value) setYear(value)
                }}
              >
                <SelectTrigger className="border-gold/20 bg-navy text-white">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent className="border-gold/20 bg-charcoal text-white">
                  {years.map(y => (
                    <SelectItem key={y} value={y}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="rounded-md border border-gold/10 bg-navy/50 p-3 text-sm">
            <p className="text-muted-foreground">
              Preview filename: <span className="font-mono text-gold/80">{investorName.replace(/[^a-zA-Z0-9]/g, '_')}_{month}.xlsx</span>
            </p>
          </div>
          
          <p className="text-xs text-muted-foreground/80 italic">
            Tip: After downloading, upload via Admin → Reports → Upload Monthly Report.
          </p>
        </div>
        
        <div className="flex justify-end gap-3">
          <Button variant="outline" className="border-gold/20 text-muted-foreground hover:bg-white/5" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleDownload} disabled={loading} className="bg-gold text-navy hover:bg-gold/90">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileDown className="h-4 w-4 mr-2" />}
            {loading ? 'Downloading...' : 'Download'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
