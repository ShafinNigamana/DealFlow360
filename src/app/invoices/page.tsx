'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { InternalShell } from '@/components/shell/InternalShell'
import { RoleGuard } from '@/components/auth/RoleGuard'
import { Card, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from '@/components/ui/Table'
import { InvoiceDTO, QuotationDTO } from '@/types/api-contracts'
import { Plus } from 'lucide-react'
import { formatDisplayId } from '@/lib/formatters'

export default function InvoicesPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const userRole = session?.user?.role || ''

  const [invoices, setInvoices] = useState<InvoiceDTO[]>([])
  const [quotations, setQuotations] = useState<QuotationDTO[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // New Invoice Modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedQuotationId, setSelectedQuotationId] = useState('')
  const [invoiceAmount, setInvoiceAmount] = useState<number>(0)
  const [isCreating, setIsCreating] = useState(false)

  const fetchInvoices = async () => {
    setIsLoading(true)
    try {
      const [invRes, quoteRes] = await Promise.all([
        fetch('/api/invoices'),
        fetch('/api/quotations'),
      ])
      if (invRes.ok) setInvoices(await invRes.json())
      if (quoteRes.ok) {
        const qList: QuotationDTO[] = await quoteRes.json()
        setQuotations(qList)
        if (qList.length > 0) {
          setSelectedQuotationId(qList[0].id)
          const sum = qList[0].lines?.reduce((s, l) => s + Number(l.lineTotal || 0), 0) || 0
          setInvoiceAmount(Number((sum * 1.18).toFixed(2))) // total with 18% tax
        }
      }
    } catch (err: any) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchInvoices()
  }, [])

  const handleQuotationChange = (qId: string) => {
    setSelectedQuotationId(qId)
    const quote = quotations.find((q) => q.id === qId)
    if (quote) {
      const sum = quote.lines?.reduce((s, l) => s + Number(l.lineTotal || 0), 0) || 0
      setInvoiceAmount(Number((sum * 1.18).toFixed(2)))
    }
  }

  const handleCreateInvoice = async () => {
    if (!selectedQuotationId || !invoiceAmount) return
    setIsCreating(true)
    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quotationId: selectedQuotationId,
          amount: Number(invoiceAmount),
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to create invoice')
      }

      const newInv = await res.json()
      setIsModalOpen(false)
      router.push(`/invoices/${newInv.id}`)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setIsCreating(false)
    }
  }

  const unpaidCount = invoices.filter((i) => i.status !== 'PAID').length
  const paidCount = invoices.filter((i) => i.status === 'PAID').length

  return (
    <InternalShell title="Invoices & Billing Reconciliation">
      <RoleGuard allowedRoles={['REP', 'MANAGER', 'FINANCE', 'ADMIN']}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Top Controls Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ink-900)' }}>
                Billing & Receivables Ledger
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '1px' }}>
                Reconcile one-time order payments and recurring subscription billing entries
              </p>
            </div>
            {userRole === 'FINANCE' && (
              <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
                <Plus size={13} />
                Generate Invoice
              </Button>
            )}
          </div>

          {/* Metric Header (Dense technical cards) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            <div
              style={{
                backgroundColor: 'var(--surface-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '4px',
                padding: '12px 14px',
              }}
            >
              <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Unpaid / Pending Invoices
              </span>
              <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--copper-600)', marginTop: '4px', fontVariantNumeric: 'tabular-nums' }}>
                {unpaidCount}
              </div>
            </div>
            <div
              style={{
                backgroundColor: 'var(--surface-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '4px',
                padding: '12px 14px',
              }}
            >
              <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Settled / Paid Invoices
              </span>
              <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--status-approved)', marginTop: '4px', fontVariantNumeric: 'tabular-nums' }}>
                {paidCount}
              </div>
            </div>
          </div>

          {/* Invoices Table */}
          <Card style={{ padding: 0 }}>
            {isLoading ? (
              <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '12.5px' }}>Loading invoices...</div>
            ) : invoices.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '12.5px' }}>
                No invoices found. Click &quot;Generate Invoice&quot; above to create one.
              </div>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell style={{ width: '130px' }}>Invoice #</TableHeaderCell>
                    <TableHeaderCell style={{ width: '130px' }}>Quote Ref</TableHeaderCell>
                    <TableHeaderCell align="right">Amount</TableHeaderCell>
                    <TableHeaderCell>Payment Status</TableHeaderCell>
                    <TableHeaderCell align="right">Created Date</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoices.map((inv) => (
                    <TableRow key={inv.id} onClick={() => router.push(`/invoices/${inv.id}`)}>
                      <TableCell style={{ fontWeight: 700, color: 'var(--ink-900)', fontFamily: 'ui-monospace, monospace', fontSize: '12px' }}>
                        #{formatDisplayId(inv.id)}
                      </TableCell>
                      <TableCell style={{ color: 'var(--text-secondary)', fontFamily: 'ui-monospace, monospace', fontSize: '11.5px' }}>
                        #{formatDisplayId(inv.quotationId)}
                      </TableCell>
                      <TableCell align="right" style={{ fontWeight: 700, color: 'var(--ink-900)', fontVariantNumeric: 'tabular-nums' }}>
                        ${Number(inv.amount).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={inv.status === 'PAID' ? 'success' : 'warning'}>
                          {inv.status}
                        </Badge>
                      </TableCell>
                      <TableCell align="right" style={{ color: 'var(--text-secondary)', fontSize: '11.5px', fontVariantNumeric: 'tabular-nums' }}>
                        {new Date(inv.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>

          {/* New Invoice Modal */}
          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title="Generate New Invoice"
            footer={
              <>
                <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" onClick={handleCreateInvoice} isLoading={isCreating}>
                  Create Invoice
                </Button>
              </>
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--ink-900)', display: 'block', marginBottom: '4px' }}>
                  Select Quotation
                </label>
                <select
                  value={selectedQuotationId}
                  onChange={(e) => handleQuotationChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    fontSize: '12.5px',
                    borderRadius: '4px',
                    border: '1px solid var(--border-subtle)',
                    backgroundColor: '#FFFFFF',
                    color: 'var(--ink-900)',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {quotations.map((q) => (
                    <option key={q.id} value={q.id}>
                      #{formatDisplayId(q.id)} — {q.customer?.name} ({q.status})
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Invoice Amount (incl. tax)"
                type="number"
                step="0.01"
                value={invoiceAmount}
                onChange={(e) => setInvoiceAmount(Number(e.target.value))}
              />

              <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                Creating an invoice marks terms agreed and enables payment reconciliation.
              </p>
            </div>
          </Modal>
        </div>
      </RoleGuard>
    </InternalShell>
  )
}
