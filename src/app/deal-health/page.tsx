'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { InternalShell } from '@/components/shell/InternalShell'
import { RoleGuard } from '@/components/auth/RoleGuard'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from '@/components/ui/Table'
import { DealAlertDTO } from '@/types/api-contracts'
import { Bell, ArrowUpRight } from 'lucide-react'
import { formatDisplayId } from '@/lib/formatters'

export default function DealHealthPage() {
  const router = useRouter()
  const [alerts, setAlerts] = useState<DealAlertDTO[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchAlerts = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/deal-alerts')
      if (res.ok) {
        setAlerts(await res.json())
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAlerts()
  }, [])

  const handleUpdateAlertStatus = async (alertId: string, status: 'ACKNOWLEDGED' | 'RESOLVED') => {
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

  const stalledCount = alerts.filter((a) => a.type === 'STALLED' && a.status === 'OPEN').length
  const anomalyCount = alerts.filter((a) => a.type === 'ANOMALY' && a.status === 'OPEN').length
  const slippageCount = alerts.filter((a) => a.type === 'SLIPPAGE' && a.status === 'OPEN').length

  return (
    <InternalShell title="Deal Health & Risk Anomalies">
      <RoleGuard allowedRoles={['REP', 'MANAGER', 'ADMIN']}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Header Description */}
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ink-900)' }}>
              Proactive Deal Anomaly Monitoring
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '1px' }}>
              Detect stalled negotiations, discount ceiling anomalies, and fulfillment slippage before revenue impact
            </p>
          </div>

          {/* Metric Cards (Dense technical containers) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            <div
              style={{
                backgroundColor: 'var(--surface-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '4px',
                padding: '12px 14px',
              }}
            >
              <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Stalled Pipeline Deals
              </span>
              <div style={{ fontSize: '26px', fontWeight: 800, color: stalledCount > 0 ? 'var(--copper-600)' : 'var(--ink-900)', marginTop: '4px', fontVariantNumeric: 'tabular-nums' }}>
                {stalledCount}
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
                Discount Anomalies
              </span>
              <div style={{ fontSize: '26px', fontWeight: 800, color: anomalyCount > 0 ? 'var(--status-rejected)' : 'var(--ink-900)', marginTop: '4px', fontVariantNumeric: 'tabular-nums' }}>
                {anomalyCount}
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
                Delivery Slippage
              </span>
              <div style={{ fontSize: '26px', fontWeight: 800, color: slippageCount > 0 ? 'var(--status-info)' : 'var(--ink-900)', marginTop: '4px', fontVariantNumeric: 'tabular-nums' }}>
                {slippageCount}
              </div>
            </div>
          </div>

          {/* Flagged Alerts Table */}
          <Card style={{ padding: 0 }}>
            {isLoading ? (
              <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '12.5px' }}>Loading alerts...</div>
            ) : alerts.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '12.5px' }}>No active deal alerts found.</div>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell style={{ width: '130px' }}>Quote Ref</TableHeaderCell>
                    <TableHeaderCell>Account / Customer</TableHeaderCell>
                    <TableHeaderCell>Anomaly Issue</TableHeaderCell>
                    <TableHeaderCell>Status</TableHeaderCell>
                    <TableHeaderCell align="right">Flagged Date</TableHeaderCell>
                    <TableHeaderCell align="center" style={{ width: '220px' }}>Resolution Actions</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {alerts.map((al) => (
                    <TableRow key={al.id}>
                      <TableCell style={{ fontWeight: 700, color: 'var(--ink-900)', fontFamily: 'ui-monospace, monospace', fontSize: '12px' }}>
                        <span
                          onClick={() => router.push(`/quotations/${al.quotationId}`)}
                          style={{ cursor: 'pointer' }}
                        >
                          #{formatDisplayId(al.quotationId)}
                        </span>
                      </TableCell>
                      <TableCell style={{ fontWeight: 600, color: 'var(--ink-900)' }}>
                        {al.quotation?.customer?.name || 'Customer'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={al.type === 'ANOMALY' ? 'danger' : al.type === 'STALLED' ? 'warning' : 'neutral'}>
                          {al.type?.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell style={{ color: 'var(--text-secondary)' }}>{al.status}</TableCell>
                      <TableCell align="right" style={{ color: 'var(--text-secondary)', fontSize: '11.5px', fontVariantNumeric: 'tabular-nums' }}>
                        {new Date(al.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </TableCell>
                      <TableCell align="center">
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          {al.status === 'OPEN' && (
                            <>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleUpdateAlertStatus(al.id, 'ACKNOWLEDGED')}
                              >
                                Acknowledge
                              </Button>
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleUpdateAlertStatus(al.id, 'RESOLVED')}
                              >
                                Resolve
                              </Button>
                            </>
                          )}
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => router.push(`/quotations/${al.quotationId}`)}
                          >
                            <ArrowUpRight size={11} /> Open
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </div>
      </RoleGuard>
    </InternalShell>
  )
}
