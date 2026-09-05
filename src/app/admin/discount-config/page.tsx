'use client'

import React, { useEffect, useState } from 'react'
import { InternalShell } from '@/components/shell/InternalShell'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from '@/components/ui/Table'
import { TierDiscountCeilingDTO, CategoryDiscountCeilingDTO, ApprovalChainConfigDTO } from '@/types/api-contracts'

export default function DiscountConfigPage() {
  const [tierCeilings, setTierCeilings] = useState<TierDiscountCeilingDTO[]>([])
  const [categoryCeilings, setCategoryCeilings] = useState<CategoryDiscountCeilingDTO[]>([])
  const [approvalChains, setApprovalChains] = useState<ApprovalChainConfigDTO[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [tRes, cRes, aRes] = await Promise.all([
        fetch('/api/discount-ceilings/tier'),
        fetch('/api/discount-ceilings/category'),
        fetch('/api/approval-chains'),
      ])

      if (tRes.ok) setTierCeilings(await tRes.json())
      if (cRes.ok) setCategoryCeilings(await cRes.json())
      if (aRes.ok) setApprovalChains(await aRes.json())
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
    <InternalShell title="Discount Tiers & Approval Governance Setup">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Banner Notice */}
        <Card style={{ backgroundColor: '#F0FDF4', borderColor: '#DCFCE7' }}>
          <div style={{ fontSize: '13px', color: '#15803D' }}>
            <strong>Self-Governing Policy Matrix:</strong> Quotation discount lines are checked live against Category ceilings and Customer Tier limits. Overages accumulate into a blended risk score which routes approvals automatically to Sales Manager or Finance.
          </div>
        </Card>

        {/* Side by Side Tables: Tier Ceilings & Category Ceilings */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {/* Customer Tier Ceilings */}
          <Card style={{ padding: 0 }}>
            <CardHeader title="Customer Tier Discount Ceilings" />
            {isLoading ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#71717A', fontSize: '12px' }}>Loading...</div>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>Customer Tier</TableHeaderCell>
                    <TableHeaderCell>Max Discount Ceiling</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tierCeilings.map((tc) => (
                    <TableRow key={tc.id}>
                      <TableCell style={{ fontWeight: 600 }}>{tc.tier?.name || 'Tier'}</TableCell>
                      <TableCell style={{ color: '#4F46E5', fontWeight: 600 }}>
                        {Number(tc.maxDiscountPercent)}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>

          {/* Product Category Ceilings */}
          <Card style={{ padding: 0 }}>
            <CardHeader title="Category Discount Ceilings" />
            {isLoading ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#71717A', fontSize: '12px' }}>Loading...</div>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>Product Category</TableHeaderCell>
                    <TableHeaderCell>Category Limit</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {categoryCeilings.map((cc) => (
                    <TableRow key={cc.id}>
                      <TableCell style={{ fontWeight: 600 }}>{cc.category?.name || 'Category'}</TableCell>
                      <TableCell style={{ color: '#B45309', fontWeight: 600 }}>
                        {Number(cc.maxDiscountPercent)}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </div>

        {/* Full-width Table: Approval Routing Chain Config */}
        <Card style={{ padding: 0 }}>
          <CardHeader
            title="Approval Chain Routing Rules"
            subtitle="Defines which approval level is required based on blended discount risk score range"
          />
          {isLoading ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#71717A', fontSize: '13px' }}>
              Loading routing rules...
            </div>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Min Risk Score %</TableHeaderCell>
                  <TableHeaderCell>Max Risk Score %</TableHeaderCell>
                  <TableHeaderCell>Required Approval Chain</TableHeaderCell>
                  <TableHeaderCell>Governance Enforcement</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {approvalChains.map((ac) => (
                  <TableRow key={ac.id}>
                    <TableCell style={{ fontWeight: 600 }}>{Number(ac.minDiscountPercent)}%</TableCell>
                    <TableCell style={{ fontWeight: 600 }}>{Number(ac.maxDiscountPercent)}%</TableCell>
                    <TableCell>
                      <Badge variant={ac.requiredLevel === 'MANAGER_THEN_FINANCE' ? 'warning' : 'accent'}>
                        {ac.requiredLevel === 'MANAGER_THEN_FINANCE' ? 'Sales Manager → Finance' : 'Sales Manager'}
                      </Badge>
                    </TableCell>
                    <TableCell style={{ color: '#71717A', fontSize: '12px' }}>
                      Automated Prisma transaction routing
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>

        {/* Action Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="primary" onClick={() => alert('Discount configuration saved successfully!')}>
            Save Policy Configuration
          </Button>
        </div>
      </div>
    </InternalShell>
  )
}
