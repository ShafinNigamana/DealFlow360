'use client'

import React, { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { InternalShell } from '@/components/shell/InternalShell'
import { RoleGuard } from '@/components/auth/RoleGuard'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Stepper, StepItem } from '@/components/ui/Stepper'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from '@/components/ui/Table'
import { QuotationDTO } from '@/types/api-contracts'
import { CheckCircle, XCircle, RotateCcw, MessageSquare } from 'lucide-react'
import { formatDisplayId } from '@/lib/formatters'

export default function ApprovalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: quotationId } = use(params)
  const router = useRouter()

  const [quote, setQuote] = useState<QuotationDTO | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // Decision Modal State
  const [decisionModal, setDecisionModal] = useState<{
    isOpen: boolean
    action: 'APPROVE' | 'REJECT' | 'RETURN'
  }>({ isOpen: false, action: 'APPROVE' })
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchQuoteDetail = async () => {
    setIsLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/quotations/${quotationId}`)
      if (!res.ok) throw new Error('Quotation not found')
      const json = await res.json()
      setQuote(json)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch quotation')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchQuoteDetail()
  }, [quotationId])

  const handleDecision = async () => {
    const pendingApproval = quote?.approvals?.find((a) => a.status === 'PENDING')
    if (!pendingApproval) {
      alert('No pending approval step found for this quotation')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/approvals/${pendingApproval.id}/decide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: decisionModal.action,
          reason: reason || undefined,
        }),
      })

      if (!res.ok) {
        const errJson = await res.json()
        throw new Error(errJson.error || 'Failed to submit decision')
      }

      setDecisionModal({ ...decisionModal, isOpen: false })
      setReason('')
      fetchQuoteDetail()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const approvalSteps: StepItem[] = [
    { id: '1', label: 'Submitted', sublabel: 'Rep Creation' },
    { id: '2', label: 'Sales Manager', sublabel: 'Tier & Ceiling Check' },
    { id: '3', label: 'Finance Review', sublabel: 'Over 30% Risk' },
    { id: '4', label: 'Confirmed', sublabel: 'Ready for Customer' },
  ]

  const getCurrentStepIndex = () => {
    if (!quote) return 1
    if (quote.status === 'APPROVED' || quote.status === 'CONFIRMED' || quote.status === 'SENT') return 3
    if (quote.status === 'PENDING_APPROVAL') {
      const pendingApproval = quote.approvals?.find((a) => a.status === 'PENDING')
      if (pendingApproval?.level === 'MANAGER_THEN_FINANCE') return 2
      return 1
    }
    if (quote.status === 'REJECTED') return 1
    return 1
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
          gap: '6px',
          padding: '4px 10px',
          borderRadius: '3px',
          fontSize: '13px',
          fontWeight: 700,
          backgroundColor: bg,
          color: color,
          border: `1px solid ${border}`,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        <span>{scoreNum.toFixed(1)}%</span>
        <span style={{ fontSize: '9.5px', textTransform: 'uppercase', opacity: 0.85, fontWeight: 800 }}>
          {label} Risk
        </span>
      </span>
    )
  }

  return (
    <InternalShell title={`Approval Detail — #${formatDisplayId(quotationId)}`}>
      <RoleGuard allowedRoles={['MANAGER', 'FINANCE']}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Header Overview Card */}
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ink-900)' }}>
                    {quote?.customer?.name || 'Customer Name'}
                  </h2>
                  <Badge variant={quote?.status === 'APPROVED' ? 'success' : quote?.status === 'PENDING_APPROVAL' ? 'warning' : 'danger'}>
                    {quote?.status?.replace('_', ' ')}
                  </Badge>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Customer Tier: <strong style={{ color: 'var(--ink-900)' }}>{quote?.customer?.tier?.name || 'Standard'}</strong> • Sales Rep: {quote?.rep?.name}
                </p>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em', marginBottom: '3px' }}>
                  Blended Risk Score
                </div>
                <div>
                  {getRiskScoreBadge(Number(quote?.blendedRiskScore || 0))}
                </div>
              </div>
            </div>
          </Card>

          {/* Approval Stepper Component */}
          <Card>
            <CardHeader title="Approval Governance Progress" />
            <Stepper steps={approvalSteps} currentStepIndex={getCurrentStepIndex()} />
          </Card>

          {/* Why Flagged Breakdown Table */}
          <Card style={{ padding: 0 }}>
            <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-subtle)', fontWeight: 700, fontSize: '12.5px', color: 'var(--ink-900)' }}>
              Why This Quote Was Flagged (Discount Overages)
            </div>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Line Product</TableHeaderCell>
                  <TableHeaderCell>Category</TableHeaderCell>
                  <TableHeaderCell align="right">Discount Given</TableHeaderCell>
                  <TableHeaderCell align="right">Category Ceiling</TableHeaderCell>
                  <TableHeaderCell align="center">Status</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {quote?.lines?.map((line) => {
                  const disc = Number(line.unitDiscountPercent)
                  const isOver = disc > 15

                  return (
                    <TableRow key={line.id}>
                      <TableCell style={{ fontWeight: 600, color: 'var(--ink-900)' }}>{line.product?.name}</TableCell>
                      <TableCell style={{ color: 'var(--text-secondary)' }}>{line.product?.category?.name || 'Standard'}</TableCell>
                      <TableCell
                        align="right"
                        style={{
                          fontWeight: isOver ? 700 : 500,
                          color: isOver ? 'var(--status-rejected)' : 'var(--ink-900)',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {disc}%
                      </TableCell>
                      <TableCell align="right" style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--text-secondary)' }}>15.0%</TableCell>
                      <TableCell align="center">
                        {isOver ? <Badge variant="danger">Exceeds Limit</Badge> : <Badge variant="success">OK</Badge>}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </Card>

          {/* Approval History Audit Trail */}
          {quote?.approvals && quote.approvals.length > 0 && (
            <Card style={{ padding: 0 }}>
              <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-subtle)', fontWeight: 700, fontSize: '12.5px', color: 'var(--ink-900)' }}>
                Approval History & Audit Trail
              </div>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>Approver</TableHeaderCell>
                    <TableHeaderCell>Level</TableHeaderCell>
                    <TableHeaderCell>Action/Status</TableHeaderCell>
                    <TableHeaderCell>Reason / Note</TableHeaderCell>
                    <TableHeaderCell align="right">Date</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {quote.approvals.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell style={{ fontWeight: 600, color: 'var(--ink-900)' }}>{app.approver?.name || 'Assigned Approver'}</TableCell>
                      <TableCell style={{ color: 'var(--text-secondary)' }}>{app.level}</TableCell>
                      <TableCell>
                        <Badge variant={app.status === 'APPROVED' ? 'success' : app.status === 'PENDING' ? 'warning' : 'danger'}>
                          {app.status}
                        </Badge>
                      </TableCell>
                      <TableCell style={{ color: 'var(--ink-900)' }}>{app.reason || '—'}</TableCell>
                      <TableCell align="right" style={{ color: 'var(--text-secondary)', fontSize: '11.5px', fontVariantNumeric: 'tabular-nums' }}>
                        {new Date(app.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}

          {/* Customer Negotiation & Counter-Offer Dialogue Card */}
          <Card style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MessageSquare size={16} color="var(--copper-500)" />
                <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink-900)' }}>
                  Customer Counter-Offer & Negotiation Dialogue ({quote?.negotiationComments?.length || 0})
                </h3>
              </div>
              <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                Account: {quote?.customer?.name || 'Customer'}
              </span>
            </div>

            {/* Comments Feed */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {!quote?.negotiationComments || quote.negotiationComments.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '12px' }}>
                  No customer negotiation notes or counter-proposals on this deal.
                </div>
              ) : (
                quote.negotiationComments.map((comm) => {
                  const isCustomer = comm.authorType === 'CUSTOMER'
                  return (
                    <div
                      key={comm.id}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '4px',
                        border: isCustomer ? '1px solid var(--status-pending-border)' : '1px solid var(--border-subtle)',
                        backgroundColor: isCustomer ? 'var(--status-pending-subtle)' : '#FFFFFF',
                        alignSelf: isCustomer ? 'flex-start' : 'flex-end',
                        maxWidth: '90%',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '11.5px', fontWeight: 700, color: isCustomer ? 'var(--copper-700)' : 'var(--ink-900)' }}>
                          {isCustomer ? `${quote?.customer?.name || 'Customer'} (Client Request)` : comm.authorType === 'MANAGER' ? 'Sales Manager' : 'Sales Representative'}
                        </span>
                        <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
                          {new Date(comm.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p style={{ fontSize: '12.5px', color: 'var(--ink-900)', margin: 0, lineHeight: '1.4' }}>
                        {comm.comment}
                      </p>
                      {comm.counterDiscountPercent && (
                        <div style={{ marginTop: '6px' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '10.5px',
                              fontWeight: 700,
                              color: 'var(--status-rejected)',
                              backgroundColor: 'var(--status-rejected-subtle)',
                              border: '1px solid var(--status-rejected-border)',
                              padding: '2px 6px',
                              borderRadius: '3px',
                            }}
                          >
                            Requested Counter Discount: {Number(comm.counterDiscountPercent)}%
                          </span>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </Card>

          {/* Action Controls Footer */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '6px' }}>
            <Button variant="secondary" size="sm" onClick={() => router.push('/approvals')}>
              Back to Approvals
            </Button>

            {quote?.status === 'PENDING_APPROVAL' && (
              <>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setDecisionModal({ isOpen: true, action: 'REJECT' })}
                >
                  <XCircle size={13} /> Reject
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setDecisionModal({ isOpen: true, action: 'RETURN' })}
                >
                  <RotateCcw size={13} /> Return for Revision
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setDecisionModal({ isOpen: true, action: 'APPROVE' })}
                >
                  <CheckCircle size={13} /> Approve Quotation
                </Button>
              </>
            )}
          </div>

          {/* Decision Reason Modal */}
          <Modal
            isOpen={decisionModal.isOpen}
            onClose={() => setDecisionModal({ ...decisionModal, isOpen: false })}
            title={`Confirm ${decisionModal.action} Action`}
            footer={
              <>
                <Button variant="secondary" size="sm" onClick={() => setDecisionModal({ ...decisionModal, isOpen: false })}>
                  Cancel
                </Button>
                <Button
                  variant={decisionModal.action === 'REJECT' ? 'danger' : 'primary'}
                  size="sm"
                  onClick={handleDecision}
                  isLoading={isSubmitting}
                >
                  Submit Decision
                </Button>
              </>
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Input
                label="Reason / Audit Note (Optional)"
                placeholder="e.g. Approved per VP discount exception policy"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
              <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                Your decision will be recorded in the append-only audit trail and update the quotation status immediately.
              </p>
            </div>
          </Modal>
        </div>
      </RoleGuard>
    </InternalShell>
  )
}
