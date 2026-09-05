'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { InternalShell } from '@/components/shell/InternalShell'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Input'
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from '@/components/ui/Table'
import { QuotationDTO, CustomerDTO } from '@/types/api-contracts'
import { Plus, LayoutGrid, List } from 'lucide-react'
import { formatDisplayId } from '@/lib/formatters'

const KANBAN_STAGES = [
  { key: 'DRAFT', label: 'Draft' },
  { key: 'PENDING_APPROVAL', label: 'Pending Approval' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'SENT', label: 'Negotiation' },
  { key: 'CONFIRMED', label: 'Confirmed' },
]

export default function QuotationsPage() {
  const router = useRouter()
  const [quotations, setQuotations] = useState<QuotationDTO[]>([])
  const [customers, setCustomers] = useState<CustomerDTO[]>([])
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // New quotation modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const fetchData = async () => {
    setIsLoading(true)
    setError('')
    try {
      const [quotesRes, custRes] = await Promise.all([
        fetch('/api/quotations'),
        fetch('/api/customers'),
      ])

      if (quotesRes.ok) {
        const qJson = await quotesRes.json()
        setQuotations(qJson)
      }
      if (custRes.ok) {
        const cJson = await custRes.json()
        setCustomers(cJson)
        if (cJson.length > 0) setSelectedCustomerId(cJson[0].id)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load quotations')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleCreateQuotation = async () => {
    if (!selectedCustomerId) return
    setIsCreating(true)
    try {
      const res = await fetch('/api/quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: selectedCustomerId }),
      })

      if (!res.ok) {
        const errJson = await res.json()
        throw new Error(errJson.error || 'Failed to create quotation')
      }

      const newQuote = await res.json()
      setIsModalOpen(false)
      router.push(`/quotations/${newQuote.id}`)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setIsCreating(false)
    }
  }

  const calculateTotalValue = (quote: QuotationDTO) => {
    if (!quote.lines || quote.lines.length === 0) return 0
    return quote.lines.reduce((sum, line) => sum + Number(line.lineTotal || 0), 0)
  }

  return (
    <InternalShell title="Quotations Pipeline">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Top Controls Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Button variant="primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={14} />
            New Quotation
          </Button>

          {/* View Mode Switcher */}
          <div style={{ display: 'flex', gap: '4px', backgroundColor: '#E4E4E7', padding: '2px', borderRadius: '6px' }}>
            <button
              onClick={() => setViewMode('kanban')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 500,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: viewMode === 'kanban' ? '#FFFFFF' : 'transparent',
                color: viewMode === 'kanban' ? '#18181B' : '#71717A',
              }}
            >
              <LayoutGrid size={13} />
              Kanban
            </button>
            <button
              onClick={() => setViewMode('table')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 500,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: viewMode === 'table' ? '#FFFFFF' : 'transparent',
                color: viewMode === 'table' ? '#18181B' : '#71717A',
              }}
            >
              <List size={13} />
              Table
            </button>
          </div>
        </div>

        {error && (
          <div style={{ padding: '12px', borderRadius: '6px', backgroundColor: '#FEF2F2', color: '#B91C1C', fontSize: '13px' }}>
            {error}
          </div>
        )}

        {isLoading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#71717A', fontSize: '13px' }}>
            Loading quotations...
          </div>
        ) : viewMode === 'kanban' ? (
          /* Kanban Board View */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', overflowX: 'auto', minHeight: '500px' }}>
            {KANBAN_STAGES.map((stage) => {
              const stageQuotes = quotations.filter((q) => q.status === stage.key)

              return (
                <div
                  key={stage.key}
                  style={{
                    backgroundColor: '#FAFAFA',
                    border: '1px solid #E4E4E7',
                    borderRadius: '8px',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  {/* Column Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #E4E4E7' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#18181B' }}>{stage.label}</span>
                    <span style={{ fontSize: '11px', color: '#71717A', backgroundColor: '#E4E4E7', padding: '1px 6px', borderRadius: '10px' }}>
                      {stageQuotes.length}
                    </span>
                  </div>

                  {/* Quote Cards inside column */}
                  {stageQuotes.length === 0 ? (
                    <div style={{ padding: '16px 0', textAlign: 'center', color: '#A1A1AA', fontSize: '11px' }}>
                      No items
                    </div>
                  ) : (
                    stageQuotes.map((quote) => (
                      <div
                        key={quote.id}
                        onClick={() => router.push(`/quotations/${quote.id}`)}
                        style={{
                          backgroundColor: '#FFFFFF',
                          border: '1px solid #E4E4E7',
                          borderRadius: '6px',
                          padding: '12px',
                          cursor: 'pointer',
                          transition: 'border-color 0.15s ease',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: '#4F46E5' }}>
                            #{formatDisplayId(quote.id)}
                          </span>
                          {Number(quote.blendedRiskScore) > 20 && (
                            <Badge variant="danger">High Risk</Badge>
                          )}
                        </div>

                        <div style={{ fontSize: '13px', fontWeight: 500, color: '#18181B' }}>
                          {quote.customer?.name || 'Customer'}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', fontSize: '12px' }}>
                          <span style={{ color: '#71717A' }}>Value</span>
                          <span style={{ fontWeight: 600, color: '#18181B' }}>
                            ${calculateTotalValue(quote).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          /* Table View */
          <Card style={{ padding: 0 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Quote ID</TableHeaderCell>
                  <TableHeaderCell>Customer</TableHeaderCell>
                  <TableHeaderCell>Sales Rep</TableHeaderCell>
                  <TableHeaderCell>Lines</TableHeaderCell>
                  <TableHeaderCell>Blended Risk</TableHeaderCell>
                  <TableHeaderCell>Total Value</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {quotations.map((quote) => (
                  <TableRow key={quote.id} onClick={() => router.push(`/quotations/${quote.id}`)}>
                    <TableCell style={{ fontWeight: 600, color: '#4F46E5' }}>#{formatDisplayId(quote.id)}</TableCell>
                    <TableCell style={{ fontWeight: 500 }}>{quote.customer?.name}</TableCell>
                    <TableCell>{quote.rep?.name}</TableCell>
                    <TableCell>{quote.lines?.length || 0} items</TableCell>
                    <TableCell>{Number(quote.blendedRiskScore).toFixed(1)}%</TableCell>
                    <TableCell style={{ fontWeight: 600 }}>
                      ${calculateTotalValue(quote).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <Badge variant={quote.status === 'APPROVED' ? 'success' : quote.status === 'PENDING_APPROVAL' ? 'warning' : 'neutral'}>
                        {quote.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}

        {/* Modal: Create New Quotation */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Create New Quotation"
          footer={
            <>
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleCreateQuotation} isLoading={isCreating}>
                Create Draft
              </Button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Select
              label="Select Customer"
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              options={customers.map((c) => ({ label: `${c.name} (${c.tier?.name || 'Standard Tier'})`, value: c.id }))}
            />
            <p style={{ fontSize: '12px', color: '#71717A' }}>
              Creating a quotation initializes a new draft. You will be able to add products, calculate live discounts and margin, and view upsell suggestions.
            </p>
          </div>
        </Modal>
      </div>
    </InternalShell>
  )
}
