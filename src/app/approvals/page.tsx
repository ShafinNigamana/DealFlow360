'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { InternalShell } from '@/components/shell/InternalShell'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from '@/components/ui/Table'
import { QuotationDTO } from '@/types/api-contracts'
import { formatDisplayId } from '@/lib/formatters'

export default function ApprovalsListPage() {
  const router = useRouter()
  const [quotations, setQuotations] = useState<QuotationDTO[]>([])
  const [filter, setFilter] = useState<'PENDING' | 'ALL'>('PENDING')
  const [isLoading, setIsLoading] = useState(true)

  const fetchApprovals = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/quotations')
      if (res.ok) {
        const json = await res.json()
        setQuotations(json)
      }
    } catch (err: any) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchApprovals()
  }, [])

  const pendingCount = quotations.filter((q) => q.status === 'PENDING_APPROVAL').length
  const approvedCount = quotations.filter((q) => q.status === 'APPROVED').length
  const rejectedCount = quotations.filter((q) => q.status === 'REJECTED').length

  const filteredQuotes = filter === 'PENDING'
    ? quotations.filter((q) => q.status === 'PENDING_APPROVAL')
    : quotations.filter((q) => ['PENDING_APPROVAL', 'APPROVED', 'REJECTED'].includes(q.status))

  return (
    <InternalShell title="Approvals Governance">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Status Count Summary Header */}
        <div style={{ display: 'flex', gap: '16px' }}>
          <Card style={{ flex: 1, padding: '12px 16px' }}>
            <span style={{ fontSize: '11px', color: '#71717A', textTransform: 'uppercase' }}>Pending Approvals</span>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#B45309', marginTop: '2px' }}>{pendingCount}</div>
          </Card>
          <Card style={{ flex: 1, padding: '12px 16px' }}>
            <span style={{ fontSize: '11px', color: '#71717A', textTransform: 'uppercase' }}>Approved</span>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#15803D', marginTop: '2px' }}>{approvedCount}</div>
          </Card>
          <Card style={{ flex: 1, padding: '12px 16px' }}>
            <span style={{ fontSize: '11px', color: '#71717A', textTransform: 'uppercase' }}>Rejected</span>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#B91C1C', marginTop: '2px' }}>{rejectedCount}</div>
          </Card>
        </div>

        {/* Filter Toggle */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setFilter('PENDING')}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 500,
              border: '1px solid #E4E4E7',
              backgroundColor: filter === 'PENDING' ? '#4F46E5' : '#FFFFFF',
              color: filter === 'PENDING' ? '#FFFFFF' : '#18181B',
              cursor: 'pointer',
            }}
          >
            Pending Only ({pendingCount})
          </button>
          <button
            onClick={() => setFilter('ALL')}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 500,
              border: '1px solid #E4E4E7',
              backgroundColor: filter === 'ALL' ? '#4F46E5' : '#FFFFFF',
              color: filter === 'ALL' ? '#FFFFFF' : '#18181B',
              cursor: 'pointer',
            }}
          >
            All Decisions
          </button>
        </div>

        {/* Approvals Table */}
        <Card style={{ padding: 0 }}>
          {isLoading ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#71717A', fontSize: '13px' }}>
              Loading approval requests...
            </div>
          ) : filteredQuotes.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#71717A', fontSize: '13px' }}>
              No approvals found matching filter.
            </div>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Quote ID</TableHeaderCell>
                  <TableHeaderCell>Customer</TableHeaderCell>
                  <TableHeaderCell>Sales Rep</TableHeaderCell>
                  <TableHeaderCell>Blended Risk</TableHeaderCell>
                  <TableHeaderCell>Required Approver</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell>Submitted Date</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredQuotes.map((quote) => {
                  const riskScore = Number(quote.blendedRiskScore || 0)
                  const riskBadge =
                    riskScore > 25 ? (
                      <Badge variant="danger">High ({riskScore.toFixed(1)}%)</Badge>
                    ) : riskScore > 10 ? (
                      <Badge variant="warning">Medium ({riskScore.toFixed(1)}%)</Badge>
                    ) : (
                      <Badge variant="success">Low ({riskScore.toFixed(1)}%)</Badge>
                    )

                  return (
                    <TableRow key={quote.id} onClick={() => router.push(`/approvals/${quote.id}`)}>
                      <TableCell style={{ fontWeight: 600, color: '#4F46E5' }}>#{formatDisplayId(quote.id)}</TableCell>
                      <TableCell style={{ fontWeight: 500 }}>{quote.customer?.name}</TableCell>
                      <TableCell>{quote.rep?.name}</TableCell>
                      <TableCell>{riskBadge}</TableCell>
                      <TableCell>{riskScore > 30 ? 'Manager → Finance' : 'Sales Manager'}</TableCell>
                      <TableCell>
                        <Badge variant={quote.status === 'APPROVED' ? 'success' : quote.status === 'PENDING_APPROVAL' ? 'warning' : 'danger'}>
                          {quote.status}
                        </Badge>
                      </TableCell>
                      <TableCell style={{ color: '#71717A', fontSize: '12px' }}>
                        {new Date(quote.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </InternalShell>
  )
}
