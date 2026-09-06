import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-guard'
import { UserRole } from '@prisma/client'
import { NextResponse } from 'next/server'

// GET /api/quotations/[id]/upsell-suggestions — Get upsell product recommendations
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { errorResponse } = await requireAuth([UserRole.REP, UserRole.MANAGER])
  if (errorResponse) return errorResponse

  try {
    const { id } = await params

    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: { lines: true },
    })

    if (!quotation) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 })
    }

    const sourceProductIds = quotation.lines.map((l) => l.productId)

    if (sourceProductIds.length === 0) {
      return NextResponse.json([])
    }

    const suggestions = await prisma.upsellRule.findMany({
      where: {
        sourceProductId: { in: sourceProductIds },
        suggestedProductId: { notIn: sourceProductIds },
      },
      include: {
        sourceProduct: true,
        suggestedProduct: {
          include: { category: true, variants: true },
        },
      },
      orderBy: [{ isPromoted: 'desc' }, { minMarginThreshold: 'desc' }],
    })

    return NextResponse.json(suggestions)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch upsell suggestions' }, { status: 500 })
  }
}
