'use client'

import React, { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { PortalShell } from '@/components/shell/PortalShell'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from '@/components/ui/Table'
import { Modal } from '@/components/ui/Modal'
import { QuotationDTO } from '@/types/api-contracts'
import { MessageSquare, Send, ShieldAlert, CheckCircle2, AlertOctagon, Printer, ArrowLeft, Receipt, Check, FileText } from 'lucide-react'
import { formatDisplayId } from '@/lib/formatters'

export default function CustomerPortalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: quotationId } = use(params)
  const router = useRouter()
  const { data: session, status } = useSession()
  const userRole = session?.user?.role || ''

  const [quote, setQuote] = useState<QuotationDTO | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [accessDenied, setAccessDenied] = useState(false)
  const [counterDiscount, setCounterDiscount] = useState<number | ''>('')
  const [commentText, setCommentText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const [showReceiptModal, setShowReceiptModal] = useState(false)

  const fetchQuote = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/quotations/${quotationId}`)
      if (res.status === 403) {
        setAccessDenied(true)
        return
      }
      if (res.ok) setQuote(await res.json())
    } catch (err: any) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login')
    } else if (status === 'authenticated') {
      fetchQuote()
    }
  }, [status, quotationId])

  const handleSendNegotiation = async () => {
    if (!commentText) return
    setIsSubmitting(true)
    try {
      const authorType = userRole === 'CUSTOMER' ? 'CUSTOMER' : userRole === 'MANAGER' ? 'MANAGER' : 'REP'
      const res = await fetch(`/api/quotations/${quotationId}/negotiations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorType,
          comment: commentText,
          counterDiscountPercent: counterDiscount !== '' ? Number(counterDiscount) : undefined,
        }),
      })

      if (!res.ok) throw new Error('Failed to submit counter-proposal')

      const json = await res.json()
      if (json.reRoutedForApproval) {
        alert('Counter-proposal submitted! As the discount exceeded ceiling limits, your quote has re-entered internal approval.')
      } else {
        alert('Counter-proposal submitted successfully!')
      }

      setCommentText('')
      setCounterDiscount('')
      fetchQuote()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConfirmQuote = async () => {
    if (!confirm('Are you sure you want to confirm and accept this quotation? This will move it to order fulfillment.')) return
    setIsConfirming(true)
    try {
      const res = await fetch(`/api/quotations/${quotationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CONFIRMED' }),
      })
      if (!res.ok) {
        const errJson = await res.json()
        throw new Error(errJson.error || 'Failed to confirm quotation')
      }
      alert('Quotation confirmed! Your order is now moving to fulfillment.')
      fetchQuote()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setIsConfirming(false)
    }
  }

  const subtotal = quote?.lines?.reduce((s, l) => s + Number(l.lineTotal), 0) || 0

  if (accessDenied) {
    return (
      <PortalShell customerName="Unauthorized">
        <div style={{ padding: '60px 24px', textAlign: 'center', maxWidth: '480px', margin: '0 auto' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DC2626', margin: '0 auto 16px' }}>
            <AlertOctagon size={24} />
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0F172A', marginBottom: '8px' }}>Quotation Access Restricted</h2>
          <p style={{ fontSize: '14px', color: '#64748B', lineHeight: '1.5', marginBottom: '20px' }}>
            You do not have permission to view or negotiate this quotation. Customer portal users can only access quotations issued to their specific account.
          </p>
          <button
            onClick={() => router.push('/login')}
            style={{ padding: '7px 16px', backgroundColor: 'var(--copper-500)', color: '#FFF', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '12.5px', fontWeight: 600 }}
          >
            Return to Sign In
          </button>
        </div>
      </PortalShell>
    )
  }

  return (
    <PortalShell customerName={quote?.customer?.name}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Quotation Header Banner */}
        <Card style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--ink-900)' }}>
                  Quotation Proposal #{formatDisplayId(quotationId)}
                </h1>
                <Badge variant={quote?.status === 'APPROVED' ? 'success' : 'warning'}>
                  {quote?.status === 'SENT' ? 'Under Negotiation' : quote?.status}
                </Badge>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Prepared for <strong style={{ color: 'var(--ink-900)' }}>{quote?.customer?.name}</strong> • Prepared by Sales Representative {quote?.rep?.name}
              </p>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>Total Amount</span>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--ink-900)', fontVariantNumeric: 'tabular-nums' }}>
                ${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </Card>

        {/* Read-Only Quote Summary Table */}
        <Card style={{ padding: 0 }}>
          <CardHeader title="Line Items & Agreed Pricing" />
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Product / Service</TableHeaderCell>
                <TableHeaderCell>Quantity</TableHeaderCell>
                <TableHeaderCell>Unit Price</TableHeaderCell>
                <TableHeaderCell>Discount</TableHeaderCell>
                <TableHeaderCell>Line Total</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {quote?.lines?.map((line) => (
                <TableRow key={line.id}>
                  <TableCell style={{ fontWeight: 600 }}>{line.product?.name}</TableCell>
                  <TableCell>{line.quantity}</TableCell>
                  <TableCell>${Number(line.product?.basePrice).toFixed(2)}</TableCell>
                  <TableCell>{Number(line.unitDiscountPercent)}%</TableCell>
                  <TableCell style={{ fontWeight: 600 }}>${Number(line.lineTotal).toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        {/* Negotiation & Comments Thread */}
        <Card style={{ padding: '24px' }}>
          <CardHeader
            title="Negotiation Comments & Counter Proposals"
            subtitle="Direct dialogue with your dedicated sales representative"
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
            {!quote?.negotiationComments || quote.negotiationComments.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '12px' }}>
                No negotiation comments yet. Use the form below to propose changes or ask questions.
              </div>
            ) : (
              quote.negotiationComments.map((comm) => (
                <div
                  key={comm.id}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '4px',
                    border: comm.authorType === 'CUSTOMER' ? '1px solid var(--status-pending-border)' : '1px solid var(--border-subtle)',
                    backgroundColor: comm.authorType === 'CUSTOMER' ? 'var(--status-pending-subtle)' : '#FFFFFF',
                    alignSelf: comm.authorType === 'CUSTOMER' ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px', gap: '12px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: comm.authorType === 'CUSTOMER' ? 'var(--copper-700)' : 'var(--ink-900)' }}>
                      {comm.authorType === 'CUSTOMER' ? 'You (Customer)' : comm.authorType === 'MANAGER' ? 'Sales Manager' : 'Sales Representative'}
                    </span>
                    <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
                      {new Date(comm.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--ink-900)', margin: 0, lineHeight: '1.4' }}>{comm.comment}</p>
                  {comm.counterDiscountPercent && (
                    <div style={{ marginTop: '6px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          color: 'var(--copper-700)',
                          backgroundColor: '#FFFFFF',
                          border: '1px solid var(--status-pending-border)',
                          padding: '2px 8px',
                          borderRadius: '3px',
                        }}
                      >
                        Counter Discount Requested: {Number(comm.counterDiscountPercent)}%
                      </span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Proposal Input Form / Accepted State */}
          {quote?.status === 'CONFIRMED' || quote?.status === 'FULFILLED' ? (
            <div
              style={{
                marginTop: '16px',
                padding: '20px',
                backgroundColor: 'var(--status-approved-subtle)',
                border: '1px solid var(--status-approved-border)',
                borderRadius: '6px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              {/* Header Status */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(22, 101, 52, 0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--status-approved)',
                    }}
                  >
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--status-approved)' }}>
                      Quotation Confirmed & Sales Order Locked (#SO-{formatDisplayId(quotationId)})
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--ink-900)', marginTop: '2px' }}>
                      Your agreement is finalized. Automated billing and multi-warehouse fulfillment are active.
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <Button variant="primary" size="sm" onClick={() => setShowReceiptModal(true)}>
                    <Printer size={13} /> View & Print Official Receipt
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => router.push('/portal')}>
                    <ArrowLeft size={13} /> Back to Portal
                  </Button>
                </div>
              </div>

              {/* Lifecycle Progress Stepper */}
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '6px',
                  border: '1px solid var(--border-subtle)',
                  padding: '12px 16px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'var(--status-approved)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}>
                    ✓
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink-900)' }}>1. Terms Approved</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Governance verified</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'var(--status-approved)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}>
                    ✓
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink-900)' }}>2. Order Confirmed</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Sales Order placed</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'var(--status-approved)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}>
                    ✓
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink-900)' }}>
                      3. Invoice Generated
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {quote?.invoices && quote.invoices.length > 0 ? (
                        <span>${Number(quote.invoices[0].amount).toFixed(2)} (Tax Included)</span>
                      ) : (
                        <span>${(subtotal * 1.18).toFixed(2)} (Tax Included)</span>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'var(--copper-500)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}>
                    4
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink-900)' }}>4. Fulfillment Queue</div>
                    <div style={{ fontSize: '11px', color: 'var(--copper-600)' }}>Warehouse dispatch</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
              {/* Under Governance Notice if pending approval */}
              {quote?.status === 'PENDING_APPROVAL' && (
                <div
                  style={{
                    padding: '10px 14px',
                    backgroundColor: 'var(--status-pending-subtle)',
                    border: '1px solid var(--status-pending-border)',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '12px',
                    color: 'var(--copper-700)',
                  }}
                >
                  <ShieldAlert size={18} color="var(--copper-600)" />
                  <div>
                    <strong>Under Governance Review:</strong> Your requested terms or discount exceeded standard discount limits and have been routed to Sales Management / Finance. Once approved, you will be able to confirm and lock this quote.
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                <Input
                  label="Requested Counter Discount (%)"
                  type="number"
                  placeholder="e.g. 20"
                  value={counterDiscount}
                  onChange={(e) => setCounterDiscount(e.target.value !== '' ? Number(e.target.value) : '')}
                />
                <Input
                  label="Message / Note"
                  placeholder="e.g. Can we request a 20% discount on the hardware lines?"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ShieldAlert size={14} color="var(--copper-600)" />
                  Counter-proposals exceeding discount ceilings automatically re-trigger manager/finance approval.
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button variant="secondary" onClick={handleSendNegotiation} isLoading={isSubmitting}>
                    <MessageSquare size={14} /> Send Counter Request
                  </Button>
                  {userRole === 'CUSTOMER' ? (
                    quote?.status === 'APPROVED' || quote?.status === 'SENT' ? (
                      <Button variant="primary" onClick={handleConfirmQuote} isLoading={isConfirming}>
                        <CheckCircle2 size={14} /> Confirm & Accept Quote
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        disabled
                        style={{ opacity: 0.65, cursor: 'not-allowed' }}
                        title={quote?.status === 'PENDING_APPROVAL' ? 'Awaiting manager/finance approval before order confirmation' : 'Proposal in draft review'}
                      >
                        <CheckCircle2 size={14} />
                        {quote?.status === 'PENDING_APPROVAL' ? 'Awaiting Management Approval' : 'In Preparation'}
                      </Button>
                    )
                  ) : (
                    <Button variant="secondary" disabled style={{ opacity: 0.65, cursor: 'not-allowed' }} title="Only customer can accept in portal">
                      <CheckCircle2 size={14} /> Confirm (Preview Mode)
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Printable Official Order Confirmation & Receipt Modal */}
        <Modal
          isOpen={showReceiptModal}
          onClose={() => setShowReceiptModal(false)}
          title={`Order Confirmation & Tax Invoice — #SO-${formatDisplayId(quotationId)}`}
          footer={
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button variant="secondary" size="sm" onClick={() => setShowReceiptModal(false)}>
                Close
              </Button>
              <Button variant="primary" size="sm" onClick={() => window.print()}>
                <Printer size={13} /> Print / Download PDF
              </Button>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '12.5px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--ink-900)' }}>DealFlow360 Operations</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Enterprise B2B Order Fulfillment</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, color: 'var(--copper-700)' }}>Sales Order: #SO-{formatDisplayId(quotationId)}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  Date: {new Date(quote?.updatedAt || Date.now()).toLocaleDateString()}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '3px' }}>
                  Bill To
                </div>
                <div style={{ fontWeight: 700, color: 'var(--ink-900)' }}>{quote?.customer?.name}</div>
                <div style={{ color: 'var(--text-secondary)' }}>{quote?.customer?.email}</div>
                <div style={{ color: 'var(--text-secondary)' }}>Tier: {quote?.customer?.tier?.name || 'Standard'}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '3px' }}>
                  Order Status
                </div>
                <Badge variant="success">Confirmed & Invoicing Active</Badge>
                {quote?.invoices && quote.invoices.length > 0 && (
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Invoice Ref: #INV-{quote.invoices[0].id.slice(-6).toUpperCase()}
                  </div>
                )}
              </div>
            </div>

            {/* Line items summary */}
            <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
                <thead style={{ backgroundColor: 'var(--neutral-100)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <tr>
                    <th style={{ padding: '6px 10px', textAlign: 'left' }}>Item</th>
                    <th style={{ padding: '6px 10px', textAlign: 'center' }}>Qty</th>
                    <th style={{ padding: '6px 10px', textAlign: 'right' }}>Discount</th>
                    <th style={{ padding: '6px 10px', textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {quote?.lines?.map((l) => (
                    <tr key={l.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '6px 10px' }}>
                        <div style={{ fontWeight: 600 }}>{l.product?.name}</div>
                        {l.variant && <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>{l.variant.attributeName}: {l.variant.value}</div>}
                      </td>
                      <td style={{ padding: '6px 10px', textAlign: 'center' }}>{l.quantity}</td>
                      <td style={{ padding: '6px 10px', textAlign: 'right' }}>{Number(l.unitDiscountPercent)}%</td>
                      <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 600 }}>${Number(l.lineTotal).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial summary */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '220px', color: 'var(--text-secondary)' }}>
                <span>Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '220px', color: 'var(--text-secondary)' }}>
                <span>Standard Tax (18%):</span>
                <span>${(subtotal * 0.18).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '220px', fontWeight: 800, fontSize: '14px', color: 'var(--ink-900)', borderTop: '1px solid var(--border-subtle)', paddingTop: '4px' }}>
                <span>Total Amount:</span>
                <span>${(subtotal * 1.18).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </Modal>
      </div>
    </PortalShell>
  )
}
