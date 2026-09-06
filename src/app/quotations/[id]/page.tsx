'use client'

import React, { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { InternalShell } from '@/components/shell/InternalShell'
import { RoleGuard } from '@/components/auth/RoleGuard'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input, Select } from '@/components/ui/Input'
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from '@/components/ui/Table'
import { QuotationDTO, ProductDTO, UpsellSuggestionDTO } from '@/types/api-contracts'
import { Plus, Trash2, ShieldAlert, Sparkles, Send } from 'lucide-react'
import { formatDisplayId } from '@/lib/formatters'

export default function QuotationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: quotationId } = use(params)
  const router = useRouter()

  const [quote, setQuote] = useState<QuotationDTO | null>(null)
  const [products, setProducts] = useState<ProductDTO[]>([])
  const [upsells, setUpsells] = useState<UpsellSuggestionDTO[]>([])
  const [subscriptionPlans, setSubscriptionPlans] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Add line form state
  const [selectedProductId, setSelectedProductId] = useState('')
  const [selectedPlanId, setSelectedPlanId] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [discountPercent, setDiscountPercent] = useState(0)

  const fetchQuoteDetail = async () => {
    setIsLoading(true)
    setError('')
    try {
      const [qRes, pRes, uRes, spRes] = await Promise.all([
        fetch(`/api/quotations/${quotationId}`),
        fetch('/api/products'),
        fetch(`/api/quotations/${quotationId}/upsell-suggestions`),
        fetch('/api/subscription-plans'),
      ])

      if (!qRes.ok) throw new Error('Quotation not found')
      const qJson = await qRes.json()
      setQuote(qJson)

      if (pRes.ok) {
        const pJson = await pRes.json()
        setProducts(pJson)
        if (pJson.length > 0) setSelectedProductId(pJson[0].id)
      }

      if (uRes.ok) {
        const uJson = await uRes.json()
        setUpsells(uJson)
      }

      if (spRes.ok) {
        const spJson = await spRes.json()
        setSubscriptionPlans(spJson)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load quote detail')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchQuoteDetail()
  }, [quotationId])

  const handleAddLine = async (prodId?: string) => {
    const targetProductId = prodId || selectedProductId
    if (!targetProductId) return

    try {
      const res = await fetch(`/api/quotations/${quotationId}/lines`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: targetProductId,
          quantity: prodId ? 1 : Number(quantity),
          unitDiscountPercent: prodId ? 0 : Number(discountPercent),
          subscriptionPlanId: prodId ? undefined : (selectedPlanId || undefined),
        }),
      })

      if (!res.ok) {
        const errJson = await res.json()
        throw new Error(errJson.error || 'Failed to add line item')
      }

      fetchQuoteDetail()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleDeleteLine = async (lineId: string) => {
    try {
      const res = await fetch(`/api/quotations/${quotationId}/lines/${lineId}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Failed to delete line')
      fetchQuoteDetail()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleSubmitForApproval = async () => {
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/quotations/${quotationId}/submit`, {
        method: 'POST',
      })

      if (!res.ok) {
        const errJson = await res.json()
        throw new Error(errJson.error || 'Failed to submit quotation')
      }

      alert('Quotation submitted successfully!')
      fetchQuoteDetail()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const totalValue = quote?.lines?.reduce((sum, l) => sum + Number(l.lineTotal || 0), 0) || 0

  return (
    <InternalShell title={`Quotation Builder — #${formatDisplayId(quotationId)}`}>
      <RoleGuard allowedRoles={['REP', 'MANAGER']}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Header Info Banner */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#18181B' }}>
                  {quote?.customer?.name || 'Loading Customer...'}
                </h2>
                <Badge variant={quote?.status === 'APPROVED' ? 'success' : quote?.status === 'PENDING_APPROVAL' ? 'warning' : 'neutral'}>
                  {quote?.status}
                </Badge>
              </div>
              <p style={{ fontSize: '12px', color: '#71717A', marginTop: '4px' }}>
                Customer Tier: <strong style={{ color: '#18181B' }}>{quote?.customer?.tier?.name || 'Standard'}</strong> • Sales Rep: {quote?.rep?.name}
              </p>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: '#71717A', textTransform: 'uppercase' }}>Blended Risk Score</div>
              <div
                style={{
                  fontSize: '20px',
                  fontWeight: 700,
                  color: Number(quote?.blendedRiskScore) > 20 ? '#B91C1C' : '#15803D',
                }}
              >
                {Number(quote?.blendedRiskScore || 0).toFixed(1)}%
              </div>
            </div>
          </div>
        </Card>

        {/* Live Governance Notice */}
        <div
          style={{
            padding: '10px 14px',
            backgroundColor: '#EEF2FF',
            border: '1px solid #E0E7FF',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '12px',
            color: '#4338CA',
          }}
        >
          <ShieldAlert size={16} />
          <span>
            <strong>Live Discount Governance:</strong> Discounts are checked live against Category & Tier ceilings. Blended risk score updates automatically on line edits.
          </span>
        </div>

        {/* Add Line Form (Only if DRAFT) */}
        {quote?.status === 'DRAFT' && (
          <Card>
            <CardHeader title="Add Product Line Item" />
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr auto', gap: '12px', alignItems: 'flex-end' }}>
              <Select
                label="Product"
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                options={products.map((p) => ({
                  label: `${p.name} — $${Number(p.basePrice).toFixed(2)} (${p.category?.name})`,
                  value: p.id,
                }))}
              />
              <Select
                label="Billing Model"
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                options={[
                  { label: 'One-Time Purchase', value: '' },
                  ...subscriptionPlans.map((sp) => ({
                    label: `Recurring (${sp.name} - ${sp.cadence})`,
                    value: sp.id,
                  })),
                ]}
              />
              <Input
                label="Quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
              />
              <Input
                label="Discount %"
                type="number"
                min="0"
                max="100"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(Number(e.target.value))}
              />
              <Button variant="primary" onClick={() => handleAddLine()}>
                <Plus size={14} />
                Add Line
              </Button>
            </div>
          </Card>
        )}

        {/* Line Items Table */}
        <Card style={{ padding: 0 }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #E4E4E7', fontWeight: 600, fontSize: '14px' }}>
            Quotation Items ({quote?.lines?.length || 0})
          </div>

          {!quote?.lines || quote.lines.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: '#71717A', fontSize: '13px' }}>
              No line items added yet. Use the form above to add products.
            </div>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Product</TableHeaderCell>
                  <TableHeaderCell>Category</TableHeaderCell>
                  <TableHeaderCell>Unit Price</TableHeaderCell>
                  <TableHeaderCell>Qty</TableHeaderCell>
                  <TableHeaderCell>Discount</TableHeaderCell>
                  <TableHeaderCell>Margin</TableHeaderCell>
                  <TableHeaderCell>Line Total</TableHeaderCell>
                  {quote?.status === 'DRAFT' && <TableHeaderCell>Action</TableHeaderCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {quote.lines.map((line) => (
                  <TableRow key={line.id}>
                    <TableCell style={{ fontWeight: 600 }}>
                      <div>{line.product?.name}</div>
                      {line.subscriptionPlan ? (
                        <span
                          style={{
                            display: 'inline-block',
                            marginTop: '4px',
                            fontSize: '11px',
                            color: '#4F46E5',
                            backgroundColor: '#EEF2FF',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            fontWeight: 600,
                          }}
                        >
                          Recurring • {line.subscriptionPlan.cadence}
                        </span>
                      ) : (
                        <span style={{ fontSize: '11px', color: '#71717A' }}>One-time</span>
                      )}
                    </TableCell>
                    <TableCell style={{ color: '#71717A' }}>{line.product?.category?.name || 'General'}</TableCell>
                    <TableCell>${Number(line.product?.basePrice).toFixed(2)}</TableCell>
                    <TableCell>{line.quantity}</TableCell>
                    <TableCell style={{ fontWeight: Number(line.unitDiscountPercent) > 15 ? 600 : 400, color: Number(line.unitDiscountPercent) > 15 ? '#B91C1C' : '#18181B' }}>
                      {Number(line.unitDiscountPercent)}%
                    </TableCell>
                    <TableCell style={{ color: '#15803D' }}>${Number(line.margin).toFixed(2)}</TableCell>
                    <TableCell style={{ fontWeight: 600 }}>${Number(line.lineTotal).toFixed(2)}</TableCell>
                    {quote?.status === 'DRAFT' && (
                      <TableCell>
                        <button
                          onClick={() => handleDeleteLine(line.id)}
                          style={{ background: 'none', border: 'none', color: '#B91C1C', cursor: 'pointer' }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Table Summary Footer */}
          <div style={{ padding: '16px 20px', borderTop: '1px solid #E4E4E7', backgroundColor: '#FAFAFA', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: '#71717A' }}>Subtotal Value</span>
            <span style={{ fontSize: '18px', fontWeight: 700, color: '#18181B' }}>
              ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </Card>

        {/* Upsell / Cross-sell Suggestions Panel */}
        {upsells.length > 0 && (
          <Card>
            <CardHeader
              title="Upsell & Cross-Sell Suggestions"
              subtitle="Ranked suggestions based on co-purchase pairings and promotions"
            />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
              {upsells.map((sug, idx) => (
                <div
                  key={sug.ruleId || sug.id || `upsell-${idx}`}
                  style={{
                    border: '1px solid #E4E4E7',
                    borderRadius: '6px',
                    padding: '12px',
                    backgroundColor: '#FFFFFF',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '8px',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#18181B' }}>
                        {sug.suggestedProduct.name}
                      </span>
                      {sug.isPromoted && <Badge variant="accent"><Sparkles size={10} /> Promoted</Badge>}
                    </div>
                    <p style={{ fontSize: '11px', color: '#71717A', marginTop: '4px' }}>
                      {(sug as any).reason || (sug.isPromoted ? 'Promoted pairing' : 'Recommended co-purchase')} • Base Price: ${Number(sug.suggestedProduct.basePrice).toFixed(2)}
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleAddLine(sug.suggestedProduct.id)}
                    style={{ alignSelf: 'flex-start' }}
                  >
                    <Plus size={12} /> Add to Quote
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Bottom Actions Bar */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '10px' }}>
          <Button variant="secondary" onClick={() => router.push('/quotations')}>
            Back to List
          </Button>

          {quote?.status === 'DRAFT' && (
            <Button variant="primary" onClick={handleSubmitForApproval} isLoading={isSubmitting}>
              <Send size={14} />
              Submit for Approval
            </Button>
          )}

          {quote?.status === 'APPROVED' && (
            <Button
              variant="primary"
              onClick={() => router.push(`/portal/quotation/${quotationId}`)}
            >
              Open Customer Portal View
            </Button>
          )}
        </div>
      </div>
      </RoleGuard>
    </InternalShell>
  )
}
