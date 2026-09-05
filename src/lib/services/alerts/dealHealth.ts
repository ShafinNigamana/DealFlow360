import { prisma } from '@/lib/prisma'
import { DealAlertType, DealAlertStatus, QuotationStatus } from '@prisma/client'

/**
 * Evaluates deal health and generates alerts for stalled, anomalous, or slipping deals.
 */
export async function evaluateDealHealthAlerts() {
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)

  // 1. Stalled Deals (Pending approval for > 3 days)
  const stalledQuotations = await prisma.quotation.findMany({
    where: {
      status: QuotationStatus.PENDING_APPROVAL,
      updatedAt: { lte: threeDaysAgo },
    },
  })

  for (const q of stalledQuotations) {
    const existing = await prisma.dealAlert.findFirst({
      where: { quotationId: q.id, type: DealAlertType.STALLED, status: DealAlertStatus.OPEN },
    })
    if (!existing) {
      await prisma.dealAlert.create({
        data: {
          quotationId: q.id,
          type: DealAlertType.STALLED,
          status: DealAlertStatus.OPEN,
        },
      })
    }
  }

  // 2. Anomaly Deals (Blended risk score >= 60.0)
  const riskyQuotations = await prisma.quotation.findMany({
    where: {
      blendedRiskScore: { gte: 60.0 },
      status: { in: [QuotationStatus.DRAFT, QuotationStatus.PENDING_APPROVAL] },
    },
  })

  for (const q of riskyQuotations) {
    const existing = await prisma.dealAlert.findFirst({
      where: { quotationId: q.id, type: DealAlertType.ANOMALY, status: DealAlertStatus.OPEN },
    })
    if (!existing) {
      await prisma.dealAlert.create({
        data: {
          quotationId: q.id,
          type: DealAlertType.ANOMALY,
          status: DealAlertStatus.OPEN,
        },
      })
    }
  }

  const openAlertsCount = await prisma.dealAlert.count({
    where: { status: DealAlertStatus.OPEN },
  })

  return { openAlertsCount }
}
