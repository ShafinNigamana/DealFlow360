'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { InternalShell } from '@/components/shell/InternalShell'
import { RoleGuard } from '@/components/auth/RoleGuard'
import { Card, CardHeader } from '@/components/ui/Card'
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
      if (res.ok) setSubscriptions(await res.json())
    } catch (err: any) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSubscriptions()
  }, [])

  return (
    <InternalShell title="Subscriptions Governance">
      <RoleGuard allowedRoles={['FINANCE', 'ADMIN']}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Metric Header */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          <Card>
            <span style={{ fontSize: '12px', color: '#71717A', fontWeight: 500 }}>Active Subscriptions</span>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#15803D', marginTop: '4px' }}>
              {subscriptions.filter((s) => s.status === 'ACTIVE').length}
            </div>
          </Card>
          <Card>
            <span style={{ fontSize: '12px', color: '#71717A', fontWeight: 500 }}>Paused / Pending</span>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#B45309', marginTop: '4px' }}>
              {subscriptions.filter((s) => s.status === 'PAUSED').length}
            </div>
          </Card>
          <Card>
            <span style={{ fontSize: '12px', color: '#71717A', fontWeight: 500 }}>Cancelled</span>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#B91C1C', marginTop: '4px' }}>
              {subscriptions.filter((s) => s.status === 'CANCELLED').length}
            </div>
          </Card>
        </div>

        {/* Subscriptions Table */}
        <Card style={{ padding: 0 }}>
          <CardHeader title="Subscription Contracts & Cadence" />
          {isLoading ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#71717A', fontSize: '13px' }}>Loading subscriptions...</div>
          ) : subscriptions.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#71717A', fontSize: '13px' }}>No active subscriptions found.</div>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Subscription ID</TableHeaderCell>
                  <TableHeaderCell>Plan</TableHeaderCell>
                  <TableHeaderCell>Cadence</TableHeaderCell>
                  <TableHeaderCell>Proration Rule</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell>Start Date</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {subscriptions.map((sub) => (
                  <TableRow key={sub.id} onClick={() => router.push(`/subscriptions/${sub.id}`)}>
                    <TableCell style={{ fontWeight: 600, color: '#4F46E5' }}>#{formatDisplayId(sub.id)}</TableCell>
                    <TableCell style={{ fontWeight: 500 }}>{sub.plan?.name || 'SaaS Enterprise'}</TableCell>
                    <TableCell>{sub.plan?.cadence || 'MONTHLY'}</TableCell>
                    <TableCell>{sub.plan?.prorationRule || 'Prorate'}</TableCell>
                    <TableCell>
                      <Badge variant={sub.status === 'ACTIVE' ? 'success' : sub.status === 'PAUSED' ? 'warning' : 'danger'}>
                        {sub.status}
                      </Badge>
                    </TableCell>
                    <TableCell style={{ color: '#71717A', fontSize: '12px' }}>
                      {new Date(sub.startDate).toLocaleDateString()}
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
