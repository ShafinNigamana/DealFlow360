'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { PortalShell } from '@/components/shell/PortalShell'
import { Card, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from '@/components/ui/Table'
import { QuotationDTO } from '@/types/api-contracts'
import { formatDisplayId } from '@/lib/formatters'
import { FileText, ArrowRight, Clock, CheckCircle2, AlertCircle } from 'lucide-react'

export default function CustomerPortalPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [quotations, setQuotations] = useState<QuotationDTO[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login')
      return
    }

    if (status === 'authenticated') {
      fetchCustomerQuotations()
    }
  }, [status, router])

  const fetchCustomerQuotations = async () => {
    setIsLoading(true)
    setError('')
    try {
      const res = await fetch('/api/quotations')
      if (!res.ok) throw new Error('Failed to load your quotations')
      const data: QuotationDTO[] = await res.json()
      setQuotations(data)
    } catch (err: any) {
      setError(err.message || 'Unable to load quotations')
    } finally {
      setIsLoading(false)
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <PortalShell customerName={session?.user?.name || 'Customer'}>
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)', fontSize: '13px' }}>
          Loading your customer account portal...
        </div>
      </PortalShell>
    )
  }

  const customerName = session?.user?.name || 'Customer Account'

  const getStatusBadge = (qStatus: string) => {
    switch (qStatus) {
      case 'CONFIRMED':
      case 'APPROVED':
        return <Badge variant="success">{qStatus}</Badge>
      case 'SENT':
      case 'PENDING_APPROVAL':
        return <Badge variant="warning">{qStatus.replace('_', ' ')}</Badge>
      default:
        return <Badge variant="neutral">{qStatus}</Badge>
    }
  }

  return (
    <PortalShell customerName={customerName}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Welcome Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--ink-900)', letterSpacing: '-0.02em' }}>
              Welcome back, {customerName}
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Review active proposals, inspect pricing breakdowns, and confirm quotations directly with your dedicated sales team.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--copper-700)',
                backgroundColor: 'var(--status-pending-subtle)',
                border: '1px solid var(--status-pending-border)',
                padding: '3px 9px',
                borderRadius: '4px',
              }}
            >
              Account Active
            </span>
          </div>
        </div>

        {/* Proposals List Card */}
        <Card style={{ padding: 0 }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={16} color="var(--copper-500)" />
              <h3 style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--ink-900)' }}>
                Your Quotations & Proposals ({quotations.length})
              </h3>
            </div>
            <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
              Click any proposal to review line items or chat with your rep
            </span>
          </div>

          {error ? (
            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--status-rejected)', fontSize: '12.5px' }}>
              <AlertCircle size={20} style={{ margin: '0 auto 8px' }} />
              {error}
            </div>
          ) : quotations.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
              <Clock size={24} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
              <p style={{ fontWeight: 600, color: 'var(--ink-900)', marginBottom: '4px' }}>No active proposals found</p>
              <p style={{ fontSize: '12px' }}>Your sales representative has not issued any quotations yet. Check back soon.</p>
            </div>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell style={{ width: '140px' }}>Quotation Ref</TableHeaderCell>
                  <TableHeaderCell>Account</TableHeaderCell>
                  <TableHeaderCell>Assigned Sales Rep</TableHeaderCell>
                  <TableHeaderCell align="right" style={{ width: '130px' }}>Estimated Total</TableHeaderCell>
                  <TableHeaderCell style={{ width: '140px' }}>Status</TableHeaderCell>
                  <TableHeaderCell align="right" style={{ width: '110px' }}>Issued</TableHeaderCell>
                  <TableHeaderCell align="center" style={{ width: '100px' }}>Action</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {quotations.map((quote) => {
                  const total = quote.lines?.reduce((sum, l) => sum + Number(l.lineTotal || 0), 0) || 0

                  return (
                    <TableRow
                      key={quote.id}
                      onClick={() => router.push(`/portal/quotation/${quote.id}`)}
                    >
                      <TableCell style={{ fontWeight: 700, color: 'var(--ink-900)', fontFamily: 'ui-monospace, monospace', fontSize: '12px' }}>
                        #{formatDisplayId(quote.id)}
                      </TableCell>
                      <TableCell style={{ fontWeight: 600, color: 'var(--ink-900)' }}>
                        {quote.customer?.name}
                      </TableCell>
                      <TableCell style={{ color: 'var(--text-secondary)' }}>
                        {quote.rep?.name || 'Sales Desk'}
                      </TableCell>
                      <TableCell align="right" style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: 'var(--ink-900)' }}>
                        ${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(quote.status)}
                      </TableCell>
                      <TableCell align="right" style={{ color: 'var(--text-secondary)', fontSize: '11.5px', fontVariantNumeric: 'tabular-nums' }}>
                        {new Date(quote.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/portal/quotation/${quote.id}`)
                          }}
                        >
                          <span>Review</span>
                          <ArrowRight size={11} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </PortalShell>
  )
}
