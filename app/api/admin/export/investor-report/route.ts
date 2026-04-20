import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import * as ExcelJS from 'exceljs'
import { startOfMonth, endOfMonth, format } from 'date-fns'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const investorId = searchParams.get('investorId')
    const yearStr = searchParams.get('year')
    const monthStr = searchParams.get('month')

    if (!investorId || !yearStr || !monthStr) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    const year = parseInt(yearStr, 10)
    const month = parseInt(monthStr, 10)

    const periodStart = startOfMonth(new Date(year, month - 1))
    const periodEnd = endOfMonth(new Date(year, month - 1))

    const authClient = await createClient()
    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!process.env.ADMIN_EMAIL || user.email !== process.env.ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const supabase = await createServiceClient()

    // 1. Fetch Investor
    let investorQuery = await supabase
      .from('investors')
      .select('id, name, investor_code, email, phone, invested_amount, fixed_return_value, fixed_return_percentage, prior_released_amount, created_at')
      .eq('id', investorId)
      .single()

    // Backward compatible fallback when prior_released_amount migration is not present.
    if (investorQuery.error && /prior_released_amount/i.test(investorQuery.error.message)) {
      investorQuery = await supabase
        .from('investors')
        .select('id, name, investor_code, email, phone, invested_amount, fixed_return_value, fixed_return_percentage, created_at')
        .eq('id', investorId)
        .single()
    }

    const { data: investor, error: invError } = investorQuery

    if (invError || !investor) {
      return NextResponse.json({ error: 'Investor not found' }, { status: 404 })
    }

    // 2. Fetch daily updates (for baseline + month)
    const { data: baselineRow } = await supabase
      .from('daily_updates')
      .select('eod_amount')
      .eq('investor_id', investorId)
      .eq('status', 'completed')
      .lt('update_date', format(periodStart, 'yyyy-MM-dd'))
      .order('update_date', { ascending: false })
      .limit(1)
      .maybeSingle()

    const baselineEOD = baselineRow
      ? Number(baselineRow.eod_amount)
      : Number(investor.invested_amount ?? 0)

    const { data: updates, error: updError } = await supabase
      .from('daily_updates')
      .select('eod_amount, trade_notes, update_date, status, created_at')
      .eq('investor_id', investorId)
      .gte('update_date', format(periodStart, 'yyyy-MM-dd'))
      .lte('update_date', format(periodEnd, 'yyyy-MM-dd'))
      .order('update_date', { ascending: true })

    if (updError) throw updError

    const { data: paidTransactions, error: paidTransactionsError } = await supabase
      .from('monthly_transactions')
      .select('amount')
      .eq('investor_id', investorId)
      .eq('status', 'paid')

    if (paidTransactionsError && !/monthly_transactions/i.test(paidTransactionsError.message)) {
      throw paidTransactionsError
    }

    const validUpdates = updates?.filter(u => u.status !== 'ongoing') || []
    
    // Compute summary stats
    const amounts = validUpdates.map(r => Number(r.eod_amount || 0))
    const tradingDays = validUpdates.length

    const opening = baselineEOD
    const closing = amounts.length ? amounts[amounts.length - 1] : baselineEOD
    const highest = amounts.length ? Math.max(...amounts) : baselineEOD
    const lowest = amounts.length ? Math.min(...amounts) : baselineEOD
    const average = amounts.length
      ? amounts.reduce((s, n) => s + n, 0) / amounts.length
      : baselineEOD
      
    const monthPnl = closing - opening
    const pnlPct = opening > 0 ? (monthPnl / opening) * 100 : 0

    // Financial calculations for export summary.
    const investedAmount = Number(investor.invested_amount ?? 0)
    const priorReleasedAmount = Number((investor as any).prior_released_amount ?? 0)
    const paidReleasedAmount = (paidTransactions ?? []).reduce(
      (sum, row) => sum + Number(row.amount ?? 0),
      0,
    )
    const withdrawnAmount = priorReleasedAmount + paidReleasedAmount
    const activeCapital = investedAmount - withdrawnAmount
    const monthProfit = monthPnl
    const totalProfit = closing + withdrawnAmount - investedAmount
    const unrealizedProfit = closing - activeCapital
    const capitalRecoveryStatus = withdrawnAmount >= investedAmount ? 'Capital Recovered' : 'At Risk'

    // Colors
    const colors = {
      navy: '0D1526',
      charcoal: '1A2035',
      gold: 'D4AF37',
      white: '000000', // Changed to black for white background
      muted: '4B5563', // Changed to dark gray for clear visibility
      green: '10B981',
      red: 'EF4444',
      amber: 'F59E0B'
    }

    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'RK Smart Money Admin Portal'
    workbook.created = new Date()

    // ----------------------------------------------------
    // Sheet 1: Summary Stats
    // ----------------------------------------------------
    const s1 = workbook.addWorksheet('Summary', {
      views: [{ showGridLines: false, state: 'frozen', ySplit: 2 }]
    })

    s1.columns = [
      { width: 32 },
      { width: 28 },
      { width: 20 },
      { width: 20 },
    ]

    // Row 1: Gold banner
    const r1 = s1.addRow(["RK SMART MONEY — INVESTOR MONTHLY REPORT"])
    s1.mergeCells('A1:D1')
    r1.height = 30
    r1.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.gold } }
    r1.getCell(1).font = { bold: true, size: 16, color: { argb: colors.navy } }
    r1.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' }

    // Row 2: Month label
    const periodName = format(periodStart, 'MMMM yyyy')
    const r2 = s1.addRow([`Report Period: ${periodName}`])
    s1.mergeCells('A2:D2')
    r2.height = 25
    r2.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.navy } }
    r2.getCell(1).font = { bold: true, size: 12, color: { argb: colors.gold } }
    r2.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' }

    s1.addRow([]) // Spacer

    const addSectionHeader = (title: string) => {
      const r = s1.addRow([title])
      s1.mergeCells(`A${r.number}:D${r.number}`)
      r.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.charcoal } }
      r.getCell(1).font = { bold: true, color: { argb: colors.gold }, size: 12 }
      r.getCell(1).alignment = { vertical: 'middle' }
      r.height = 22
    }

    const addDataRow = (label1: string, val1: any, label2: string, val2: any, isDate: boolean = false, isCurrency: boolean = false) => {
      const r = s1.addRow([label1, val1, label2, val2])
      r.font = { color: { argb: colors.white } }
      r.getCell(1).font = { color: { argb: colors.muted } }
      r.getCell(3).font = { color: { argb: colors.muted } }
      r.getCell(2).alignment = { horizontal: 'left', vertical: 'middle' }
      r.getCell(4).alignment = { horizontal: 'left', vertical: 'middle' }
      if (isCurrency) {
        r.getCell(2).numFmt = '₹#,##0.00'
        r.getCell(4).numFmt = '₹#,##0.00'
      }
      return r
    }

    // Section 1: Investor Details
    addSectionHeader('Investor Details')
    addDataRow('Investor Name:', investor.name, 'Account Since:', investor.created_at ? format(new Date(investor.created_at), 'dd MMM yyyy') : 'N/A')
    addDataRow('Investor ID:', investor.investor_code || investor.id, 'Report Period:', periodName)
    addDataRow('Email:', investor.email || 'N/A', 'Phone:', investor.phone || 'N/A')
    s1.addRow([])

    // Section 2: Investment Profile
    addSectionHeader('Investment Profile')
    const invProfileRow = addDataRow('Invested Capital:', investedAmount, 'Fixed Monthly Return:', Number(investor.fixed_return_value || 0))
    invProfileRow.getCell(2).numFmt = '₹#,##0.00'
    invProfileRow.getCell(2).font = { color: { argb: colors.gold }, bold: true }
    invProfileRow.getCell(4).numFmt = '₹#,##0.00'
    
    const aprRow = addDataRow('Annual Return Rate %:', (investor.fixed_return_percentage || 0) + '%', '', '')
    s1.addRow([])

    // Section 3: Monthly Performance Summary
    addSectionHeader('Monthly Performance Summary')
    const perf1 = addDataRow('Opening Balance:', opening, 'Closing Balance:', closing, false, true)
    const perf2 = addDataRow('Highest Balance:', highest, 'Lowest Balance:', lowest, false, true)
    perf2.getCell(2).font = { color: { argb: colors.green } }
    perf2.getCell(4).font = { color: { argb: colors.red } }
    
    const perf3 = addDataRow('Average Balance:', average, 'Trading Days:', tradingDays, false, true)
    perf3.getCell(4).numFmt = '0'

    const pnlPctText = pnlPct > 0 ? `+${pnlPct.toFixed(2)}%` : `${pnlPct.toFixed(2)}%`
    
    const pnlRow = addDataRow('Month P&L (₹):', monthPnl, 'Month P&L (%):', pnlPctText)
    pnlRow.getCell(2).numFmt = '+₹#,##0.00;-₹#,##0.00'
    pnlRow.getCell(2).font = { color: { argb: monthPnl >= 0 ? colors.green : colors.red }, bold: true }
    pnlRow.getCell(4).font = { color: { argb: pnlPct >= 0 ? colors.green : colors.red }, bold: true }

    s1.addRow([])

    // Section 4: Core Financial Output
    addSectionHeader('Core Financial Output')

    const rowInvested = addDataRow('Invested Amount (₹):', investedAmount, '', '')
    rowInvested.getCell(2).numFmt = '₹#,##0.00'

    const rowWithdrawn = addDataRow('Withdrawn Amount (₹):', withdrawnAmount, '', '')
    rowWithdrawn.getCell(2).numFmt = '₹#,##0.00'

    const rowActiveCapital = addDataRow('Active Capital (₹):', activeCapital, '', '')
    rowActiveCapital.getCell(2).value = {
      formula: `B${rowInvested.number}-B${rowWithdrawn.number}`,
      result: activeCapital,
    }
    rowActiveCapital.getCell(2).numFmt = '+₹#,##0.00;-₹#,##0.00'
    rowActiveCapital.getCell(2).font = { color: { argb: activeCapital >= 0 ? colors.green : colors.red }, bold: true }

    const rowCurrentValue = addDataRow('Current Value (Closing Balance) (₹):', closing, '', '')
    rowCurrentValue.getCell(2).numFmt = '₹#,##0.00'
    rowCurrentValue.getCell(2).font = { color: { argb: colors.gold }, bold: true }

    const rowMonthProfit = addDataRow('Monthly Profit (₹):', monthProfit, '', '')
    rowMonthProfit.getCell(2).value = {
      formula: `B${rowCurrentValue.number}-B${perf1.number}`,
      result: monthProfit,
    }
    rowMonthProfit.getCell(2).numFmt = '+₹#,##0.00;-₹#,##0.00'
    rowMonthProfit.getCell(2).font = { color: { argb: monthProfit >= 0 ? colors.green : colors.red }, bold: true }

    const rowTotalProfit = addDataRow('Total Profit (₹):', totalProfit, '', '')
    rowTotalProfit.getCell(2).value = {
      formula: `B${rowCurrentValue.number}+B${rowWithdrawn.number}-B${rowInvested.number}`,
      result: totalProfit,
    }
    rowTotalProfit.getCell(2).numFmt = '+₹#,##0.00;-₹#,##0.00'
    rowTotalProfit.getCell(2).font = { color: { argb: totalProfit >= 0 ? colors.green : colors.red }, bold: true }

    const rowUnrealizedProfit = addDataRow('Unrealized Profit (₹):', unrealizedProfit, '', '')
    rowUnrealizedProfit.getCell(2).value = {
      formula: `B${rowCurrentValue.number}-B${rowActiveCapital.number}`,
      result: unrealizedProfit,
    }
    rowUnrealizedProfit.getCell(2).numFmt = '+₹#,##0.00;-₹#,##0.00'
    rowUnrealizedProfit.getCell(2).font = { color: { argb: unrealizedProfit >= 0 ? colors.green : colors.red }, bold: true }

    const rowStatus = addDataRow('Status:', capitalRecoveryStatus, '', '')
    rowStatus.getCell(2).value = {
      formula: `IF(B${rowWithdrawn.number}>=B${rowInvested.number},"Capital Recovered","At Risk")`,
      result: capitalRecoveryStatus,
    }
    rowStatus.getCell(2).alignment = { horizontal: 'right', vertical: 'middle' }
    rowStatus.getCell(2).font = {
      color: { argb: capitalRecoveryStatus === 'Capital Recovered' ? colors.green : colors.red },
      bold: true,
    }

    s1.addRow([])
    
    const fR = s1.addRow([`Generated on ${format(new Date(), 'dd MMM yyyy HH:mm')} by RK Smart Money Admin Portal`])
    s1.mergeCells(`A${fR.number}:D${fR.number}`)
    fR.getCell(1).font = { color: { argb: colors.muted }, italic: true, size: 10 }
    fR.getCell(1).alignment = { horizontal: 'center' }

    const creditR = s1.addRow(['made with ❤️ by kkaptureflowmedia'])
    s1.mergeCells(`A${creditR.number}:D${creditR.number}`)
    creditR.getCell(1).font = { color: { argb: colors.muted }, italic: true, size: 10 }
    creditR.getCell(1).alignment = { horizontal: 'center' }

    // ----------------------------------------------------
    // Sheet 2: Daily Updates
    // ----------------------------------------------------
    const s2 = workbook.addWorksheet('Daily Updates', {
      views: [{ showGridLines: false, state: 'frozen', ySplit: 2 }]
    })

    s2.columns = [
      { width: 16 },
      { width: 22 },
      { width: 18 },
      { width: 14 },
      { width: 50 },
    ]

    const s2r1 = s2.addRow([`Daily Updates — ${investor.name} (${periodName})`])
    s2.mergeCells('A1:E1')
    s2r1.height = 30
    s2r1.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.gold } }
    s2r1.getCell(1).font = { bold: true, size: 14, color: { argb: colors.navy } }
    s2r1.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' }

    const s2r2 = s2.addRow(['Date', 'EOD Amount (₹)', 'Daily P&L (₹)', 'Status', 'Trade Notes'])
    s2r2.height = 20
    s2r2.eachCell(c => {
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.charcoal } }
      c.font = { bold: true, color: { argb: colors.gold } }
      c.alignment = { vertical: 'middle' }
    })

    if (!updates || updates.length === 0) {
      const nr = s2.addRow(['No daily updates recorded for this period.'])
      s2.mergeCells(`A3:E3`)
      nr.getCell(1).font = { color: { argb: colors.muted }, italic: true }
      nr.getCell(1).alignment = { horizontal: 'center' }
    } else {
      updates.forEach((u, i) => {
        const currentEod = Number(u.eod_amount || 0)
        let dailyPnl = 0
        if (i === 0) {
          dailyPnl = currentEod - baselineEOD
        } else {
          dailyPnl = currentEod - Number(updates[i-1].eod_amount || 0)
        }

        const r = s2.addRow([
          format(new Date(u.update_date), 'dd MMM yyyy'),
          currentEod,
          u.status === 'ongoing' ? 'Ongoing' : dailyPnl,
          u.status === 'ongoing' ? 'Ongoing' : 'Completed',
          u.trade_notes || ''
        ])

        // r.fill removed for white background visibility
        
        r.getCell(1).font = { color: { argb: colors.white } }
        
        r.getCell(2).numFmt = '₹#,##0.00'
        r.getCell(2).font = { color: { argb: colors.gold }, bold: true }
        
        if (u.status === 'ongoing') {
          r.getCell(3).font = { color: { argb: colors.amber }, italic: true }
          r.getCell(4).font = { color: { argb: colors.amber } }
        } else {
          r.getCell(3).numFmt = '+₹#,##0.00;-₹#,##0.00'
          r.getCell(3).font = { color: { argb: dailyPnl >= 0 ? colors.green : colors.red } }
          r.getCell(4).font = { color: { argb: colors.green } }
        }
        r.getCell(4).alignment = { horizontal: 'right', vertical: 'middle' }
        
        r.getCell(5).font = { color: { argb: u.trade_notes ? colors.white : colors.muted }, italic: !u.trade_notes }
        r.getCell(5).alignment = { wrapText: true }
      })

      // Totals row
      const tR = s2.addRow(['TOTAL / CLOSING', closing, monthPnl, `${tradingDays} Days`, `vs prev: ${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(baselineEOD)}`])
      tR.eachCell(c => {
        c.border = { top: { style: 'medium', color: { argb: colors.gold } } }
        // tR fill removed for optimal white background visibility
        c.font = { bold: true }
      })
      tR.getCell(1).font = { color: { argb: colors.gold }, bold: true }
      tR.getCell(2).numFmt = '₹#,##0.00'
      tR.getCell(2).font = { color: { argb: colors.gold }, bold: true }
      tR.getCell(3).numFmt = '+₹#,##0.00;-₹#,##0.00'
      tR.getCell(3).font = { color: { argb: monthPnl >= 0 ? colors.green : colors.red }, bold: true }
      tR.getCell(4).font = { color: { argb: colors.white } }

      s2.addRow([]) // Spacer
      
      // Footer row
      const fR2 = s2.addRow(['made with ❤️ by kkaptureflowmedia'])
      s2.mergeCells(`A${fR2.number}:E${fR2.number}`)
      fR2.getCell(1).font = { color: { argb: colors.muted }, italic: true, size: 10 }
      fR2.getCell(1).alignment = { horizontal: 'center' }
    }

    const buffer = await workbook.xlsx.writeBuffer()

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${investor.name.replace(/[^a-z0-9]/gi, '_')}_${month}.xlsx"`,
        'Cache-Control': 'no-store'
      }
    })

  } catch (error: any) {
    console.error('Error generating Excel report:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
