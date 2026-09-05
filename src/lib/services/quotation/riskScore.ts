import { prisma } from '@/lib/prisma'

export interface RiskAnalysisResult {
  blendedRiskScore: number
  tierCeilingBreached: boolean
  categoryCeilingBreached: boolean
  maxLineDiscountPercent: number
  avgDiscountPercent: number
  reasons: string[]
}

/**
 * Calculates the blended risk score for a quotation.
 * Returns a score between 0.00 (low risk) and 100.00 (high risk) along with diagnostic reasons.
 */
export async function calculateQuotationRiskScore(quotationId: string): Promise<RiskAnalysisResult> {
  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
    include: {
      customer: {
        include: {
          tier: {
            include: {
              tierDiscountCeilings: true,
            },
          },
        },
      },
      lines: {
        include: {
          product: {
            include: {
              category: {
                include: {
                  categoryDiscountCeilings: true,
                },
              },
            },
          },
        },
      },
    },
  })

  if (!quotation) {
    throw new Error(`Quotation not found: ${quotationId}`)
  }

  const reasons: string[] = []
  let discountRiskScore = 0
  let ceilingViolationRiskScore = 0
  let customerTierRiskScore = 0

  let tierCeilingBreached = false
  let categoryCeilingBreached = false
  let maxLineDiscountPercent = 0
  let totalDiscountSum = 0

  const lineCount = quotation.lines.length

  if (lineCount > 0) {
    for (const line of quotation.lines) {
      const discPct = Number(line.unitDiscountPercent)
      totalDiscountSum += discPct

      if (discPct > maxLineDiscountPercent) {
        maxLineDiscountPercent = discPct
      }

      // Check Tier Discount Ceiling
      const tierCeiling = quotation.customer?.tier?.tierDiscountCeilings[0]
      if (tierCeiling) {
        const maxTierDisc = Number(tierCeiling.maxDiscountPercent)
        if (discPct > maxTierDisc) {
          tierCeilingBreached = true
          const excess = discPct - maxTierDisc
          ceilingViolationRiskScore += 25 + excess * 2
          reasons.push(
            `Line item "${line.product.name}" discount (${discPct}%) exceeds customer tier ceiling (${maxTierDisc}%).`
          )
        }
      }

      // Check Category Discount Ceiling
      const categoryCeiling = line.product.category?.categoryDiscountCeilings[0]
      if (categoryCeiling) {
        const maxCatDisc = Number(categoryCeiling.maxDiscountPercent)
        if (discPct > maxCatDisc) {
          categoryCeilingBreached = true
          const excess = discPct - maxCatDisc
          ceilingViolationRiskScore += 25 + excess * 2
          reasons.push(
            `Line item "${line.product.name}" discount (${discPct}%) exceeds category ceiling for ${line.product.category.name} (${maxCatDisc}%).`
          )
        }
      }
    }

    const avgDiscountPercent = totalDiscountSum / lineCount

    // Discount magnitude component (0-100 scale, maps 0-50% avg discount to 0-100 score)
    discountRiskScore = Math.min(100, avgDiscountPercent * 2)
  }

  // Customer Tier base risk component
  const tierName = quotation.customer?.tier?.name
  switch (tierName) {
    case 'BRONZE':
      customerTierRiskScore = 20
      break
    case 'SILVER':
      customerTierRiskScore = 10
      break
    case 'GOLD':
      customerTierRiskScore = 5
      break
    case 'PLATINUM':
      customerTierRiskScore = 0
      break
    default:
      customerTierRiskScore = 30
      reasons.push('Customer has no assigned customer tier (assigned highest baseline risk).')
      break
  }

  // Blended composite score formula: 40% discount magnitude + 40% ceiling violations + 20% tier baseline
  const rawBlendedScore =
    discountRiskScore * 0.4 +
    Math.min(100, ceilingViolationRiskScore) * 0.4 +
    customerTierRiskScore * 0.2

  const blendedRiskScore = Math.min(100, Math.max(0, Math.round(rawBlendedScore * 100) / 100))

  return {
    blendedRiskScore,
    tierCeilingBreached,
    categoryCeilingBreached,
    maxLineDiscountPercent,
    avgDiscountPercent: lineCount > 0 ? Math.round((totalDiscountSum / lineCount) * 100) / 100 : 0,
    reasons,
  }
}
