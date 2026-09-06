'use client'

import React, { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { InternalShell } from '@/components/shell/InternalShell'
import { RoleGuard } from '@/components/auth/RoleGuard'
import { Card, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from '@/components/ui/Table'
import { QuotationDTO, ProductDTO, UpsellSuggestionDTO, SubscriptionPlanDTO } from '@/types/api-contracts'
import { Plus, Trash2, Send, ShieldAlert, Sparkles, CheckCircle, Eye } from 'lucide-react'
import { formatDisplayId } from '@/lib/formatters'

export default function QuotationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { data: session } = useSession()
  const userRole = (session?.user?.role as string) || ''
  const resolvedParams = use(params)
  const quotationId = resolvedParams.id

  const [quote, setQuote] = useState<QuotationDTO | null>(null)
  const [products, setProducts] = useState<ProductDTO[]>([])
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlanDTO[]>([])
  const [upsells, setUpsells] = useState<UpsellSuggestionDTO[]>([])
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
      setError(err.message || 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchQuoteDetail()
  }, [quotationId])

  const handleAddLine = async (overrideProductId?: string) => {
    const prodId = overrideProductId || selectedProductId
    if (!prodId) return

    try {
      const res = await fetch(`/api/quotations/${quotationId}/lines`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: prodId,
          quantity: Number(quantity),
          unitDiscountPercent: Number(discountPercent),
          subscriptionPlanId: selectedPlanId || null,
        }),
      })

      if (!res.ok) {
        const errJson = await res.json()
        throw new Error(errJson.error || 'Failed to add line item')
      }

      setQuantity(1)
      setDiscountPercent(0)
      setSelectedPlanId('')
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

  const canEdit = (userRole === 'REP' || userRole === 'MANAGER' || userRole === 'ADMIN') && quote?.status === 'DRAFT'

  return (
    <InternalShell title={`${canEdit ? 'Quotation Builder' : 'Quotation Details'} — #${formatDisplayId(quotationId)}`}>
      <RoleGuard allowedRoles={['REP', 'MANAGER', 'FINANCE', 'ADMIN']}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Finance Audit Banner if viewed by Finance */}
          {userRole === 'FINANCE' && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '9px 14px',
                backgroundColor: 'var(--neutral-100)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '4px',
                fontSize: '12px',
                color: 'var(--ink-900)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Eye size={15} color="var(--copper-500)" />
                <span>
                  <strong>Finance Audit View:</strong> Quotation pricing, recurring items, and margin transparency.
                </span>
              </div>
              {quote?.status === 'PENDING_APPROVAL' && (
                <Button variant="primary" size="sm" onClick={() => router.push(`/approvals/${quotationId}`)}>
                  <CheckCircle size={12} />
                  Review in Approvals &rarr;
                </Button>
              )}
            </div>
          )}

          {/* Header Info Banner */}
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ink-900)' }}>
                    {quote?.customer?.name || 'Loading Customer...'}
                  </h2>
                  <Badge variant={quote?.status === 'APPROVED' ? 'success' : quote?.status === 'PENDING_APPROVAL' ? 'warning' : 'neutral'}>
                    {quote?.status}
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

          {/* Live Governance Notice (only when editable) */}
          {canEdit && (
            <div
              style={{
                padding: '8px 12px',
                backgroundColor: 'var(--status-pending-subtle)',
                border: '1px solid var(--status-pending-border)',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '11.5px',
                color: 'var(--copper-700)',
              }}
            >
              <ShieldAlert size={15} color="var(--copper-600)" />
              <span>
                <strong>Live Governance:</strong> Discounts checked live against Category & Tier limits. Blended risk recalculates on every line edit.
              </span>
            </div>
          )}

          {/* Add Line Form (Only if DRAFT and user has editing privileges) */}
          {canEdit && (
            <Card>
              <CardHeader title="Add Product Line Item" />
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr auto', gap: '10px', alignItems: 'flex-end' }}>
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
                <Button variant="primary" size="sm" onClick={() => handleAddLine()}>
                  <Plus size={13} />
                  Add Line
                </Button>
              </div>
            </Card>
          )}

          {/* Line Items Table (Dense Console) */}
          <Card style={{ padding: 0 }}>
            <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-subtle)', fontWeight: 700, fontSize: '12.5px', color: 'var(--ink-900)' }}>
              Quotation Line Items ({quote?.lines?.length || 0})
            </div>

            {!quote?.lines || quote.lines.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '12.5px' }}>
                No line items added yet. Use the form above to add products.
              </div>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>Product</TableHeaderCell>
                    <TableHeaderCell>Category</TableHeaderCell>
                    <TableHeaderCell align="right">Unit Price</TableHeaderCell>
                    <TableHeaderCell align="right">Qty</TableHeaderCell>
                    <TableHeaderCell align="right">Discount</TableHeaderCell>
                    <TableHeaderCell align="right">Margin</TableHeaderCell>
                    <TableHeaderCell align="right">Line Total</TableHeaderCell>
                    {canEdit && <TableHeaderCell align="center">Action</TableHeaderCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {quote.lines.map((line) => (
                    <TableRow key={line.id}>
                      <TableCell style={{ fontWeight: 600, color: 'var(--ink-900)' }}>
                        <div>{line.product?.name}</div>
                        {line.subscriptionPlan ? (
                          <span
                            style={{
                              display: 'inline-block',
                              marginTop: '2px',
                              fontSize: '10.5px',
                              color: 'var(--copper-700)',
                              backgroundColor: 'var(--status-pending-subtle)',
                              border: '1px solid var(--status-pending-border)',
                              padding: '1px 5px',
                              borderRadius: '2px',
                              fontWeight: 700,
                            }}
                          >
                            Recurring • {line.subscriptionPlan.cadence}
                          </span>
                        ) : (
                          <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>One-time</span>
                        )}
                      </TableCell>
                      <TableCell style={{ color: 'var(--text-secondary)' }}>{line.product?.category?.name || 'General'}</TableCell>
                      <TableCell align="right" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        ${Number(line.product?.basePrice).toFixed(2)}
                      </TableCell>
                      <TableCell align="right" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {line.quantity}
                      </TableCell>
                      <TableCell
                        align="right"
                        style={{
                          fontWeight: Number(line.unitDiscountPercent) > 15 ? 700 : 500,
                          color: Number(line.unitDiscountPercent) > 15 ? 'var(--status-rejected)' : 'var(--ink-900)',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {Number(line.unitDiscountPercent)}%
                      </TableCell>
                      <TableCell align="right" style={{ color: 'var(--status-approved)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                        ${Number(line.margin).toFixed(2)}
                      </TableCell>
                      <TableCell align="right" style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: 'var(--ink-900)' }}>
                        ${Number(line.lineTotal).toFixed(2)}
                      </TableCell>
                      {canEdit && (
                        <TableCell align="center">
                          <button
                            onClick={() => handleDeleteLine(line.id)}
                            style={{ background: 'none', border: 'none', color: 'var(--status-rejected)', cursor: 'pointer', padding: '2px' }}
                            title="Delete Line"
                          >
                            <Trash2 size={14} />
                          </button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {/* Table Summary Footer */}
            <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-subtle)', backgroundColor: 'var(--neutral-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: 600 }}>Subtotal Value</span>
              <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--ink-900)', fontVariantNumeric: 'tabular-nums' }}>
                ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </Card>

          {/* Upsell / Cross-sell Suggestions Panel */}
          {upsells.length > 0 && (
            <Card>
              <CardHeader
                title="Upsell & Cross-Sell Suggestions"
                subtitle="Ranked suggestions based on co-purchase pairings and margin thresholds"
              />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
                {upsells.map((sug, idx) => (
                  <div
                    key={sug.ruleId || sug.id || `upsell-${idx}`}
                    style={{
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '4px',
                      padding: '10px 12px',
                      backgroundColor: '#FFFFFF',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '8px',
                      transition: 'border-color 180ms ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--copper-500)')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--ink-900)' }}>
                          {sug.suggestedProduct?.name}
                        </span>
                        {sug.isPromoted && (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                              fontSize: '10px',
                              fontWeight: 700,
                              color: 'var(--copper-700)',
                              backgroundColor: 'var(--status-pending-subtle)',
                              padding: '1px 5px',
                              borderRadius: '2px',
                              border: '1px solid var(--status-pending-border)',
                            }}
                          >
                            <Sparkles size={9} /> Promoted
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '3px' }}>
                        {(sug as any).reason || (sug.isPromoted ? 'Featured partner promotion' : 'Recommended pairing')} • Base: ${Number(sug.suggestedProduct?.basePrice || 0).toFixed(2)}
                      </p>
                    </div>
                    {canEdit && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleAddLine(sug.suggestedProduct?.id)}
                        style={{ alignSelf: 'flex-start' }}
                      >
                        <Plus size={11} /> Add to Quote
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Action Bar (Submit for Approval or Review in Approvals) */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            {canEdit && (
              <Button
                variant="primary"
                size="md"
                onClick={handleSubmitForApproval}
                isLoading={isSubmitting}
                disabled={!quote?.lines || quote.lines.length === 0}
              >
                <Send size={13} />
                Submit for Governance Approval
              </Button>
            )}
            {quote?.status === 'PENDING_APPROVAL' && (userRole === 'FINANCE' || userRole === 'MANAGER' || userRole === 'ADMIN') && (
              <Button
                variant="primary"
                size="md"
                onClick={() => router.push(`/approvals/${quotationId}`)}
              >
                <CheckCircle size={13} />
                Review in Approvals &rarr;
              </Button>
            )}
          </div>
        </div>
      </RoleGuard>
    </InternalShell>
  )
}
