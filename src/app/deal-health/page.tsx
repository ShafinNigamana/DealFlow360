'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { InternalShell } from '@/components/shell/InternalShell'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from '@/components/ui/Table'
import { DealAlertDTO } from '@/types/api-contracts'
import { AlertCircle, Clock, AlertTriangle } from 'lucide-react'

export default function DealHealthPage() {
  const router = useRouter()
  const [alerts, setAlerts] = useState<DealAlertDTO[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchAlerts = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/deal-alerts')
      if (res.ok) setAlerts(await res.json())
    } catch (err: any) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAlerts()
  }, [])

  const handleUpdateAlertStatus = async (alertId: string, status: 'ACKNOWLEDGED' | 'ESCALATED') => {
    try {
      const res = await fetch(`/api/deal-alerts/${alertId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      if (!res.ok) throw new Error('Failed to update alert')
      fetchAlerts()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const stalledCount = alerts.filter((a) => a.type === 'STALLED').length
  const anomalyCount = alerts.filter((a) => a.type === 'ANOMALY').length
  const slippageCount = alerts.filter((a) => a.type === 'SLIPPAGE').length

  return (
    <InternalShell title="Deal Health & Anomaly Monitoring">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Three Alert Summary Tiles */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: '12px', color: '#71717A', fontWeight: 500 }}>Stalled Deals</span>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#18181B', marginTop: '4px' }}>
                  {stalledCount}
                </div>
              </div>
              <Clock size={20} color="#B45309" />
            </div>
          </Card>

          <Card>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: '12px', color: '#71717A', fontWeight: 500 }}>Discount Anomalies</span>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#18181B', marginTop: '4px' }}>
                  {anomalyCount}
                </div>
              </div>
              <AlertTriangle size={20} color="#B91C1C" />
            </div>
          </Card>

          <Card>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: '12px', color: '#71717A', fontWeight: 500 }}>Delivery Slippage</span>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#18181B', marginTop: '4px' }}>
                  {slippageCount}
                </div>
              </div>
              <AlertCircle size={20} color="#4F46E5" />
            </div>
          </Card>
        </div>

        {/* Flagged Alerts Table */}
        <Card style={{ padding: 0 }}>
          <CardHeader title="Automated Deal Anomaly & Risk Alerts" />
          {isLoading ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#71717A', fontSize: '13px' }}>Loading alerts...</div>
          ) : alerts.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#71717A', fontSize: '13px' }}>No active deal alerts found.</div>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Deal / Quote ID</TableHeaderCell>
                  <TableHeaderCell>Customer</TableHeaderCell>
                  <TableHeaderCell>Anomaly Issue</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell>Flagged Date</TableHeaderCell>
                  <TableHeaderCell>Actions</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {alerts.map((al) => (
                  <TableRow key={al.id}>
                    <TableCell style={{ fontWeight: 600, color: '#4F46E5' }}>
                      #{al.quotationId.slice(-6)}
                    </TableCell>
                    <TableCell style={{ fontWeight: 500 }}>{al.quotation?.customer?.name || 'Customer'}</TableCell>
                    <TableCell>
                      <Badge variant={al.type === 'ANOMALY' ? 'danger' : al.type === 'STALLED' ? 'warning' : 'accent'}>
                        {al.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{al.status}</TableCell>
                    <TableCell style={{ color: '#71717A', fontSize: '12px' }}>
                      {new Date(al.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {al.status === 'OPEN' && (
                          <>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleUpdateAlertStatus(al.id, 'ACKNOWLEDGED')}
                            >
                              Nudge Rep
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleUpdateAlertStatus(al.id, 'ESCALATED')}
                            >
                              Escalate
                            </Button>
                          </>
                        )}
                        {al.status !== 'OPEN' && (
                          <span style={{ fontSize: '11px', color: '#71717A' }}>{al.status}</span>
                        )}
                      </div>
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
