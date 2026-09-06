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
import { QuotationDTO } from '@/types/api-contracts'
import { MessageSquare, Send, ShieldAlert, CheckCircle2, AlertOctagon } from 'lucide-react'
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
              <div style={{ padding: '16px', textAlign: 'center', color: '#A1A1AA', fontSize: '12px' }}>
                No negotiation comments yet. Use the form below to propose changes or ask questions.
              </div>
            ) : (
              quote.negotiationComments.map((comm) => (
                <div
                  key={comm.id}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1px solid #E4E4E7',
                    backgroundColor: comm.authorType === 'CUSTOMER' ? '#EEF2FF' : '#FFFFFF',
                    alignSelf: comm.authorType === 'CUSTOMER' ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px', gap: '12px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#18181B' }}>
                      {comm.authorType === 'CUSTOMER' ? 'You (Customer)' : 'Sales Team'}
                    </span>
                    <span style={{ fontSize: '11px', color: '#71717A' }}>
                      {new Date(comm.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', color: '#18181B' }}>{comm.comment}</p>
                  {comm.counterDiscountPercent && (
                    <div style={{ marginTop: '6px' }}>
                      <Badge variant="accent">Counter Discount Requested: {Number(comm.counterDiscountPercent)}%</Badge>
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
                padding: '16px',
                backgroundColor: '#F0FDF4',
                border: '1px solid #BBF7D0',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle2 size={20} color="#16A34A" />
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#166534' }}>
                    Quotation Confirmed & Accepted
                  </div>
                  <div style={{ fontSize: '12px', color: '#15803D' }}>
                    This proposal is confirmed. Order fulfillment and invoicing are underway.
                  </div>
                </div>
              </div>
              <Badge variant="success">Confirmed Order</Badge>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid #E4E4E7', paddingTop: '16px' }}>
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

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '11px', color: '#71717A', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ShieldAlert size={14} color="#4338CA" />
                  Counter-proposals exceeding discount ceilings automatically re-trigger manager approval.
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button variant="secondary" onClick={handleSendNegotiation} isLoading={isSubmitting}>
                    <MessageSquare size={14} /> Send Counter Request
                  </Button>
                  {userRole === 'CUSTOMER' ? (
                    <Button variant="primary" onClick={handleConfirmQuote} isLoading={isConfirming}>
                      <CheckCircle2 size={14} /> Confirm & Accept Quote
                    </Button>
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
      </div>
    </PortalShell>
  )
}
