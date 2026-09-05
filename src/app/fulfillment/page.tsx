'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { InternalShell } from '@/components/shell/InternalShell'
import { Card, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from '@/components/ui/Table'
import { WarehouseDTO, QuotationDTO } from '@/types/api-contracts'
import { formatDisplayId } from '@/lib/formatters'

export default function FulfillmentPage() {
  const router = useRouter()
  const [warehouses, setWarehouses] = useState<WarehouseDTO[]>([])
  const [orders, setOrders] = useState<QuotationDTO[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [wRes, qRes] = await Promise.all([fetch('/api/warehouses'), fetch('/api/quotations?status=APPROVED')])
      if (wRes.ok) setWarehouses(await wRes.json())
      if (qRes.ok) setOrders(await qRes.json())
    } catch (err: any) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  return (
    <InternalShell title="Fulfillment & Multi-Warehouse Stock">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Live Warehouse Stocks Table */}
        <Card style={{ padding: 0 }}>
          <CardHeader title="Warehouse Inventory & Shipping Weight" subtitle="Real-time multi-warehouse stock levels" />
          {isLoading ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#71717A', fontSize: '13px' }}>Loading stock levels...</div>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Warehouse</TableHeaderCell>
                  <TableHeaderCell>Shipping Weight Factor</TableHeaderCell>
                  <TableHeaderCell>Fulfillment Status</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {warehouses.map((w) => (
                  <TableRow key={w.id}>
                    <TableCell style={{ fontWeight: 600 }}>{w.name}</TableCell>
                    <TableCell>{Number(w.shippingCostWeight).toFixed(2)}x weighting</TableCell>
                    <TableCell>
                      <Badge variant="success">Operational</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>

        {/* Approved Orders Awaiting Fulfillment Table */}
        <Card style={{ padding: 0 }}>
          <CardHeader title="Approved Orders Awaiting Fulfillment" subtitle="Click an order to execute stock deduction and warehouse split" />
          {isLoading ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#71717A', fontSize: '13px' }}>Loading orders...</div>
          ) : orders.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#71717A', fontSize: '13px' }}>No approved orders awaiting fulfillment.</div>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Order ID</TableHeaderCell>
                  <TableHeaderCell>Customer</TableHeaderCell>
                  <TableHeaderCell>Total Items</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell>Action</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.map((ord) => (
                  <TableRow key={ord.id} onClick={() => router.push(`/fulfillment/${ord.id}`)}>
                    <TableCell style={{ fontWeight: 600, color: '#4F46E5' }}>#{formatDisplayId(ord.id)}</TableCell>
                    <TableCell style={{ fontWeight: 500 }}>{ord.customer?.name}</TableCell>
                    <TableCell>{ord.lines?.length || 0} line items</TableCell>
                    <TableCell>
                      <Badge variant="warning">Awaiting Split</Badge>
                    </TableCell>
                    <TableCell style={{ color: '#4F46E5', fontWeight: 600 }}>Manage Split →</TableCell>
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
