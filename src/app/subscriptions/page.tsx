'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { InternalShell } from '@/components/shell/InternalShell'
import { RoleGuard } from '@/components/auth/RoleGuard'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from '@/components/ui/Table'
import { SubscriptionDTO } from '@/types/api-contracts'
import { formatDisplayId } from '@/lib/formatters'

export default function SubscriptionsPage() {
  const router = useRouter()
  const [subscriptions, setSubscriptions] = useState<SubscriptionDTO[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchSubscriptions = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/subscriptions')
      if (res.ok) {
        setSubscriptions(await res.json())
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSubscriptions()
  }, [])

  const activeCount = subscriptions.filter((s) => s.status === 'ACTIVE').length
  const pausedCount = subscriptions.filter((s) => s.status === 'PAUSED').length
  const cancelledCount = subscriptions.filter((s) => s.status === 'CANCELLED').length

  return (
    <InternalShell title="Subscriptions Governance">
      <RoleGuard allowedRoles={['REP', 'MANAGER', 'FINANCE', 'ADMIN']}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Header Description */}
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ink-900)' }}>
              Recurring Contract Governance
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '1px' }}>
              Manage subscription lifecycle, cadences, mid-cycle prorations, and refund schedules
            </p>
          </div>

          {/* Metric Header (Dense technical cards) */}
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
                Active Subscriptions
              </span>
              <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--status-approved)', marginTop: '4px', fontVariantNumeric: 'tabular-nums' }}>
                {activeCount}
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
                Paused / In Review
              </span>
              <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--copper-600)', marginTop: '4px', fontVariantNumeric: 'tabular-nums' }}>
                {pausedCount}
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
                Cancelled / Ended
              </span>
              <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--status-rejected)', marginTop: '4px', fontVariantNumeric: 'tabular-nums' }}>
                {cancelledCount}
              </div>
            </div>
          </div>

          {/* Subscriptions Table */}
          <Card style={{ padding: 0 }}>
            {isLoading ? (
              <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '12.5px' }}>
                Loading subscription records...
              </div>
            ) : subscriptions.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '12.5px' }}>
                No active subscriptions found.
              </div>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell style={{ width: '130px' }}>Subscription #</TableHeaderCell>
                    <TableHeaderCell>Plan Name</TableHeaderCell>
                    <TableHeaderCell>Cadence</TableHeaderCell>
                    <TableHeaderCell>Proration Rule</TableHeaderCell>
                    <TableHeaderCell>Status</TableHeaderCell>
                    <TableHeaderCell align="right">Start Date</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {subscriptions.map((sub) => (
                    <TableRow key={sub.id} onClick={() => router.push(`/subscriptions/${sub.id}`)}>
                      <TableCell style={{ fontWeight: 700, color: 'var(--ink-900)', fontFamily: 'ui-monospace, monospace', fontSize: '12px' }}>
                        #{formatDisplayId(sub.id)}
                      </TableCell>
                      <TableCell style={{ fontWeight: 600, color: 'var(--ink-900)' }}>
                        {sub.plan?.name || 'SaaS Enterprise'}
                      </TableCell>
                      <TableCell style={{ color: 'var(--text-secondary)' }}>{sub.plan?.cadence || 'MONTHLY'}</TableCell>
                      <TableCell style={{ color: 'var(--text-secondary)' }}>{sub.plan?.prorationRule || 'Prorate'}</TableCell>
                      <TableCell>
                        <Badge variant={sub.status === 'ACTIVE' ? 'success' : sub.status === 'PAUSED' ? 'warning' : 'danger'}>
                          {sub.status}
                        </Badge>
                      </TableCell>
                      <TableCell align="right" style={{ color: 'var(--text-secondary)', fontSize: '11.5px', fontVariantNumeric: 'tabular-nums' }}>
                        {new Date(sub.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
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
