'use client'

import React, { useState } from 'react'
import { InternalShell } from '@/components/shell/InternalShell'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Input'
import { Download, BarChart2 } from 'lucide-react'

export default function AdminReportsPage() {
  const [period, setPeriod] = useState('30d')
  const [team, setTeam] = useState('all')

  const handleExportCSV = () => {
    alert(`Exporting DealFlow360 operations report for period: ${period}, team: ${team} (CSV format)`)
  }

  const handleExportPDF = () => {
    alert(`Generating PDF summary report for period: ${period}...`)
  }

  return (
    <InternalShell title="Reporting & Analytics Dashboard">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Filter Controls Row */}
        <Card>
          <CardHeader title="Report Scope & Filters" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '12px', alignItems: 'flex-end' }}>
            <Select
              label="Time Period"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              options={[
                { label: 'Last 7 Days', value: '7d' },
                { label: 'Last 30 Days', value: '30d' },
                { label: 'Last Quarter (90d)', value: '90d' },
                { label: 'Year to Date', value: 'ytd' },
              ]}
            />
            <Select
              label="Sales Team"
              value={team}
              onChange={(e) => setTeam(e.target.value)}
              options={[
                { label: 'All Teams', value: 'all' },
                { label: 'Enterprise Sales', value: 'enterprise' },
                { label: 'Mid-Market Sales', value: 'midmarket' },
              ]}
            />
            <Select
              label="Approval Status"
              options={[
                { label: 'All Statuses', value: 'all' },
                { label: 'Approved Only', value: 'APPROVED' },
                { label: 'Pending Only', value: 'PENDING' },
              ]}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button variant="secondary" onClick={handleExportCSV}>
                <Download size={14} /> Export CSV
              </Button>
              <Button variant="primary" onClick={handleExportPDF}>
                <BarChart2 size={14} /> Export PDF Summary
              </Button>
            </div>
          </div>
        </Card>

        {/* Analytics Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          <Card>
            <span style={{ fontSize: '12px', color: '#71717A', fontWeight: 500 }}>Total Quotations Created</span>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#18181B', marginTop: '4px' }}>128</div>
            <span style={{ fontSize: '11px', color: '#15803D' }}>↑ 12% vs previous period</span>
          </Card>
          <Card>
            <span style={{ fontSize: '12px', color: '#71717A', fontWeight: 500 }}>Avg Approval Turnaround</span>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#4F46E5', marginTop: '4px' }}>4.2 hrs</div>
            <span style={{ fontSize: '11px', color: '#71717A' }}>Target &lt; 6 hrs</span>
          </Card>
          <Card>
            <span style={{ fontSize: '12px', color: '#71717A', fontWeight: 500 }}>Top Upsell Product</span>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#18181B', marginTop: '4px' }}>
              Premium Support SLA
            </div>
            <span style={{ fontSize: '11px', color: '#15803D' }}>45% adoption rate</span>
          </Card>
        </div>
      </div>
    </InternalShell>
  )
}
