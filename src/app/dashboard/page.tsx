'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { InternalShell } from '@/components/shell/InternalShell'
import { RoleGuard } from '@/components/auth/RoleGuard'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from '@/components/ui/Table'
import { DashboardMetricsResponse, QuotationDTO } from '@/types/api-contracts'
import { Plus, CheckCircle, FileText, Activity } from 'lucide-react'
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
      case 'CONFIRMED':
      case 'FULFILLED':
        return <Badge variant="success">{status}</Badge>
      case 'PENDING_APPROVAL':
        return <Badge variant="warning">PENDING APPROVAL</Badge>
      case 'REJECTED':
      case 'CANCELLED':
        return <Badge variant="danger">{status}</Badge>
      default:
        return <Badge variant="neutral">{status}</Badge>
    }
  }

  return (
    <InternalShell title="Sales Dashboard">
      <RoleGuard allowedRoles={['REP', 'MANAGER', 'FINANCE', 'ADMIN']}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Metric Cards Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontSize: '12px', color: '#71717A', fontWeight: 500 }}>Pending Approvals</span>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: '#18181B', marginTop: '4px' }}>
                    {isLoading ? '...' : data?.summary.pendingApprovalCount ?? 0}
                  </div>
                </div>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '6px',
                    backgroundColor: '#FFFBEB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CheckCircle size={18} color="#B45309" />
                </div>
              </div>
            </Card>

            <Card>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontSize: '12px', color: '#71717A', fontWeight: 500 }}>Open Quotations</span>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: '#18181B', marginTop: '4px' }}>
                    {isLoading ? '...' : (data?.summary.draftCount ?? 0) + (data?.summary.pendingApprovalCount ?? 0)}
                  </div>
                </div>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '6px',
                    backgroundColor: '#EEF2FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <FileText size={18} color="#4F46E5" />
                </div>
              </div>
            </Card>

            <Card>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontSize: '12px', color: '#71717A', fontWeight: 500 }}>At-Risk Deals</span>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: '#18181B', marginTop: '4px' }}>
                    {isLoading ? '...' : data?.summary.openAlertsCount ?? 0}
                  </div>
                </div>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '6px',
                    backgroundColor: '#FEF2F2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Activity size={18} color="#B91C1C" />
                </div>
              </div>
            </Card>
          </div>

          {/* Action Toolbar */}
          <div style={{ display: 'flex', gap: '10px' }}>
            {(userRole === 'REP' || userRole === 'MANAGER') && (
              <Link href="/quotations">
                <Button variant="primary">
                  <Plus size={14} />
                  New Quotation
                </Button>
              </Link>
            )}
            {(userRole === 'MANAGER' || userRole === 'FINANCE') && (
              <Link href="/approvals">
                <Button variant="secondary">
                  View Approvals
                </Button>
              </Link>
            )}
          </div>

        {/* Error Notice */}
        {error && (
          <div style={{ padding: '12px', borderRadius: '6px', backgroundColor: '#FEF2F2', color: '#B91C1C', fontSize: '13px' }}>
            {error}
          </div>
        )}

        {/* Recent Activity Table */}
        <Card>
          <CardHeader
            title="Recent Quotations & Activity"
            subtitle="Latest created quotations across sales pipeline"
          />

          {isLoading ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#71717A', fontSize: '13px' }}>
              Loading recent activity...
            </div>
          ) : !data?.recentQuotations || data.recentQuotations.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#71717A', fontSize: '13px' }}>
              No recent quotations found.
            </div>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Quote ID</TableHeaderCell>
                  <TableHeaderCell>Customer</TableHeaderCell>
                  <TableHeaderCell>Sales Rep</TableHeaderCell>
                  <TableHeaderCell>Risk Score</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell>Date</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.recentQuotations.map((quote: QuotationDTO) => (
                  <TableRow
                    key={quote.id}
                    onClick={() => router.push(`/quotations/${quote.id}`)}
                  >
                    <TableCell style={{ fontWeight: 600, color: '#4F46E5' }}>
                      #{formatDisplayId(quote.id)}
                    </TableCell>
                    <TableCell style={{ fontWeight: 500 }}>
                      {quote.customer?.name || 'Unknown'}
                    </TableCell>
                    <TableCell>{quote.rep?.name || 'Unassigned'}</TableCell>
                    <TableCell>
                      <span
                        style={{
                          color: Number(quote.blendedRiskScore) > 20 ? '#B91C1C' : '#18181B',
                          fontWeight: Number(quote.blendedRiskScore) > 20 ? 600 : 400,
                        }}
                      >
                        {Number(quote.blendedRiskScore).toFixed(1)}%
                      </span>
                    </TableCell>
                    <TableCell>{getStatusBadge(quote.status)}</TableCell>
                    <TableCell style={{ color: '#71717A', fontSize: '12px' }}>
                      {new Date(quote.createdAt).toLocaleDateString()}
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
