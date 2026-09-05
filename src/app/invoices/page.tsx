'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { InternalShell } from '@/components/shell/InternalShell'
import { Card, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from '@/components/ui/Table'
import { InvoiceDTO } from '@/types/api-contracts'

export default function InvoicesPage() {
  const router = useRouter()
  const [invoices, setInvoices] = useState<InvoiceDTO[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchInvoices = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/invoices')
      if (res.ok) setInvoices(await res.json())
    } catch (err: any) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchInvoices()
  }, [])

  const unpaidCount = invoices.filter((i) => i.status !== 'PAID').length
  const paidCount = invoices.filter((i) => i.status === 'PAID').length

  return (
    <InternalShell title="Invoices & Billing Reconciliation">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
            <div style={{ padding: '24px', textAlign: 'center', color: '#71717A', fontSize: '13px' }}>No invoices found.</div>
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
                    <TableCell style={{ fontWeight: 600, color: '#4F46E5' }}>#{inv.id.slice(-6)}</TableCell>
                    <TableCell>#{inv.quotationId.slice(-6)}</TableCell>
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
      </div>
    </InternalShell>
  )
}
