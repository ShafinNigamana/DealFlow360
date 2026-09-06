import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-guard'
import { QuotationStatus, DealAlertStatus, UserRole } from '@prisma/client'
import { NextResponse } from 'next/server'

// GET /api/dashboard — Metrics & Executive Dashboard Aggregation
export async function GET() {
  const { errorResponse } = await requireAuth([UserRole.REP, UserRole.MANAGER, UserRole.FINANCE, UserRole.ADMIN])
  if (errorResponse) return errorResponse

  try {
    const [
      totalQuotations,
      draftCount,
      pendingApprovalCount,
      approvedCount,
      rejectedCount,
      fulfilledCount,
      openAlertsCount,
      recentQuotations,
    ] = await Promise.all([
      prisma.quotation.count(),
      prisma.quotation.count({ where: { status: QuotationStatus.DRAFT } }),
      prisma.quotation.count({ where: { status: QuotationStatus.PENDING_APPROVAL } }),
      prisma.quotation.count({ where: { status: QuotationStatus.APPROVED } }),
      prisma.quotation.count({ where: { status: QuotationStatus.REJECTED } }),
      prisma.quotation.count({ where: { status: QuotationStatus.FULFILLED } }),
      prisma.dealAlert.count({ where: { status: DealAlertStatus.OPEN } }),
      prisma.quotation.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { customer: true, rep: { select: { name: true } } },
      }),
    ])

    return NextResponse.json({
      summary: {
        totalQuotations,
        draftCount,
        pendingApprovalCount,
        approvedCount,
        rejectedCount,
        fulfilledCount,
        openAlertsCount,
      },
      recentQuotations,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch dashboard metrics' }, { status: 500 })
  }
}
