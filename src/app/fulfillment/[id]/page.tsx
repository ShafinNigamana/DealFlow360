'use client'

import React, { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { InternalShell } from '@/components/shell/InternalShell'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from '@/components/ui/Table'
import { QuotationDTO } from '@/types/api-contracts'
import { Truck, Check, AlertCircle } from 'lucide-react'
import { formatDisplayId } from '@/lib/formatters'

export default function FulfillmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: orderId } = use(params)
  const router = useRouter()

  const [order, setOrder] = useState<QuotationDTO | null>(null)
  const [splitResult, setSplitResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isExecuting, setIsExecuting] = useState(false)

  const fetchDetail = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/quotations/${orderId}`)
      if (res.ok) {
        const json = await res.json()
        setOrder(json)
      }
    } catch (err: any) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDetail()
  }, [orderId])

  const handleCalculateSplit = async () => {
    setIsExecuting(true)
    try {
      const res = await fetch(`/api/quotations/${orderId}/warehouse-split`, {
        method: 'POST',
      })

      if (!res.ok) {
        const errJson = await res.json()
        throw new Error(errJson.error || 'Failed to calculate split')
      }

      const json = await res.json()
      setSplitResult(json)
      fetchDetail()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setIsExecuting(false)
    }
  }

  return (
    <InternalShell title={`Fulfillment Detail — Order #${formatDisplayId(orderId)}`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Order Header Summary */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#18181B' }}>
                  {order?.customer?.name || 'Customer'}
                </h2>
                <Badge variant={order?.status === 'FULFILLED' ? 'success' : 'warning'}>
                  {order?.status}
                </Badge>
              </div>
              <p style={{ fontSize: '12px', color: '#71717A', marginTop: '4px' }}>
                Order Value: ${order?.lines?.reduce((s, l) => s + Number(l.lineTotal), 0).toFixed(2)}
              </p>
            </div>

            {order?.status === 'FULFILLED' ? (
              <Button variant="secondary" disabled style={{ opacity: 0.8, cursor: 'default', backgroundColor: '#F4F4F5' }}>
                <Check size={14} color="#16A34A" /> Fulfillment Completed
              </Button>
            ) : (
              <Button variant="primary" onClick={handleCalculateSplit} isLoading={isExecuting}>
                <Truck size={14} /> Calculate & Execute Warehouse Split
              </Button>
            )}
          </div>
        </Card>

        {/* Existing Warehouse Splits Table */}
        <Card style={{ padding: 0 }}>
          <CardHeader
            title="Optimized Warehouse Split & Backorder Breakdown"
            subtitle="Minimizes total shipments based on stock availability and shipping weight cost"
          />

          {!order?.warehouseSplits || order.warehouseSplits.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: '#71717A', fontSize: '13px' }}>
              No warehouse splits executed yet. Click &quot;Calculate & Execute Warehouse Split&quot; above.
            </div>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Warehouse</TableHeaderCell>
                  <TableHeaderCell>Fulfilled Quantity</TableHeaderCell>
                  <TableHeaderCell>Est. Shipment Cost</TableHeaderCell>
                  <TableHeaderCell>Backorders</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {order.warehouseSplits.map((split) => (
                  <TableRow key={split.id}>
                    <TableCell style={{ fontWeight: 600 }}>{split.warehouse?.name || 'Main Warehouse'}</TableCell>
                    <TableCell>{split.quantity} units</TableCell>
                    <TableCell>${Number(split.estimatedShipmentCost).toFixed(2)}</TableCell>
                    <TableCell>
                      {split.backorders && split.backorders.length > 0 ? (
                        <Badge variant="warning">{split.backorders[0].quantityRemaining} Backordered</Badge>
                      ) : (
                        <Badge variant="success">Fully Stocked</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="success">Assigned</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>

        {/* Split Algorithm Result Banner */}
        {splitResult && (
          <Card style={{ backgroundColor: '#F0FDF4', borderColor: '#DCFCE7' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#15803D', fontSize: '13px' }}>
              <Check size={16} />
              <span>
                <strong>Split Executed Atomically:</strong> Stock deducted across warehouses via Prisma transaction. Shipment cost calculated with weight penalty.
              </span>
            </div>
          </Card>
        )}

        {/* Backorder Consolidation Note */}
        <div style={{ padding: '12px 16px', backgroundColor: '#FFFBEB', border: '1px solid #FEF3C7', borderRadius: '6px', fontSize: '12px', color: '#B45309', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={16} />
          <span>
            <strong>Backorder Consolidation:</strong> Backordered items will automatically consolidate and dispatch upon warehouse replenishment threshold trigger.
          </span>
        </div>
      </div>
    </InternalShell>
  )
}
