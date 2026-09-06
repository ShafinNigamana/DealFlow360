'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { InternalShell } from '@/components/shell/InternalShell'
import { RoleGuard } from '@/components/auth/RoleGuard'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from '@/components/ui/Table'
import { QuotationDTO } from '@/types/api-contracts'
import { formatDisplayId } from '@/lib/formatters'

export default function ApprovalsPage() {
  const router = useRouter()
  const [quotations, setQuotations] = useState<QuotationDTO[]>([])
  const [filter, setFilter] = useState<'PENDING' | 'ALL'>('PENDING')
  const [isLoading, setIsLoading] = useState(true)

  const fetchApprovals = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/quotations')
      if (res.ok) {
        const list: QuotationDTO[] = await res.json()
        setQuotations(list)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchApprovals()
  }, [])

  const pendingCount = quotations.filter((q) => q.status === 'PENDING_APPROVAL').length

  const filteredQuotes = quotations.filter((q) => {
    if (filter === 'PENDING') return q.status === 'PENDING_APPROVAL'
    return true
  })

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
    <InternalShell title="Discount Approval Queue">
      <RoleGuard allowedRoles={['MANAGER', 'FINANCE']}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Header & Filter Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ink-900)' }}>
                Pending Governance Clearance
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '1px' }}>
                Quotes requiring Sales Manager or Finance sign-off before customer dispatch
              </p>
            </div>

            {/* Filter Toggle Buttons */}
            <div style={{ display: 'flex', gap: '4px', backgroundColor: 'var(--neutral-100)', padding: '2px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
              <button
                onClick={() => setFilter('PENDING')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '3px',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  border: 'none',
                  backgroundColor: filter === 'PENDING' ? 'var(--copper-500)' : 'transparent',
                  color: filter === 'PENDING' ? '#FFFFFF' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 180ms ease',
                }}
              >
                Pending Only ({pendingCount})
              </button>
              <button
                onClick={() => setFilter('ALL')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '3px',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  border: 'none',
                  backgroundColor: filter === 'ALL' ? 'var(--copper-500)' : 'transparent',
                  color: filter === 'ALL' ? '#FFFFFF' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 180ms ease',
                }}
              >
                All Decisions
              </button>
            </div>
          </div>

          {/* Approvals Table (Dense Console View) */}
          <Card style={{ padding: 0 }}>
            {isLoading ? (
              <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '12.5px' }}>
                Loading approval requests...
              </div>
            ) : filteredQuotes.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '12.5px' }}>
                No approvals found matching filter.
              </div>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell style={{ width: '130px' }}>Quote Ref</TableHeaderCell>
                    <TableHeaderCell>Account / Customer</TableHeaderCell>
                    <TableHeaderCell>Owner (Rep)</TableHeaderCell>
                    <TableHeaderCell align="right" style={{ width: '120px' }}>Risk Assessment</TableHeaderCell>
                    <TableHeaderCell style={{ width: '150px' }}>Approval Chain</TableHeaderCell>
                    <TableHeaderCell style={{ width: '140px' }}>Status</TableHeaderCell>
                    <TableHeaderCell align="right" style={{ width: '100px' }}>Submitted</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredQuotes.map((quote) => {
                    const riskScore = Number(quote.blendedRiskScore || 0)

                    return (
                      <TableRow key={quote.id} onClick={() => router.push(`/approvals/${quote.id}`)}>
                        <TableCell style={{ fontWeight: 700, color: 'var(--ink-900)', fontFamily: 'ui-monospace, monospace', fontSize: '12px' }}>
                          #{formatDisplayId(quote.id)}
                        </TableCell>
                        <TableCell style={{ fontWeight: 600, color: 'var(--ink-900)' }}>
                          {quote.customer?.name}
                        </TableCell>
                        <TableCell style={{ color: 'var(--text-secondary)' }}>
                          {quote.rep?.name}
                        </TableCell>
                        <TableCell align="right">
                          {getRiskScoreBadge(riskScore)}
                        </TableCell>
                        <TableCell style={{ fontSize: '12px', color: 'var(--ink-900)', fontWeight: 500 }}>
                          {riskScore > 30 ? 'Manager → Finance' : 'Sales Manager'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={quote.status === 'APPROVED' ? 'success' : quote.status === 'PENDING_APPROVAL' ? 'warning' : 'danger'}>
                            {quote.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell align="right" style={{ color: 'var(--text-secondary)', fontSize: '11.5px', fontVariantNumeric: 'tabular-nums' }}>
                          {new Date(quote.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </Card>
        </div>
      </RoleGuard>
    </InternalShell>
  )
}
