'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { InternalShell } from '@/components/shell/InternalShell'
import { RoleGuard } from '@/components/auth/RoleGuard'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Select, Input } from '@/components/ui/Input'
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
      <RoleGuard allowedRoles={['FINANCE', 'MANAGER']}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Top Controls Bar */}
          {userRole === 'FINANCE' && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Button variant="primary" onClick={() => setIsModalOpen(true)}>
                <Plus size={14} />
                Generate Invoice
              </Button>
            </div>
          )}

        {/* Metric Header */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          <Card>
            <span style={{ fontSize: '12px', color: '#71717A', fontWeight: 500 }}>Unpaid / Pending Invoices</span>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#B45309', marginTop: '4px' }}>
              {unpaidCount}
            </div>
          </Card>
          <Card>
            <span style={{ fontSize: '12px', color: '#71717A', fontWeight: 500 }}>Paid Invoices</span>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#15803D', marginTop: '4px' }}>
              {paidCount}
            </div>
          </Card>
        </div>

        {/* Invoices Table */}
        <Card style={{ padding: 0 }}>
          <CardHeader title="Invoices Ledger" />
          {isLoading ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#71717A', fontSize: '13px' }}>Loading invoices...</div>
          ) : invoices.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#71717A', fontSize: '13px' }}>
              No invoices found. Click &quot;Generate Invoice&quot; above to create one.
            </div>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Invoice #</TableHeaderCell>
                  <TableHeaderCell>Quote ID</TableHeaderCell>
                  <TableHeaderCell>Amount</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell>Created Date</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoices.map((inv) => (
                  <TableRow key={inv.id} onClick={() => router.push(`/invoices/${inv.id}`)}>
                    <TableCell style={{ fontWeight: 600, color: '#4F46E5' }}>#{formatDisplayId(inv.id)}</TableCell>
                    <TableCell>#{formatDisplayId(inv.quotationId)}</TableCell>
                    <TableCell style={{ fontWeight: 600 }}>${Number(inv.amount).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={inv.status === 'PAID' ? 'success' : 'warning'}>
                        {inv.status}
                      </Badge>
                    </TableCell>
                    <TableCell style={{ color: '#71717A', fontSize: '12px' }}>
                      {new Date(inv.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>

        {/* Generate Invoice Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Generate New Invoice"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Select
              label="Select Approved Quotation"
              value={selectedQuotationId}
              onChange={(e) => handleQuotationChange(e.target.value)}
              options={quotations.map((q) => ({
                value: q.id,
                label: `${q.customer?.name || 'Customer'} — #${formatDisplayId(q.id)} ($${(
                  (q.lines?.reduce((s, l) => s + Number(l.lineTotal || 0), 0) || 0) * 1.18
                ).toFixed(2)})`,
              }))}
            />

            <Input
              label="Invoice Total Amount ($ with 18% Tax)"
              type="number"
              value={invoiceAmount}
              onChange={(e) => setInvoiceAmount(Number(e.target.value))}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleCreateInvoice} isLoading={isCreating}>
                Generate Invoice
              </Button>
            </div>
          </div>
        </Modal>
      </div>
      </RoleGuard>
    </InternalShell>
  )
}
