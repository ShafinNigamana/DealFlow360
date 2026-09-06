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
import { CheckCircle, XCircle, RotateCcw } from 'lucide-react'
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
    // Find pending approval entry
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
        throw new Error(errJson.error || 'Failed to submit approval decision')
      }

      setDecisionModal({ isOpen: false, action: 'APPROVE' })
      setReason('')
      fetchQuoteDetail()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Stepper Calculation
  const approvalSteps: StepItem[] = [
    { id: '1', label: 'Submitted', sublabel: 'Rep Creation' },
    { id: '2', label: 'Sales Manager', sublabel: 'Tier & Ceiling Check' },
    { id: '3', label: 'Finance Review', sublabel: 'Over 30% Risk' },
    { id: '4', label: 'Confirmed', sublabel: 'Ready for Customer' },
  ]

  const getCurrentStepIndex = () => {
    if (!quote) return 0
    if (quote.status === 'DRAFT') return 0
    if (quote.status === 'PENDING_APPROVAL') return 1
    if (quote.status === 'APPROVED' || quote.status === 'CONFIRMED') return 3
    if (quote.status === 'REJECTED') return 1
    return 1
  }

  return (
    <InternalShell title={`Approval Detail — #${formatDisplayId(quotationId)}`}>
      <RoleGuard allowedRoles={['MANAGER', 'FINANCE']}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Header Overview Card */}
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#18181B' }}>
                    {quote?.customer?.name || 'Customer Name'}
                  </h2>
                  <Badge variant={quote?.status === 'APPROVED' ? 'success' : quote?.status === 'PENDING_APPROVAL' ? 'warning' : 'danger'}>
                  {quote?.status}
                </Badge>
              </div>
              <p style={{ fontSize: '12px', color: '#71717A', marginTop: '4px' }}>
                Customer Tier: <strong style={{ color: '#18181B' }}>{quote?.customer?.tier?.name || 'Standard'}</strong> • Sales Rep: {quote?.rep?.name}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', color: '#71717A', textTransform: 'uppercase' }}>Blended Risk Score</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: Number(quote?.blendedRiskScore) > 20 ? '#B91C1C' : '#15803D' }}>
                  {Number(quote?.blendedRiskScore || 0).toFixed(1)}%
                </div>
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
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #E4E4E7', fontWeight: 600, fontSize: '14px' }}>
            Why This Quote Was Flagged (Discount Overages)
          </div>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Line Product</TableHeaderCell>
                <TableHeaderCell>Category</TableHeaderCell>
                <TableHeaderCell>Discount Given</TableHeaderCell>
                <TableHeaderCell>Category Ceiling</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {quote?.lines?.map((line) => {
                const disc = Number(line.unitDiscountPercent)
                const isOver = disc > 15

                return (
                  <TableRow key={line.id}>
                    <TableCell style={{ fontWeight: 500 }}>{line.product?.name}</TableCell>
                    <TableCell>{line.product?.category?.name || 'Standard'}</TableCell>
                    <TableCell style={{ fontWeight: isOver ? 600 : 400, color: isOver ? '#B91C1C' : '#18181B' }}>
                      {disc}%
                    </TableCell>
                    <TableCell>15.0%</TableCell>
                    <TableCell>
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
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #E4E4E7', fontWeight: 600, fontSize: '14px' }}>
              Approval History & Audit Trail
            </div>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Approver</TableHeaderCell>
                  <TableHeaderCell>Level</TableHeaderCell>
                  <TableHeaderCell>Action/Status</TableHeaderCell>
                  <TableHeaderCell>Reason / Note</TableHeaderCell>
                  <TableHeaderCell>Date</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {quote.approvals.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell style={{ fontWeight: 500 }}>{app.approver?.name || 'Assigned Approver'}</TableCell>
                    <TableCell>{app.level}</TableCell>
                    <TableCell>
                      <Badge variant={app.status === 'APPROVED' ? 'success' : app.status === 'PENDING' ? 'warning' : 'danger'}>
                        {app.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{app.reason || '—'}</TableCell>
                    <TableCell style={{ color: '#71717A', fontSize: '12px' }}>
                      {new Date(app.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}

        {/* Action Controls Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '10px' }}>
          <Button variant="secondary" onClick={() => router.push('/approvals')}>
            Back to Approvals
          </Button>

          {quote?.status === 'PENDING_APPROVAL' && (
            <>
              <Button
                variant="danger"
                onClick={() => setDecisionModal({ isOpen: true, action: 'REJECT' })}
              >
                <XCircle size={14} /> Reject
              </Button>

              <Button
                variant="secondary"
                onClick={() => setDecisionModal({ isOpen: true, action: 'RETURN' })}
              >
                <RotateCcw size={14} /> Return for Revision
              </Button>

              <Button
                variant="primary"
                onClick={() => setDecisionModal({ isOpen: true, action: 'APPROVE' })}
              >
                <CheckCircle size={14} /> Approve Quotation
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
              <Button variant="secondary" onClick={() => setDecisionModal({ ...decisionModal, isOpen: false })}>
                Cancel
              </Button>
              <Button
                variant={decisionModal.action === 'REJECT' ? 'danger' : 'primary'}
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
            <p style={{ fontSize: '12px', color: '#71717A' }}>
              Your decision will be recorded in the append-only audit trail and update the quotation status immediately.
            </p>
          </div>
        </Modal>
      </div>
      </RoleGuard>
    </InternalShell>
  )
}
