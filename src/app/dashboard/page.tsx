'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { InternalShell } from '@/components/shell/InternalShell'
import { RoleGuard } from '@/components/auth/RoleGuard'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from '@/components/ui/Table'
import { DashboardMetricsResponse, QuotationDTO } from '@/types/api-contracts'
import { Plus, ArrowUpRight } from 'lucide-react'
import { formatDisplayId } from '@/lib/formatters'

export default function DashboardPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const userRole = session?.user?.role || ''
  const [data, setData] = useState<DashboardMetricsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchDashboardData = async () => {
    setIsLoading(true)
    setError('')
    try {
      const res = await fetch('/api/dashboard')
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/login')
          return
        }
        throw new Error('Failed to fetch dashboard metrics')
      }
      const json = await res.json()
      setData(json)
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  // Status Badge using calibrated semantic tokens
  const getStatusBadge = (status: string) => {
    let bg = 'var(--neutral-100)'
    let color = 'var(--text-secondary)'
    let border = 'var(--neutral-200)'

    switch (status) {
      case 'APPROVED':
      case 'CONFIRMED':
      case 'FULFILLED':
        bg = 'var(--status-approved-subtle)'
        color = 'var(--status-approved)'
        border = 'var(--status-approved-border)'
        break
      case 'PENDING_APPROVAL':
        bg = 'var(--status-pending-subtle)'
        color = 'var(--copper-700)'
        border = 'var(--status-pending-border)'
        break
      case 'REJECTED':
      case 'CANCELLED':
        bg = 'var(--status-rejected-subtle)'
        color = 'var(--status-rejected)'
        border = 'var(--status-rejected-border)'
        break
      default:
        break
    }

    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: '2px 7px',
          borderRadius: '3px',
          fontSize: '11px',
          fontWeight: 600,
          backgroundColor: bg,
          color: color,
          border: `1px solid ${border}`,
          whiteSpace: 'nowrap',
          letterSpacing: '0.02em',
        }}
      >
        {status.replace('_', ' ')}
      </span>
    )
  }

  // Risk Score Badge — visually dominates the row
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
          padding: '3px 8px',
          borderRadius: '3px',
          fontSize: '11.5px',
          fontWeight: 700,
          backgroundColor: bg,
          color: color,
          border: `1px solid ${border}`,
          fontVariantNumeric: 'tabular-nums',
          minWidth: '78px',
        }}
      >
        <span>{scoreNum.toFixed(1)}%</span>
        <span style={{ fontSize: '9.5px', textTransform: 'uppercase', opacity: 0.85, fontWeight: 800 }}>
          {label}
        </span>
      </span>
    )
  }

  return (
    <InternalShell title="Sales Operations Console">
      <RoleGuard allowedRoles={['REP', 'MANAGER', 'FINANCE', 'ADMIN']}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Header Action Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--ink-900)', letterSpacing: '-0.01em' }}>
                Pipeline & Risk Overview
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '1px' }}>
                Live deal flow governance, approval queues, and anomaly monitoring
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {(userRole === 'REP' || userRole === 'MANAGER') && (
                <Link href="/quotations">
                  <Button variant="primary" size="sm">
                    <Plus size={13} />
                    New Quotation
                  </Button>
                </Link>
              )}
              {(userRole === 'MANAGER' || userRole === 'FINANCE') && (
                <Link href="/approvals">
                  <Button variant="secondary" size="sm">
                    Review Approvals Queue
                    <ArrowUpRight size={13} />
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* High-Density Stat Cards (Thin 1px border, large number, no circle bubbles) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            {/* Stat 1: Pending Approvals */}
            <div
              style={{
                backgroundColor: 'var(--surface-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '4px',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div
                style={{
                  fontSize: '10.5px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span>Pending Approvals</span>
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: (data?.summary.pendingApprovalCount ?? 0) > 0 ? 'var(--copper-500)' : 'var(--neutral-400)',
                  }}
                />
              </div>
              <div style={{ marginTop: '6px', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontSize: '28px', fontWeight: 800, color: 'var(--ink-900)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em', lineHeight: 1 }}>
                  {isLoading ? '—' : data?.summary.pendingApprovalCount ?? 0}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  in review chain
                </span>
              </div>
            </div>

            {/* Stat 2: Open Pipeline Quotes */}
            <div
              style={{
                backgroundColor: 'var(--surface-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '4px',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div
                style={{
                  fontSize: '10.5px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span>Open Quotations</span>
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--status-info)',
                  }}
                />
              </div>
              <div style={{ marginTop: '6px', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontSize: '28px', fontWeight: 800, color: 'var(--ink-900)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em', lineHeight: 1 }}>
                  {isLoading ? '—' : (data?.summary.draftCount ?? 0) + (data?.summary.pendingApprovalCount ?? 0)}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  drafts & submitted
                </span>
              </div>
            </div>

            {/* Stat 3: At-Risk Deals */}
            <div
              style={{
                backgroundColor: 'var(--surface-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '4px',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div
                style={{
                  fontSize: '10.5px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span>At-Risk Deals</span>
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: (data?.summary.openAlertsCount ?? 0) > 0 ? 'var(--status-rejected)' : 'var(--neutral-400)',
                  }}
                />
              </div>
              <div style={{ marginTop: '6px', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontSize: '28px', fontWeight: 800, color: (data?.summary.openAlertsCount ?? 0) > 0 ? 'var(--status-rejected)' : 'var(--ink-900)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em', lineHeight: 1 }}>
                  {isLoading ? '—' : data?.summary.openAlertsCount ?? 0}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  threshold breaches
                </span>
              </div>
            </div>
          </div>

          {/* Error Notice */}
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

          {/* Recent Activity Table — High Density Console View */}
          <Card style={{ padding: 0 }}>
            <div
              style={{
                padding: '12px 14px',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink-900)', letterSpacing: '-0.01em' }}>
                  Live Quotation Pipeline
                </h3>
                <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '1px' }}>
                  Click row to open quotation builder, discount details, or audit trail
                </p>
              </div>
              <Link href="/quotations">
                <span
                  style={{
                    fontSize: '11.5px',
                    fontWeight: 600,
                    color: 'var(--copper-500)',
                    cursor: 'pointer',
                    transition: 'color 180ms ease',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.color = 'var(--copper-700)')}
                  onMouseOut={(e) => (e.currentTarget.style.color = 'var(--copper-500)')}
                >
                  View All ({data?.recentQuotations?.length ?? 0}) →
                </span>
              </Link>
            </div>

            {isLoading ? (
              <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '12.5px' }}>
                Loading pipeline transactions...
              </div>
            ) : !data?.recentQuotations || data.recentQuotations.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '12.5px' }}>
                No recent quotations found in the active workspace.
              </div>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell style={{ width: '130px' }}>Quote Ref</TableHeaderCell>
                    <TableHeaderCell>Account / Customer</TableHeaderCell>
                    <TableHeaderCell>Owner (Rep)</TableHeaderCell>
                    <TableHeaderCell align="right" style={{ width: '120px' }}>Risk Assessment</TableHeaderCell>
                    <TableHeaderCell style={{ width: '140px' }}>Governance Status</TableHeaderCell>
                    <TableHeaderCell align="right" style={{ width: '100px' }}>Created</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.recentQuotations.map((quote: QuotationDTO) => (
                    <TableRow
                      key={quote.id}
                      onClick={() => router.push(`/quotations/${quote.id}`)}
                    >
                      {/* Quote Ref with Monospace tabular ID */}
                      <TableCell style={{ fontWeight: 700, color: 'var(--ink-900)', fontFamily: 'ui-monospace, monospace', fontSize: '12px' }}>
                        #{formatDisplayId(quote.id)}
                      </TableCell>

                      {/* Customer Name */}
                      <TableCell style={{ fontWeight: 600, color: 'var(--ink-900)' }}>
                        {quote.customer?.name || 'Unassigned Account'}
                      </TableCell>

                      {/* Rep Name */}
                      <TableCell style={{ color: 'var(--text-secondary)' }}>
                        {quote.rep?.name || 'Unassigned'}
                      </TableCell>

                      {/* Risk Score: Visually Dominates the Row */}
                      <TableCell align="right">
                        {getRiskScoreBadge(Number(quote.blendedRiskScore || 0))}
                      </TableCell>

                      {/* Status Badge */}
                      <TableCell>{getStatusBadge(quote.status)}</TableCell>

                      {/* Date (right-aligned) */}
                      <TableCell align="right" style={{ color: 'var(--text-secondary)', fontSize: '11.5px', fontVariantNumeric: 'tabular-nums' }}>
                        {new Date(quote.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </div>
      </RoleGuard>
    </InternalShell>
  )
}
