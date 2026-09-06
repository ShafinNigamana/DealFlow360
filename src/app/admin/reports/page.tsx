'use client'

import React, { useEffect, useState } from 'react'
import { InternalShell } from '@/components/shell/InternalShell'
import { RoleGuard } from '@/components/auth/RoleGuard'
import { Card, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { DashboardMetricsResponse } from '@/types/api-contracts'
import { BarChart2, FileText, CheckCircle, AlertTriangle } from 'lucide-react'

export default function AdminReportsPage() {
  const [data, setData] = useState<DashboardMetricsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchReportData = async () => {
      setIsLoading(true)
      try {
        const res = await fetch('/api/dashboard')
        if (!res.ok) throw new Error('Failed to fetch report data')
        const json = await res.json()
        setData(json)
      } catch (err: any) {
        setError(err.message || 'An error occurred')
      } finally {
        setIsLoading(false)
      }
    }
    fetchReportData()
  }, [])

  const s = data?.summary

  return (
    <InternalShell title="Reporting & Analytics Dashboard">
      <RoleGuard allowedRoles={['ADMIN', 'MANAGER']}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {error && (
          <div style={{ padding: '12px', borderRadius: '6px', backgroundColor: '#FEF2F2', color: '#B91C1C', fontSize: '13px' }}>
            {error}
          </div>
        )}

        {/* KPI Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '6px', backgroundColor: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={18} color="#4F46E5" />
              </div>
              <div>
                <span style={{ fontSize: '12px', color: '#71717A', fontWeight: 500 }}>Total Quotations</span>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#18181B' }}>
                  {isLoading ? '...' : s?.totalQuotations ?? 0}
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '6px', backgroundColor: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle size={18} color="#B45309" />
              </div>
              <div>
                <span style={{ fontSize: '12px', color: '#71717A', fontWeight: 500 }}>Pending Approvals</span>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#B45309' }}>
                  {isLoading ? '...' : s?.pendingApprovalCount ?? 0}
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '6px', backgroundColor: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BarChart2 size={18} color="#15803D" />
              </div>
              <div>
                <span style={{ fontSize: '12px', color: '#71717A', fontWeight: 500 }}>Approved Deals</span>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#15803D' }}>
                  {isLoading ? '...' : s?.approvedCount ?? 0}
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '6px', backgroundColor: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={18} color="#B91C1C" />
              </div>
              <div>
                <span style={{ fontSize: '12px', color: '#71717A', fontWeight: 500 }}>Open Alerts</span>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#B91C1C' }}>
                  {isLoading ? '...' : s?.openAlertsCount ?? 0}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Pipeline Breakdown */}
        <Card>
          <CardHeader title="Pipeline Status Breakdown" subtitle="Current distribution of quotations across lifecycle stages" />
          {isLoading ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#71717A', fontSize: '13px' }}>
              Loading pipeline data...
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', padding: '16px' }}>
              {[
                { label: 'Draft', count: s?.draftCount ?? 0, variant: 'neutral' as const },
                { label: 'Pending Approval', count: s?.pendingApprovalCount ?? 0, variant: 'warning' as const },
                { label: 'Approved', count: s?.approvedCount ?? 0, variant: 'success' as const },
                { label: 'Rejected', count: s?.rejectedCount ?? 0, variant: 'danger' as const },
                { label: 'Fulfilled', count: s?.fulfilledCount ?? 0, variant: 'accent' as const },
              ].map((stage) => (
                <div
                  key={stage.label}
                  style={{
                    padding: '16px',
                    borderRadius: '8px',
                    border: '1px solid #E4E4E7',
                    textAlign: 'center',
                  }}
                >
                  <Badge variant={stage.variant}>{stage.label}</Badge>
                  <div style={{ fontSize: '28px', fontWeight: 700, color: '#18181B', marginTop: '8px' }}>
                    {stage.count}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
      </RoleGuard>
    </InternalShell>
  )
}
