'use client'

import React, { useEffect, useState } from 'react'
import { InternalShell } from '@/components/shell/InternalShell'
import { RoleGuard } from '@/components/auth/RoleGuard'
import { Card, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from '@/components/ui/Table'
import { DashboardMetricsResponse } from '@/types/api-contracts'
import { Download, Printer, TrendingUp, ShieldAlert, BarChart3, PieChart, Users, DollarSign } from 'lucide-react'
import { formatDisplayId } from '@/lib/formatters'

export default function AdminReportsPage() {
  const [data, setData] = useState<DashboardMetricsResponse | null>(null)
  const [quotations, setQuotations] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchReportData = async () => {
      setIsLoading(true)
      try {
        const [dashRes, quoteRes, invRes] = await Promise.all([
          fetch('/api/dashboard'),
          fetch('/api/quotations'),
          fetch('/api/invoices'),
        ])

        if (!dashRes.ok) throw new Error('Failed to fetch report metrics')
        setData(await dashRes.json())

        if (quoteRes.ok) {
          setQuotations(await quoteRes.json())
        }
        if (invRes.ok) {
          setInvoices(await invRes.json())
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred while loading reports')
      } finally {
        setIsLoading(false)
      }
    }
    fetchReportData()
  }, [])

  // 1. Stage Distribution Calculations
  const stages = [
    { key: 'DRAFT', label: 'Draft', color: '#64748B' },
    { key: 'PENDING_APPROVAL', label: 'Pending', color: 'var(--copper-500)' },
    { key: 'APPROVED', label: 'Approved', color: 'var(--status-approved)' },
    { key: 'SENT', label: 'Sent', color: '#0284C7' },
    { key: 'CONFIRMED', label: 'Confirmed', color: '#0D9488' },
    { key: 'FULFILLED', label: 'Fulfilled', color: '#2563EB' },
    { key: 'REJECTED', label: 'Rejected', color: 'var(--status-rejected)' },
  ]

  const stageStats = stages.map((st) => {
    const matching = quotations.filter((q) => q.status === st.key)
    const count = matching.length
    const total = matching.reduce(
      (acc, q) => acc + (q.lines?.reduce((ls: number, l: any) => ls + Number(l.lineTotal || 0), 0) || 0),
      0
    )
    return { ...st, count, total }
  })
  const maxStageCount = Math.max(...stageStats.map((s) => s.count), 1)

  // 2. Risk Assessment Breakdown
  const lowRisk = quotations.filter((q) => Number(q.blendedRiskScore || 0) < 10)
  const medRisk = quotations.filter(
    (q) => Number(q.blendedRiskScore || 0) >= 10 && Number(q.blendedRiskScore || 0) < 25
  )
  const highRisk = quotations.filter((q) => Number(q.blendedRiskScore || 0) >= 25)
  const totalQuotes = quotations.length || 1

  const lowPct = ((lowRisk.length / totalQuotes) * 100).toFixed(1)
  const medPct = ((medRisk.length / totalQuotes) * 100).toFixed(1)
  const highPct = ((highRisk.length / totalQuotes) * 100).toFixed(1)

  // 3. Top Accounts by Total Value
  const accountMap = new Map<string, { name: string; tier: string; total: number; count: number }>()
  for (const q of quotations) {
    const name = q.customer?.name || 'Unknown'
    const tier = q.customer?.tier?.name || 'Standard'
    const qTotal = q.lines?.reduce((ls: number, l: any) => ls + Number(l.lineTotal || 0), 0) || 0
    const prev = accountMap.get(name) || { name, tier, total: 0, count: 0 }
    accountMap.set(name, { ...prev, total: prev.total + qTotal, count: prev.count + 1 })
  }
  const topAccounts = Array.from(accountMap.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)
  const maxAccountTotal = Math.max(...topAccounts.map((a) => a.total), 1)

  // 4. Financial Pipeline Metrics
  const totalPipelineVal = quotations.reduce(
    (s, q) => s + (q.lines?.reduce((ls: number, l: any) => ls + Number(l.lineTotal || 0), 0) || 0),
    0
  )
  const totalConfirmedVal = quotations
    .filter((q) => q.status === 'CONFIRMED' || q.status === 'FULFILLED')
    .reduce((s, q) => s + (q.lines?.reduce((ls: number, l: any) => ls + Number(l.lineTotal || 0), 0) || 0), 0)
  const totalInvoicedVal = invoices.reduce((s, inv) => s + Number(inv.amount || 0), 0)
  const avgDealVal = quotations.length > 0 ? totalPipelineVal / quotations.length : 0
  const avgRiskScore =
    quotations.length > 0
      ? quotations.reduce((s, q) => s + Number(q.blendedRiskScore || 0), 0) / quotations.length
      : 0

  const handleExportCSV = () => {
    if (!quotations || quotations.length === 0) {
      alert('No records to export')
      return
    }

    const headers = ['Quote ID', 'Customer', 'Tier', 'Sales Rep', 'Risk Score', 'Status', 'Total Value ($)', 'Lines Count', 'Created At']
    const rows = quotations.map((q) => {
      const qTotal = q.lines?.reduce((ls: number, l: any) => ls + Number(l.lineTotal || 0), 0) || 0
      return [
        q.id,
        `"${q.customer?.name || 'Unknown'}"`,
        `"${q.customer?.tier?.name || 'Standard'}"`,
        `"${q.rep?.name || 'Unassigned'}"`,
        Number(q.blendedRiskScore || 0).toFixed(1) + '%',
        q.status,
        qTotal.toFixed(2),
        q.lines?.length || 0,
        new Date(q.createdAt).toISOString(),
      ]
    })

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `dealflow360_executive_report_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handlePrintPDF = () => {
    window.print()
  }

  const getRiskScoreBadge = (scoreNum: number) => {
    let bg = 'var(--status-approved-subtle)'
    let color = 'var(--status-approved)'
    let border = 'var(--status-approved-border)'
    let label = 'Low'

    if (scoreNum >= 25) {
      bg = 'var(--status-rejected-subtle)'
      color = 'var(--status-rejected)'
      border = 'var(--status-rejected-border)'
      label = 'High'
    } else if (scoreNum >= 10) {
      bg = 'var(--status-pending-subtle)'
      color = 'var(--copper-700)'
      border = 'var(--status-pending-border)'
      label = 'Med'
    }

    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '6px',
          padding: '2px 7px',
          borderRadius: '3px',
          fontSize: '11px',
          fontWeight: 700,
          backgroundColor: bg,
          color: color,
          border: `1px solid ${border}`,
          fontVariantNumeric: 'tabular-nums',
          minWidth: '70px',
        }}
      >
        <span>{scoreNum.toFixed(1)}%</span>
        <span style={{ fontSize: '9px', textTransform: 'uppercase', opacity: 0.85, fontWeight: 800 }}>{label}</span>
      </span>
    )
  }

  return (
    <InternalShell title="Reporting & Analytics Dashboard">
      <RoleGuard allowedRoles={['ADMIN', 'MANAGER']}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '4px',
                backgroundColor: 'var(--status-rejected-subtle)',
                border: '1px solid var(--status-rejected-border)',
                color: 'var(--status-rejected)',
                fontSize: '12px',
              }}
            >
              {error}
            </div>
          )}

          {/* Printable Official Executive Report Header (Visible only in Print / PDF) */}
          <div className="print-only" style={{ borderBottom: '2px solid #0F172A', paddingBottom: '12px', marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  DealFlow360 — Executive Sales & Operations Report
                </h1>
                <p style={{ fontSize: '11px', color: '#475569', margin: '3px 0 0' }}>
                  Commercial Pipeline Realization, Risk Assessment & Fulfillment Ledger
                </p>
              </div>
              <div style={{ textAlign: 'right', fontSize: '10.5px', color: '#475569' }}>
                <div><strong>Generated:</strong> {new Date().toLocaleString()}</div>
                <div><strong>Classification:</strong> Confidential Management Audit</div>
              </div>
            </div>
          </div>

          {/* Action Toolbar (Hidden during print) */}
          <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ink-900)' }}>
                Executive Operations & Analytics Report
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '1px' }}>
                Pipeline velocity, approval compliance, and commercial realization
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button variant="secondary" size="sm" onClick={handlePrintPDF}>
                <Printer size={13} /> Print / Save PDF
              </Button>
              <Button variant="primary" size="sm" onClick={handleExportCSV}>
                <Download size={13} /> Export CSV
              </Button>
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px' }}>
            <Card style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Total Pipeline Value
                </span>
                <DollarSign size={16} color="var(--copper-500)" />
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--ink-900)', marginTop: '6px', fontVariantNumeric: 'tabular-nums' }}>
                {isLoading ? '...' : `$${totalPipelineVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {quotations.length} active commercial proposals
              </div>
            </Card>

            <Card style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Confirmed Bookings
                </span>
                <TrendingUp size={16} color="var(--status-approved)" />
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--status-approved)', marginTop: '6px', fontVariantNumeric: 'tabular-nums' }}>
                {isLoading ? '...' : `$${totalConfirmedVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Locked orders in fulfillment
              </div>
            </Card>

            <Card style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Total Invoiced
                </span>
                <BarChart3 size={16} color="#0284C7" />
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#0284C7', marginTop: '6px', fontVariantNumeric: 'tabular-nums' }}>
                {isLoading ? '...' : `$${totalInvoicedVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {invoices.length} issued invoices
              </div>
            </Card>

            <Card style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Avg Blended Risk
                </span>
                <ShieldAlert size={16} color={avgRiskScore >= 20 ? 'var(--status-rejected)' : 'var(--copper-500)'} />
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: avgRiskScore >= 20 ? 'var(--status-rejected)' : 'var(--copper-700)', marginTop: '6px', fontVariantNumeric: 'tabular-nums' }}>
                {isLoading ? '...' : `${avgRiskScore.toFixed(1)}%`}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Avg deal size: ${avgDealVal.toFixed(0)}
              </div>
            </Card>
          </div>

          {/* Visual Graphs Section (2 Column Responsive Layout) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '14px' }}>
            {/* Graph 1: Deal Pipeline by Lifecycle Stage (Bar Chart) */}
            <Card className="print-avoid-break" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div>
                  <h3 style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--ink-900)' }}>
                    Quotation Pipeline by Lifecycle Stage
                  </h3>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    Distribution of deals across operational stages
                  </p>
                </div>
                <Badge variant="neutral">{quotations.length} total</Badge>
              </div>

              {/* SVG Column Chart */}
              <div style={{ width: '100%', height: '190px', display: 'flex', alignItems: 'flex-end', gap: '10px', paddingTop: '20px', paddingBottom: '24px', position: 'relative', borderBottom: '1px solid var(--border-subtle)' }}>
                {stageStats.map((st) => {
                  const barHeightPct = maxStageCount > 0 ? (st.count / maxStageCount) * 100 : 0
                  const heightPx = Math.max((barHeightPct / 100) * 130, st.count > 0 ? 16 : 4)

                  return (
                    <div
                      key={st.key}
                      style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        height: '100%',
                        position: 'relative',
                      }}
                      title={`${st.label}: ${st.count} quotes ($${st.total.toFixed(2)})`}
                    >
                      {/* Count label above bar */}
                      <span style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--ink-900)', marginBottom: '4px' }}>
                        {st.count}
                      </span>
                      {/* Bar */}
                      <div
                        style={{
                          width: '100%',
                          maxWidth: '36px',
                          height: `${heightPx}px`,
                          backgroundColor: st.color,
                          borderRadius: '3px 3px 0 0',
                          transition: 'height 250ms ease',
                        }}
                      />
                      {/* Stage Name below bar */}
                      <span
                        style={{
                          position: 'absolute',
                          bottom: '-20px',
                          fontSize: '9.5px',
                          fontWeight: 600,
                          color: 'var(--text-secondary)',
                          whiteSpace: 'nowrap',
                          textTransform: 'uppercase',
                        }}
                      >
                        {st.label}
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* Mini Legend / Metrics */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginTop: '28px', fontSize: '11px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>
                  Confirmed Conversion Rate: <strong style={{ color: 'var(--status-approved)' }}>{((stageStats.find((s) => s.key === 'CONFIRMED')?.count || 0) / totalQuotes * 100).toFixed(0)}%</strong>
                </span>
                <span style={{ color: 'var(--text-secondary)' }}>
                  Pending Governance: <strong style={{ color: 'var(--copper-700)' }}>{stageStats.find((s) => s.key === 'PENDING_APPROVAL')?.count || 0}</strong>
                </span>
              </div>
            </Card>

            {/* Graph 2: Risk Assessment & Policy Compliance (Donut / Segment Breakdown) */}
            <Card className="print-avoid-break" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div>
                  <h3 style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--ink-900)' }}>
                    Risk Profile & Ceiling Compliance
                  </h3>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    Blended margin volatility & ceiling breach distribution
                  </p>
                </div>
                <ShieldAlert size={16} color="var(--copper-500)" />
              </div>

              {/* Segmented Risk Visual Bar */}
              <div style={{ marginTop: '12px', marginBottom: '18px' }}>
                <div style={{ display: 'flex', height: '22px', borderRadius: '4px', overflow: 'hidden', backgroundColor: 'var(--neutral-200)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ width: `${lowPct}%`, backgroundColor: 'var(--status-approved)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontSize: '10px', fontWeight: 700 }} title={`Low Risk: ${lowRisk.length}`}>
                    {Number(lowPct) > 12 ? `${lowPct}%` : ''}
                  </div>
                  <div style={{ width: `${medPct}%`, backgroundColor: 'var(--copper-500)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontSize: '10px', fontWeight: 700 }} title={`Medium Risk: ${medRisk.length}`}>
                    {Number(medPct) > 12 ? `${medPct}%` : ''}
                  </div>
                  <div style={{ width: `${highPct}%`, backgroundColor: 'var(--status-rejected)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontSize: '10px', fontWeight: 700 }} title={`High Risk: ${highRisk.length}`}>
                    {Number(highPct) > 12 ? `${highPct}%` : ''}
                  </div>
                </div>
              </div>

              {/* Risk Tier Detail Breakdown */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', borderRadius: '4px', backgroundColor: 'var(--status-approved-subtle)', border: '1px solid var(--status-approved-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: 'var(--status-approved)' }} />
                    <span style={{ fontWeight: 600, color: 'var(--status-approved)' }}>Low Risk Tier (&lt;10%)</span>
                  </div>
                  <div style={{ fontWeight: 700, color: 'var(--status-approved)' }}>
                    {lowRisk.length} deals ({lowPct}%)
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', borderRadius: '4px', backgroundColor: 'var(--status-pending-subtle)', border: '1px solid var(--status-pending-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: 'var(--copper-500)' }} />
                    <span style={{ fontWeight: 600, color: 'var(--copper-700)' }}>Moderate Risk Tier (10% - 24.9%)</span>
                  </div>
                  <div style={{ fontWeight: 700, color: 'var(--copper-700)' }}>
                    {medRisk.length} deals ({medPct}%)
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', borderRadius: '4px', backgroundColor: 'var(--status-rejected-subtle)', border: '1px solid var(--status-rejected-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: 'var(--status-rejected)' }} />
                    <span style={{ fontWeight: 600, color: 'var(--status-rejected)' }}>High Risk Escalations (&ge;25%)</span>
                  </div>
                  <div style={{ fontWeight: 700, color: 'var(--status-rejected)' }}>
                    {highRisk.length} deals ({highPct}%)
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Graph 3: Top Accounts Ranking by Pipeline Volume */}
          <Card className="print-avoid-break" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div>
                <h3 style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--ink-900)' }}>
                  Top Commercial Accounts by Pipeline Volume
                </h3>
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  Concentration of proposals across major enterprise clients
                </p>
              </div>
              <Users size={16} color="var(--copper-500)" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {topAccounts.map((acc, idx) => {
                const barWidth = maxAccountTotal > 0 ? (acc.total / maxAccountTotal) * 100 : 0

                return (
                  <div key={acc.name} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 700, color: 'var(--ink-900)' }}>
                          #{idx + 1} {acc.name}
                        </span>
                        <Badge variant="neutral">{acc.tier} Tier</Badge>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>({acc.count} proposals)</span>
                      </div>
                      <span style={{ fontWeight: 700, color: 'var(--ink-900)', fontVariantNumeric: 'tabular-nums' }}>
                        ${acc.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    {/* Horizontal Bar */}
                    <div style={{ height: '8px', width: '100%', backgroundColor: 'var(--neutral-100)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${barWidth}%`,
                          backgroundColor: idx === 0 ? 'var(--copper-500)' : 'var(--ink-600)',
                          borderRadius: '2px',
                          transition: 'width 300ms ease',
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Full Transaction Data Log Table */}
          <Card className="print-page-break" style={{ padding: 0 }}>
            <div
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--ink-900)' }}>
                  Commercial Transaction Ledger ({quotations.length} total records)
                </span>
                <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginLeft: '8px' }}>
                  Live synchronized from PostgreSQL database
                </span>
              </div>
            </div>

            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell style={{ width: '120px' }}>Quote Ref</TableHeaderCell>
                  <TableHeaderCell>Account / Customer</TableHeaderCell>
                  <TableHeaderCell>Tier</TableHeaderCell>
                  <TableHeaderCell>Sales Rep</TableHeaderCell>
                  <TableHeaderCell>Stage</TableHeaderCell>
                  <TableHeaderCell align="right" style={{ width: '110px' }}>Risk Score</TableHeaderCell>
                  <TableHeaderCell align="right">Items</TableHeaderCell>
                  <TableHeaderCell align="right">Total Value ($)</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {quotations.map((q) => {
                  const qTotal = q.lines?.reduce((acc: number, l: any) => acc + Number(l.lineTotal || 0), 0) || 0
                  return (
                    <TableRow key={q.id}>
                      <TableCell
                        style={{
                          fontFamily: 'ui-monospace, monospace',
                          fontSize: '12px',
                          fontWeight: 700,
                          color: 'var(--ink-900)',
                        }}
                      >
                        #{formatDisplayId(q.id)}
                      </TableCell>
                      <TableCell style={{ fontWeight: 600, color: 'var(--ink-900)' }}>
                        {q.customer?.name || 'N/A'}
                      </TableCell>
                      <TableCell style={{ color: 'var(--text-secondary)', fontSize: '11.5px' }}>
                        {q.customer?.tier?.name || 'Standard'}
                      </TableCell>
                      <TableCell style={{ color: 'var(--text-secondary)' }}>
                        {q.rep?.name || 'Unassigned'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            q.status === 'CONFIRMED' || q.status === 'APPROVED'
                              ? 'success'
                              : q.status === 'PENDING_APPROVAL'
                              ? 'warning'
                              : 'neutral'
                          }
                        >
                          {q.status?.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell align="right">
                        {getRiskScoreBadge(Number(q.blendedRiskScore || 0))}
                      </TableCell>
                      <TableCell align="right" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {q.lines?.length || 0}
                      </TableCell>
                      <TableCell align="right" style={{ fontWeight: 700, color: 'var(--ink-900)', fontVariantNumeric: 'tabular-nums' }}>
                        ${qTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </Card>
        </div>
      </RoleGuard>
    </InternalShell>
  )
}
