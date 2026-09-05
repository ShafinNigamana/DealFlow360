'use client'

import React, { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { InternalShell } from '@/components/shell/InternalShell'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Stepper, StepItem } from '@/components/ui/Stepper'
import { Modal } from '@/components/ui/Modal'
import { Input, Select } from '@/components/ui/Input'
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from '@/components/ui/Table'
import { InvoiceDTO } from '@/types/api-contracts'
import { CreditCard, CheckCircle } from 'lucide-react'
import { formatDisplayId } from '@/lib/formatters'

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: invoiceId } = use(params)
  const router = useRouter()

  const [invoice, setInvoice] = useState<InvoiceDTO | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Payment Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [method, setMethod] = useState('Credit Card')
  const [amount, setAmount] = useState<number>(0)
  const [isRecording, setIsRecording] = useState(false)

  const fetchInvoiceDetail = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`)
      if (res.ok) {
        const json = await res.json()
        setInvoice(json)
        setAmount(Number(json.amount || 0))
      }
    } catch (err: any) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchInvoiceDetail()
  }, [invoiceId])

  const handleRecordPayment = async () => {
    setIsRecording(true)
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId,
          amount: Number(amount),
          method,
        }),
      })

      if (!res.ok) throw new Error('Failed to record payment')

      setIsPaymentModalOpen(false)
      fetchInvoiceDetail()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setIsRecording(false)
    }
  }

  // Invoice progress stepper (Order Confirmed -> Shipped -> Invoiced -> Paid)
  const invoiceSteps: StepItem[] = [
    { id: '1', label: 'Order Confirmed' },
    { id: '2', label: 'Shipped' },
    { id: '3', label: 'Invoiced' },
    { id: '4', label: 'Paid' },
  ]

  const getStepIndex = () => {
    if (invoice?.status === 'PAID') return 3
    if (invoice?.status === 'SENT' || invoice?.status === 'DRAFT') return 2
    return 1
  }

  return (
    <InternalShell title={`Invoice Detail — #${formatDisplayId(invoiceId)}`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Invoice Summary Header */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#18181B' }}>
                  Invoice #{formatDisplayId(invoiceId)}
                </h2>
                <Badge variant={invoice?.status === 'PAID' ? 'success' : 'warning'}>
                  {invoice?.status}
                </Badge>
              </div>
              <p style={{ fontSize: '12px', color: '#71717A', marginTop: '4px' }}>
                Associated Quotation: #{formatDisplayId(invoice?.quotationId)}
              </p>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '11px', color: '#71717A', textTransform: 'uppercase' }}>Total Amount</span>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#18181B' }}>
                ${Number(invoice?.amount || 0).toFixed(2)}
              </div>
            </div>
          </div>
        </Card>

        {/* Invoice Progress Stepper */}
        <Card>
          <CardHeader title="Order & Invoicing Progress" />
          <Stepper steps={invoiceSteps} currentStepIndex={getStepIndex()} />
        </Card>

        {/* Recorded Payments History */}
        <Card style={{ padding: 0 }}>
          <CardHeader title="Recorded Payments & Reconciliation" />

          {!invoice?.payments || invoice.payments.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#71717A', fontSize: '13px' }}>
              No payments recorded yet for this invoice.
            </div>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Payment ID</TableHeaderCell>
                  <TableHeaderCell>Payment Method</TableHeaderCell>
                  <TableHeaderCell>Paid Amount</TableHeaderCell>
                  <TableHeaderCell>Paid Date</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoice.payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell style={{ fontWeight: 600, color: '#4F46E5' }}>#{formatDisplayId(p.id)}</TableCell>
                    <TableCell>{p.method}</TableCell>
                    <TableCell style={{ color: '#15803D', fontWeight: 600 }}>${Number(p.amount).toFixed(2)}</TableCell>
                    <TableCell style={{ color: '#71717A', fontSize: '12px' }}>
                      {new Date(p.paidAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>

        {/* Action Controls */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '10px' }}>
          <Button variant="secondary" onClick={() => router.push('/invoices')}>
            Back to Invoices
          </Button>

          {invoice?.status !== 'PAID' && (
            <Button variant="primary" onClick={() => setIsPaymentModalOpen(true)}>
              <CreditCard size={14} /> Record Payment
            </Button>
          )}
        </div>

        {/* Record Payment Modal */}
        <Modal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          title="Record Payment"
          footer={
            <>
              <Button variant="secondary" onClick={() => setIsPaymentModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleRecordPayment} isLoading={isRecording}>
                Confirm Payment
              </Button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Input
              label="Payment Amount ($)"
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              required
            />
            <Select
              label="Payment Method"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              options={[
                { label: 'Credit Card', value: 'Credit Card' },
                { label: 'Wire Transfer / ACH', value: 'ACH' },
                { label: 'Check', value: 'Check' },
              ]}
            />
          </div>
        </Modal>
      </div>
    </InternalShell>
  )
}
