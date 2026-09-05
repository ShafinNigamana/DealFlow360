import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-guard'
import { recalculateQuotationLineTotal } from '@/lib/services/quotation/totals'
import { NextResponse } from 'next/server'

// PATCH /api/quotations/[id]/lines/[lineId] — Update quantity or discount on a line item
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; lineId: string }> }
) {
  const { errorResponse } = await requireAuth()
  if (errorResponse) return errorResponse

  try {
    const { id: quotationId, lineId } = await params
    const body = await req.json()

    const line = await prisma.quotationLine.findUnique({
      where: { id: lineId },
      include: { quotation: true },
    })

    if (!line || line.quotationId !== quotationId) {
      return NextResponse.json({ error: 'Quotation line not found' }, { status: 404 })
    }

    if (line.quotation.status !== 'DRAFT') {
      return NextResponse.json(
        { error: `Cannot modify lines for quotation in ${line.quotation.status} status` },
        { status: 400 }
      )
    }

    const qty = body.quantity !== undefined ? Number(body.quantity) : line.quantity
    const discPct = body.unitDiscountPercent !== undefined ? Number(body.unitDiscountPercent) : Number(line.unitDiscountPercent)
    const productId = body.productId || line.productId
    const variantId = body.variantId !== undefined ? body.variantId : line.variantId

    const { lineTotal, margin } = await recalculateQuotationLineTotal(productId, variantId, qty, discPct)

    const updatedLine = await prisma.quotationLine.update({
      where: { id: lineId },
      data: {
        quantity: qty,
        unitDiscountPercent: discPct,
        lineTotal,
        margin,
        variantId: variantId || null,
        subscriptionPlanId: body.subscriptionPlanId !== undefined ? body.subscriptionPlanId || null : line.subscriptionPlanId,
      },
      include: {
        product: true,
        variant: true,
        subscriptionPlan: true,
      },
    })

    return NextResponse.json(updatedLine)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update quotation line' }, { status: 500 })
  }
}

// DELETE /api/quotations/[id]/lines/[lineId] — Remove a line item
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; lineId: string }> }
) {
  const { errorResponse } = await requireAuth()
  if (errorResponse) return errorResponse

  try {
    const { id: quotationId, lineId } = await params

    const line = await prisma.quotationLine.findUnique({
      where: { id: lineId },
      include: { quotation: true },
    })

    if (!line || line.quotationId !== quotationId) {
      return NextResponse.json({ error: 'Quotation line not found' }, { status: 404 })
    }

    if (line.quotation.status !== 'DRAFT') {
      return NextResponse.json(
        { error: `Cannot delete lines for quotation in ${line.quotation.status} status` },
        { status: 400 }
      )
    }

    await prisma.quotationLine.delete({ where: { id: lineId } })

    return NextResponse.json({ message: 'Line item deleted' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete quotation line' }, { status: 500 })
  }
}
