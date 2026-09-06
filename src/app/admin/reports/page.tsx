'use client'

import React, { useEffect, useState } from 'react'
import { InternalShell } from '@/components/shell/InternalShell'
import { RoleGuard } from '@/components/auth/RoleGuard'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from '@/components/ui/Table'
import { DashboardMetricsResponse } from '@/types/api-contracts'
import { Download, Printer } from 'lucide-react'

export default function AdminReportsPage() {
  const [data, setData] = useState<DashboardMetricsResponse | null>(null)
  const [quotations, setQuotations] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchReportData = async () => {
      setIsLoading(true)
      try {
        const [dashRes, quoteRes] = await Promise.all([
          fetch('/api/dashboard'),
          fetch('/api/quotations'),
        ])

        if (!dashRes.ok) throw new Error('Failed to fetch report data')
        const json = await dashRes.json()
        setData(json)

        if (quoteRes.ok) {
          const qJson = await quoteRes.json()
          setQuotations(qJson)
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred')
      } finally {
        setIsLoading(false)
      }
    }
    fetchReportData()
  }, [])

  const handleExportCSV = () => {
    if (!quotations || quotations.length === 0) {
      alert('No records to export')
      return
    }

    const headers = ['Quote ID', 'Customer', 'Sales Rep', 'Risk Score', 'Status', 'Lines Count', 'Created At']
    const rows = quotations.map((q) => [
      q.id,
      `"${q.customer?.name || 'Unknown'}"`,
      `"${q.rep?.name || 'Unassigned'}"`,
      Number(q.blendedRiskScore || 0).toFixed(1) + '%',
      q.status,
      q.lines?.length || 0,
      new Date(q.createdAt).toISOString(),
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `dealflow360_pipeline_report_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handlePrintPDF = () => {
    window.print()
  }

  const s = data?.summary

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
          fontSize: '11.5px',
          fontWeight: 700,
          backgroundColor: bg,
          color: color,
          border: `1px solid ${border}`,
          fontVariantNumeric: 'tabular-nums',
          minWidth: '76px',
        }}
      >
        <span>{scoreNum.toFixed(1)}%</span>
        <span style={{ fontSize: '9px', textTransform: 'uppercase', opacity: 0.85, fontWeight: 800 }}>
          {label}
        </span>
      </span>
    )
  }

  return (
    <InternalShell title="Reporting & Analytics Dashboard">
      <RoleGuard allowedRoles={['ADMIN']}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {error && (
            <div style={{ padding: '10px 14px', borderRadius: '4px', backgroundColor: 'var(--status-rejected-subtle)', border: '1px solid var(--status-rejected-border)', color: 'var(--status-rejected)', fontSize: '12px' }}>
              {error}
            </div>
          )}

          {/* Action Toolbar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ink-900)' }}>Sales & Operations Governance Report</h2>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '1px' }}>
                Pipeline metrics, approval velocity, and transaction ledger
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

          {/* KPI Summary Cards (Dense technical metrics) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <div
              style={{
                backgroundColor: 'var(--surface-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '4px',
                padding: '12px 14px',
              }}
            >
              <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Total Quotations
              </span>
              <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--ink-900)', marginTop: '4px', fontVariantNumeric: 'tabular-nums' }}>
                {isLoading ? '...' : s?.totalQuotations ?? 0}
              </div>
            </div>

            <div
              style={{
                backgroundColor: 'var(--surface-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '4px',
                padding: '12px 14px',
              }}
            >
              <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Pending Approvals
              </span>
              <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--copper-600)', marginTop: '4px', fontVariantNumeric: 'tabular-nums' }}>
                {isLoading ? '...' : s?.pendingApprovalCount ?? 0}
              </div>
            </div>

            <div
              style={{
                backgroundColor: 'var(--surface-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '4px',
                padding: '12px 14px',
              }}
            >
              <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Approved Deals
              </span>
              <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--status-approved)', marginTop: '4px', fontVariantNumeric: 'tabular-nums' }}>
                {isLoading ? '...' : s?.approvedCount ?? 0}
              </div>
            </div>

            <div
              style={{
                backgroundColor: 'var(--surface-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '4px',
                padding: '12px 14px',
              }}
            >
              <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                At-Risk Breaches
              </span>
              <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--status-rejected)', marginTop: '4px', fontVariantNumeric: 'tabular-nums' }}>
                {isLoading ? '...' : s?.openAlertsCount ?? 0}
              </div>
            </div>
          </div>

          {/* Detail Records for Export */}
          <Card style={{ padding: 0 }}>
            <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: '12.5px', color: 'var(--ink-900)' }}>Transaction Data Log ({quotations.length} records)</span>
              <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>Live synced from PostgreSQL</span>
            </div>

            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell style={{ width: '130px' }}>Quote Ref</TableHeaderCell>
                  <TableHeaderCell>Account / Customer</TableHeaderCell>
                  <TableHeaderCell>Owner (Rep)</TableHeaderCell>
                  <TableHeaderCell>Stage</TableHeaderCell>
                  <TableHeaderCell align="right" style={{ width: '120px' }}>Risk Assessment</TableHeaderCell>
                  <TableHeaderCell align="right">Lines</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {quotations.slice(0, 10).map((q) => (
                  <TableRow key={q.id}>
                    <TableCell style={{ fontFamily: 'ui-monospace, monospace', fontSize: '12px', fontWeight: 700, color: 'var(--ink-900)' }}>
                      #{q.id.slice(-8).toUpperCase()}
                    </TableCell>
                    <TableCell style={{ fontWeight: 600, color: 'var(--ink-900)' }}>{q.customer?.name || 'N/A'}</TableCell>
                    <TableCell style={{ color: 'var(--text-secondary)' }}>{q.rep?.name || 'Unassigned'}</TableCell>
                    <TableCell>
                      <Badge variant={q.status === 'APPROVED' ? 'success' : q.status === 'PENDING_APPROVAL' ? 'warning' : 'neutral'}>
                        {q.status?.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell align="right">
                      {getRiskScoreBadge(Number(q.blendedRiskScore || 0))}
                    </TableCell>
                    <TableCell align="right" style={{ fontVariantNumeric: 'tabular-nums' }}>{q.lines?.length || 0}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      </RoleGuard>
    </InternalShell>
  )
}
