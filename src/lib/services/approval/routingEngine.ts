import { prisma } from '@/lib/prisma'
import { calculateQuotationRiskScore } from '@/lib/services/quotation/riskScore'
import { logAudit } from '@/lib/services/audit/auditLog'
import { ApprovalLevel, ApprovalStatus, QuotationStatus, UserRole } from '@prisma/client'

export interface RoutingEngineResult {
  requiredLevel: ApprovalLevel | 'NONE'
  newStatus: QuotationStatus
  blendedRiskScore: number
  reasons: string[]
}

/**
 * Evaluates approval rules and routes quotation for approval.
 * Updates Quotation status and creates initial Approval entries.
 */
export async function routeQuotationForApproval(
  quotationId: string,
  submittingUserId: string
): Promise<RoutingEngineResult> {
  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
    include: {
      customer: true,
      lines: { include: { product: true } },
    },
  })

  if (!quotation) {
    throw new Error(`Quotation not found: ${quotationId}`)
  }

  if (quotation.status !== QuotationStatus.DRAFT && quotation.status !== QuotationStatus.REJECTED) {
    throw new Error(`Quotation cannot be submitted from status: ${quotation.status}`)
  }

  // 1. Compute Blended Risk Score
  const riskAnalysis = await calculateQuotationRiskScore(quotationId)
  const { blendedRiskScore, tierCeilingBreached, categoryCeilingBreached, maxLineDiscountPercent, reasons } = riskAnalysis

  // 2. Fetch configured approval chain thresholds
  const configs = await prisma.approvalChainConfig.findMany({
    orderBy: { minDiscountPercent: 'asc' },
  })

  let requiredLevel: ApprovalLevel | 'NONE' = 'NONE'

  // Determine required level based on discount thresholds & ceilings
  if (maxLineDiscountPercent >= 25 || tierCeilingBreached || categoryCeilingBreached || blendedRiskScore >= 50) {
    requiredLevel = ApprovalLevel.MANAGER_THEN_FINANCE
  } else if (maxLineDiscountPercent >= 15) {
    requiredLevel = ApprovalLevel.MANAGER
  }

  // Override by dynamic database configs if available
  for (const config of configs) {
    const minDisc = Number(config.minDiscountPercent)
    const maxDisc = Number(config.maxDiscountPercent)
    if (maxLineDiscountPercent >= minDisc && maxLineDiscountPercent <= maxDisc) {
      requiredLevel = config.requiredLevel
      break
    }
  }

  const newStatus = requiredLevel === 'NONE' ? QuotationStatus.APPROVED : QuotationStatus.PENDING_APPROVAL

  // Execute in transaction for atomicity
  await prisma.$transaction(async (tx) => {
    // Clear any previous approval records if re-submitting from REJECTED
    await tx.approval.deleteMany({
      where: { quotationId },
    })

    // Create approval records if routing is required
    if (requiredLevel === ApprovalLevel.MANAGER) {
      // Find a manager user
      const managerUser = await tx.user.findFirst({
        where: { role: UserRole.MANAGER },
      })

      if (managerUser) {
        await tx.approval.create({
          data: {
            quotationId,
            level: ApprovalLevel.MANAGER,
            approverId: managerUser.id,
            status: ApprovalStatus.PENDING,
          },
        })
      }
    } else if (requiredLevel === ApprovalLevel.MANAGER_THEN_FINANCE) {
      const managerUser = await tx.user.findFirst({
        where: { role: UserRole.MANAGER },
      })
      const financeUser = await tx.user.findFirst({
        where: { role: UserRole.FINANCE },
      })

      if (managerUser) {
        await tx.approval.create({
          data: {
            quotationId,
            level: ApprovalLevel.MANAGER,
            approverId: managerUser.id,
            status: ApprovalStatus.PENDING,
          },
        })
      }

      if (financeUser) {
        await tx.approval.create({
          data: {
            quotationId,
            level: ApprovalLevel.MANAGER_THEN_FINANCE,
            approverId: financeUser.id,
            status: ApprovalStatus.PENDING,
          },
        })
      }
    }

    // Update Quotation status & risk score
    await tx.quotation.update({
      where: { id: quotationId },
      data: {
        status: newStatus,
        blendedRiskScore,
      },
    })

    // Log Audit Trail
    await logAudit(
      {
        entityType: 'Quotation',
        entityId: quotationId,
        userId: submittingUserId,
        action: 'SUBMIT_FOR_APPROVAL',
        reason: `Submitted for approval. Required level: ${requiredLevel}. Risk score: ${blendedRiskScore}. ${reasons.join(' ')}`,
      },
      tx
    )
  })

  return {
    requiredLevel,
    newStatus,
    blendedRiskScore,
    reasons,
  }
}
