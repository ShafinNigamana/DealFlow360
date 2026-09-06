'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { InternalShell } from '@/components/shell/InternalShell'
import { RoleGuard } from '@/components/auth/RoleGuard'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from '@/components/ui/Table'
import { QuotationDTO, CustomerDTO } from '@/types/api-contracts'
import { Plus, LayoutGrid, List, X } from 'lucide-react'
import { formatDisplayId } from '@/lib/formatters'

const KANBAN_STAGES = [
  { key: 'DRAFT', label: 'Draft' },
  { key: 'PENDING_APPROVAL', label: 'In Approval' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'SENT', label: 'Sent to Client' },
  { key: 'CONFIRMED', label: 'Confirmed' },
]

export default function QuotationsPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const userRole = (session?.user?.role as string) || ''
  const canCreate = userRole === 'REP' || userRole === 'MANAGER' || userRole === 'ADMIN'
  const [quotations, setQuotations] = useState<QuotationDTO[]>([])
  const [customers, setCustomers] = useState<CustomerDTO[]>([])
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('table')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // New Quote Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const fetchQuotations = async () => {
    setIsLoading(true)
    setError('')
    try {
      const [qRes, cRes] = await Promise.all([
        fetch('/api/quotations'),
        fetch('/api/customers'),
      ])

      if (!qRes.ok) throw new Error('Failed to load quotations')
      const qList: QuotationDTO[] = await qRes.json()
      setQuotations(qList)

      if (cRes.ok) {
        const cList: CustomerDTO[] = await cRes.json()
        setCustomers(cList)
        if (cList.length > 0) setSelectedCustomerId(cList[0].id)
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchQuotations()
  }, [])

  const handleCreateQuotation = async (e: React.FormEvent) => {
    e.preventDefault()
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

      const newQuote: QuotationDTO = await res.json()
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

  const getStatusBadge = (status: string) => {
    let bg = 'var(--neutral-100)'
    let color = 'var(--text-secondary)'
    let border = 'var(--neutral-200)'

    switch (status) {
      case 'APPROVED':
      case 'CONFIRMED':
      case 'FULFILLED':
        bg = 'var(--status-approved-subtle)'
        color = 'var(--status-approved)'
        border = 'var(--status-approved-border)'
        break
      case 'PENDING_APPROVAL':
        bg = 'var(--status-pending-subtle)'
        color = 'var(--copper-700)'
        border = 'var(--status-pending-border)'
        break
      case 'REJECTED':
      case 'CANCELLED':
        bg = 'var(--status-rejected-subtle)'
        color = 'var(--status-rejected)'
        border = 'var(--status-rejected-border)'
        break
      default:
        break
    }

    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: '2px 7px',
          borderRadius: '3px',
          fontSize: '11px',
          fontWeight: 600,
          backgroundColor: bg,
          color: color,
          border: `1px solid ${border}`,
          whiteSpace: 'nowrap',
        }}
      >
        {status.replace('_', ' ')}
      </span>
    )
  }

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
          justifyContent: 'space-between',
          gap: '6px',
          padding: '2px 7px',
          borderRadius: '3px',
          fontSize: '11.5px',
          fontWeight: 700,
          backgroundColor: bg,
          color: color,
          border: `1px solid ${border}`,
          fontVariantNumeric: 'tabular-nums',
          minWidth: '76px',
        }}
      >
        <span>{scoreNum.toFixed(1)}%</span>
        <span style={{ fontSize: '9px', textTransform: 'uppercase', opacity: 0.85, fontWeight: 800 }}>
          {label}
        </span>
      </span>
    )
  }

  return (
    <InternalShell title="Quotations Pipeline">
      <RoleGuard allowedRoles={['REP', 'MANAGER', 'FINANCE', 'ADMIN']}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Top Controls Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {canCreate ? (
              <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
                <Plus size={13} />
                New Quotation
              </Button>
            ) : (
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Live Quotations Overview (Read-Only Audit)
              </div>
            )}

            {/* View Mode Switcher */}
            <div style={{ display: 'flex', gap: '2px', backgroundColor: 'var(--neutral-100)', padding: '2px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
              <button
                onClick={() => setViewMode('table')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '3px 8px',
                  borderRadius: '3px',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: viewMode === 'table' ? '#FFFFFF' : 'transparent',
                  color: viewMode === 'table' ? 'var(--ink-900)' : 'var(--text-secondary)',
                  boxShadow: viewMode === 'table' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                  transition: 'all 150ms ease',
                }}
              >
                <List size={13} />
                Table
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '3px 8px',
                  borderRadius: '3px',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: viewMode === 'kanban' ? '#FFFFFF' : 'transparent',
                  color: viewMode === 'kanban' ? 'var(--ink-900)' : 'var(--text-secondary)',
                  boxShadow: viewMode === 'kanban' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                  transition: 'all 150ms ease',
                }}
              >
                <LayoutGrid size={13} />
                Kanban
              </button>
            </div>
          </div>

          {error && (
            <div style={{ padding: '10px 14px', borderRadius: '4px', backgroundColor: 'var(--status-rejected-subtle)', border: '1px solid var(--status-rejected-border)', color: 'var(--status-rejected)', fontSize: '12px' }}>
              {error}
            </div>
          )}

          {isLoading ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
              Loading quotations...
            </div>
          ) : viewMode === 'kanban' ? (
            /* Kanban Board View */
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', overflowX: 'auto', minHeight: '500px' }}>
              {KANBAN_STAGES.map((stage) => {
                const stageQuotes = quotations.filter((q) => q.status === stage.key)

                return (
                  <div
                    key={stage.key}
                    style={{
                      backgroundColor: 'var(--surface-card-subtle)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '4px',
                      padding: '10px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    {/* Column Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--border-subtle)' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink-900)' }}>{stage.label}</span>
                      <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)', backgroundColor: 'var(--neutral-200)', padding: '0 5px', borderRadius: '3px', fontWeight: 700 }}>
                        {stageQuotes.length}
                      </span>
                    </div>

                    {/* Quote Cards inside column */}
                    {stageQuotes.length === 0 ? (
                      <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '11px' }}>
                        No items
                      </div>
                    ) : (
                      stageQuotes.map((quote) => (
                        <div
                          key={quote.id}
                          onClick={() => router.push(`/quotations/${quote.id}`)}
                          style={{
                            backgroundColor: '#FFFFFF',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: '4px',
                            padding: '10px',
                            cursor: 'pointer',
                            transition: 'all 180ms ease',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--copper-500)')}
                          onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--ink-900)', fontFamily: 'ui-monospace, monospace' }}>
                              #{formatDisplayId(quote.id)}
                            </span>
                            {getRiskScoreBadge(Number(quote.blendedRiskScore || 0))}
                          </div>

                          <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--ink-900)' }}>
                            {quote.customer?.name || 'Customer'}
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px', fontSize: '11.5px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Value</span>
                            <span style={{ fontWeight: 700, color: 'var(--ink-900)', fontVariantNumeric: 'tabular-nums' }}>
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
            /* Dense Table View (VISUAL_DENSITY 5-6) */
            <Card style={{ padding: 0 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell style={{ width: '130px' }}>Quote Ref</TableHeaderCell>
                    <TableHeaderCell>Account / Customer</TableHeaderCell>
                    <TableHeaderCell>Owner (Rep)</TableHeaderCell>
                    <TableHeaderCell align="right" style={{ width: '70px' }}>Lines</TableHeaderCell>
                    <TableHeaderCell align="right" style={{ width: '120px' }}>Risk Assessment</TableHeaderCell>
                    <TableHeaderCell align="right" style={{ width: '110px' }}>Total Value</TableHeaderCell>
                    <TableHeaderCell style={{ width: '140px' }}>Governance Status</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {quotations.map((quote) => (
                    <TableRow
                      key={quote.id}
                      onClick={() => router.push(`/quotations/${quote.id}`)}
                    >
                      <TableCell style={{ fontWeight: 700, color: 'var(--ink-900)', fontFamily: 'ui-monospace, monospace', fontSize: '12px' }}>
                        #{formatDisplayId(quote.id)}
                      </TableCell>
                      <TableCell style={{ fontWeight: 600, color: 'var(--ink-900)' }}>
                        {quote.customer?.name || 'Unknown'}
                      </TableCell>
                      <TableCell style={{ color: 'var(--text-secondary)' }}>
                        {quote.rep?.name || 'Unassigned'}
                      </TableCell>
                      <TableCell align="right" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {quote.lines?.length || 0}
                      </TableCell>
                      <TableCell align="right">
                        {getRiskScoreBadge(Number(quote.blendedRiskScore || 0))}
                      </TableCell>
                      <TableCell align="right" style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: 'var(--ink-900)' }}>
                        ${calculateTotalValue(quote).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>{getStatusBadge(quote.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}

          {/* New Quotation Modal */}
          {isModalOpen && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(16, 25, 43, 0.45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 100,
                backdropFilter: 'blur(2px)',
              }}
            >
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '4px',
                  width: '100%',
                  maxWidth: '420px',
                  padding: '20px',
                  border: '1px solid var(--border-subtle)',
                  boxShadow: '0 10px 25px -5px rgba(16, 25, 43, 0.2)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink-900)' }}>Create New Quotation</h3>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                  >
                    <X size={16} />
                  </button>
                </div>

                <form onSubmit={handleCreateQuotation} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--ink-900)', display: 'block', marginBottom: '4px' }}>
                      Select Customer Account
                    </label>
                    <select
                      value={selectedCustomerId}
                      onChange={(e) => setSelectedCustomerId(e.target.value)}
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
                      required
                    >
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.tier?.name || 'General Tier'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                    <Button variant="secondary" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button variant="primary" size="sm" type="submit" isLoading={isCreating}>
                      Create Quotation
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </RoleGuard>
    </InternalShell>
  )
}
