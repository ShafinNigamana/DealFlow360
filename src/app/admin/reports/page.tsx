'use client'

import React, { useEffect, useState } from 'react'
import { InternalShell } from '@/components/shell/InternalShell'
import { RoleGuard } from '@/components/auth/RoleGuard'
import { Card, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from '@/components/ui/Table'
import { DashboardMetricsResponse } from '@/types/api-contracts'
import { BarChart2, FileText, CheckCircle, AlertTriangle, Download, Printer } from 'lucide-react'

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
      alert('No data available to export.')
      return
    }

    const headers = ['Quotation ID', 'Customer', 'Sales Rep', 'Status', 'Risk Score', 'Lines Count', 'Created Date']
    const rows = quotations.map((q) => [
      q.id,
      `"${q.customer?.name || 'N/A'}"`,
      `"${q.rep?.name || 'N/A'}"`,
      q.status,
      `${q.blendedRiskScore || 0}%`,
      q.lines?.length || 0,
      new Date(q.createdAt).toISOString().split('T')[0],
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `dealflow360_pipeline_report_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handlePrintPDF = () => {
    window.print()
  }

  const s = data?.summary

  return (
    <InternalShell title="Reporting & Analytics Dashboard">
      <RoleGuard allowedRoles={['ADMIN']}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {error && (
          <div style={{ padding: '12px', borderRadius: '6px', backgroundColor: '#FEF2F2', color: '#B91C1C', fontSize: '13px' }}>
            {error}
          </div>
        )}

        {/* Action Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#18181B' }}>Sales & Operations Report</h1>
            <p style={{ fontSize: '13px', color: '#71717A', marginTop: '2px' }}>
              Real-time pipeline metrics, approval velocity, and transaction logs
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button variant="secondary" onClick={handlePrintPDF}>
              <Printer size={15} /> Print / Save PDF
            </Button>
            <Button variant="primary" onClick={handleExportCSV}>
              <Download size={15} /> Export CSV
            </Button>
          </div>
        </div>

        {/* KPI Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '6px', backgroundColor: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={18} color="#4F46E5" />
              </div>
              <div>
                <span style={{ fontSize: '12px', color: '#71717A', fontWeight: 500 }}>Total Quotations</span>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#18181B' }}>
                  {isLoading ? '...' : s?.totalQuotations ?? 0}
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '6px', backgroundColor: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle size={18} color="#B45309" />
              </div>
              <div>
                <span style={{ fontSize: '12px', color: '#71717A', fontWeight: 500 }}>Pending Approvals</span>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#B45309' }}>
                  {isLoading ? '...' : s?.pendingApprovalCount ?? 0}
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '6px', backgroundColor: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BarChart2 size={18} color="#15803D" />
              </div>
              <div>
                <span style={{ fontSize: '12px', color: '#71717A', fontWeight: 500 }}>Approved Deals</span>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#15803D' }}>
                  {isLoading ? '...' : s?.approvedCount ?? 0}
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '6px', backgroundColor: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={18} color="#B91C1C" />
              </div>
              <div>
                <span style={{ fontSize: '12px', color: '#71717A', fontWeight: 500 }}>Open Alerts</span>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#B91C1C' }}>
                  {isLoading ? '...' : s?.openAlertsCount ?? 0}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Pipeline Breakdown */}
        <Card>
          <CardHeader title="Pipeline Status Breakdown" subtitle="Current distribution of quotations across lifecycle stages" />
          {isLoading ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#71717A', fontSize: '13px' }}>
              Loading pipeline data...
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', padding: '16px' }}>
              {[
                { label: 'Draft', count: s?.draftCount ?? 0, variant: 'neutral' as const },
                { label: 'Pending Approval', count: s?.pendingApprovalCount ?? 0, variant: 'warning' as const },
                { label: 'Approved', count: s?.approvedCount ?? 0, variant: 'success' as const },
                { label: 'Rejected', count: s?.rejectedCount ?? 0, variant: 'danger' as const },
                { label: 'Fulfilled', count: s?.fulfilledCount ?? 0, variant: 'accent' as const },
              ].map((stage) => (
                <div
                  key={stage.label}
                  style={{
                    padding: '16px',
                    borderRadius: '8px',
                    border: '1px solid #E4E4E7',
                    textAlign: 'center',
                  }}
                >
                  <Badge variant={stage.variant}>{stage.label}</Badge>
                  <div style={{ fontSize: '28px', fontWeight: 700, color: '#18181B', marginTop: '8px' }}>
                    {stage.count}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Detail Records for Export */}
        <Card style={{ padding: 0 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #E4E4E7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, fontSize: '14px', color: '#18181B' }}>Transaction Data Log ({quotations.length} records)</span>
            <span style={{ fontSize: '12px', color: '#71717A' }}>Live synced from PostgreSQL</span>
          </div>

          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>ID</TableHeaderCell>
                <TableHeaderCell>Customer</TableHeaderCell>
                <TableHeaderCell>Sales Rep</TableHeaderCell>
                <TableHeaderCell>Stage</TableHeaderCell>
                <TableHeaderCell>Risk Score</TableHeaderCell>
                <TableHeaderCell>Lines</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {quotations.slice(0, 10).map((q) => (
                <TableRow key={q.id}>
                  <TableCell style={{ fontFamily: 'monospace', fontSize: '12px' }}>{q.id.slice(-8).toUpperCase()}</TableCell>
                  <TableCell style={{ fontWeight: 600 }}>{q.customer?.name || 'N/A'}</TableCell>
                  <TableCell>{q.rep?.name || 'Unassigned'}</TableCell>
                  <TableCell>
                    <Badge variant={q.status === 'APPROVED' ? 'success' : q.status === 'PENDING_APPROVAL' ? 'warning' : 'neutral'}>
                      {q.status}
                    </Badge>
                  </TableCell>
                  <TableCell style={{ fontWeight: 600, color: Number(q.blendedRiskScore) > 20 ? '#B91C1C' : '#15803D' }}>
                    {Number(q.blendedRiskScore || 0).toFixed(1)}%
                  </TableCell>
                  <TableCell>{q.lines?.length || 0}</TableCell>
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
