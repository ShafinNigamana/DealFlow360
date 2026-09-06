import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-guard'
import { recalculateQuotationLineTotal } from '@/lib/services/quotation/totals'
import { UserRole } from '@prisma/client'
import { NextResponse } from 'next/server'

// GET /api/quotations/[id]/lines — List lines for a quotation
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { errorResponse } = await requireAuth([UserRole.REP, UserRole.MANAGER])
  if (errorResponse) return errorResponse

  try {
    const { id } = await params

    const lines = await prisma.quotationLine.findMany({
      where: { quotationId: id },
      include: {
        product: { include: { category: true } },
        variant: true,
        subscriptionPlan: true,
      },
    })

    return NextResponse.json(lines)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch quotation lines' }, { status: 500 })
  }
}

// POST /api/quotations/[id]/lines — Add line item to a DRAFT quotation
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { errorResponse } = await requireAuth([UserRole.REP, UserRole.MANAGER])
  if (errorResponse) return errorResponse

  try {
    const { id: quotationId } = await params
    const body = await req.json()
    const { productId, variantId, subscriptionPlanId, quantity, unitDiscountPercent } = body

    if (!productId || quantity === undefined) {
      return NextResponse.json({ error: 'productId and quantity are required' }, { status: 400 })
    }

    const qty = Number(quantity)
    if (isNaN(qty) || qty <= 0) {
      return NextResponse.json({ error: 'quantity must be a positive integer' }, { status: 400 })
    }

    const quotation = await prisma.quotation.findUnique({ where: { id: quotationId } })
    if (!quotation) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 })
    }

    if (quotation.status !== 'DRAFT') {
      return NextResponse.json({ error: `Cannot modify lines for quotation in ${quotation.status} status` }, { status: 400 })
    }

    const discPct = unitDiscountPercent !== undefined ? Number(unitDiscountPercent) : 0
    const { lineTotal, margin } = await recalculateQuotationLineTotal(productId, variantId || null, qty, discPct)

    const line = await prisma.quotationLine.create({
      data: {
        quotationId,
        productId,
        variantId: variantId || null,
        subscriptionPlanId: subscriptionPlanId || null,
        quantity: qty,
        unitDiscountPercent: discPct,
        lineTotal,
        margin,
      },
      include: {
        product: true,
        variant: true,
        subscriptionPlan: true,
      },
    })

    return NextResponse.json(line, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to add quotation line' }, { status: 500 })
  }
}
