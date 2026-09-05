'use client'

import React, { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { InternalShell } from '@/components/shell/InternalShell'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from '@/components/ui/Table'
import { SubscriptionDTO } from '@/types/api-contracts'
import { Calendar, CreditCard, AlertTriangle } from 'lucide-react'
import { formatDisplayId } from '@/lib/formatters'

export default function BillingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: subscriptionId } = use(params)
  const router = useRouter()

  const [sub, setSub] = useState<SubscriptionDTO | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Proration / Cancel Modal
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const fetchDetail = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/subscriptions/${subscriptionId}`)
      if (res.ok) setSub(await res.json())
    } catch (err: any) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDetail()
  }, [subscriptionId])

  const handleCancelSubscription = async () => {
    setIsProcessing(true)
    try {
      const res = await fetch(`/api/subscriptions/${subscriptionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED', reason: cancelReason }),
      })

      if (!res.ok) throw new Error('Failed to cancel subscription')
      setIsCancelModalOpen(false)
      fetchDetail()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <InternalShell title={`Billing Detail — Subscription #${formatDisplayId(subscriptionId)}`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Header Summary */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#18181B' }}>
                  {sub?.plan?.name || 'Subscription Plan'}
                </h2>
                <Badge variant={sub?.status === 'ACTIVE' ? 'success' : 'danger'}>
                  {sub?.status}
                </Badge>
              </div>
              <p style={{ fontSize: '12px', color: '#71717A', marginTop: '4px' }}>
                Cadence: <strong style={{ color: '#18181B' }}>{sub?.plan?.cadence}</strong> • Proration Rule: {sub?.plan?.prorationRule}
              </p>
            </div>

            {sub?.status === 'ACTIVE' && (
              <Button variant="danger" onClick={() => setIsCancelModalOpen(true)}>
                <AlertTriangle size={14} /> Cancel Subscription
              </Button>
            )}
          </div>
        </Card>

        {/* Stacked Tables: One-Time vs Recurring Line Items */}
        <Card style={{ padding: 0 }}>
          <CardHeader title="Recurring Line Item & Subscription Plan" />
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Product / Service</TableHeaderCell>
                <TableHeaderCell>Quantity</TableHeaderCell>
                <TableHeaderCell>Billing Cadence</TableHeaderCell>
                <TableHeaderCell>Line Total</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell style={{ fontWeight: 600 }}>{sub?.quotationLine?.product?.name || 'SaaS Recurring License'}</TableCell>
                <TableCell>{sub?.quotationLine?.quantity || 1}</TableCell>
                <TableCell>{sub?.plan?.cadence || 'MONTHLY'}</TableCell>
                <TableCell style={{ fontWeight: 600 }}>${Number(sub?.quotationLine?.lineTotal || 0).toFixed(2)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Card>

        {/* Generated Billing Schedule Entries */}
        <Card style={{ padding: 0 }}>
          <CardHeader
            title="Generated Billing Schedule Entries"
            subtitle="Automated payment due dates & amount breakdown"
          />

          {!sub?.billingEntries || sub.billingEntries.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#71717A', fontSize: '13px' }}>
              No billing entries generated.
            </div>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Entry ID</TableHeaderCell>
                  <TableHeaderCell>Due Date</TableHeaderCell>
                  <TableHeaderCell>Amount</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sub.billingEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell style={{ fontWeight: 600 }}>#{formatDisplayId(entry.id)}</TableCell>
                    <TableCell style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={14} color="#71717A" />
                      {new Date(entry.dueDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell style={{ fontWeight: 600 }}>${Number(entry.amount).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={entry.status === 'PAID' ? 'success' : entry.status === 'PENDING' ? 'warning' : 'danger'}>
                        {entry.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>

        {/* Issued Credit Notes */}
        {sub?.creditNotes && sub.creditNotes.length > 0 && (
          <Card style={{ padding: 0 }}>
            <CardHeader title="Proration Credit Notes Issued" />
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Credit Note ID</TableHeaderCell>
                  <TableHeaderCell>Amount</TableHeaderCell>
                  <TableHeaderCell>Reason</TableHeaderCell>
                  <TableHeaderCell>Date</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sub.creditNotes.map((cn) => (
                  <TableRow key={cn.id}>
                    <TableCell style={{ fontWeight: 600, color: '#4F46E5' }}>#{formatDisplayId(cn.id)}</TableCell>
                    <TableCell style={{ color: '#15803D', fontWeight: 600 }}>${Number(cn.amount).toFixed(2)}</TableCell>
                    <TableCell>{cn.reason}</TableCell>
                    <TableCell style={{ color: '#71717A', fontSize: '12px' }}>
                      {new Date(cn.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}

        {/* Cancel Subscription Modal */}
        <Modal
          isOpen={isCancelModalOpen}
          onClose={() => setIsCancelModalOpen(false)}
          title="Cancel Subscription"
          footer={
            <>
              <Button variant="secondary" onClick={() => setIsCancelModalOpen(false)}>
                Keep Subscription
              </Button>
              <Button variant="danger" onClick={handleCancelSubscription} isLoading={isProcessing}>
                Confirm Cancellation
              </Button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Input
              label="Cancellation Reason"
              placeholder="e.g. Customer requested early termination"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
            <p style={{ fontSize: '12px', color: '#71717A' }}>
              Cancelling will trigger proration credit note calculations per plan rule ({sub?.plan?.cancellationRule}).
            </p>
          </div>
        </Modal>
      </div>
    </InternalShell>
  )
}
