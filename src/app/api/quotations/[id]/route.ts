import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-guard'
import { NextResponse } from 'next/server'

// GET /api/quotations/[id] — Fetch single quotation with full details
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { errorResponse } = await requireAuth()
  if (errorResponse) return errorResponse

  try {
    const { id } = await params

    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        customer: {
          include: { tier: { include: { tierDiscountCeilings: true } } },
        },
        rep: { select: { id: true, name: true, email: true, role: true } },
        lines: {
          include: {
            product: { include: { category: { include: { categoryDiscountCeilings: true } } } },
            variant: true,
            subscriptionPlan: true,
          },
        },
        approvals: {
          include: { approver: { select: { id: true, name: true, role: true } } },
          orderBy: { createdAt: 'asc' },
        },
        warehouseSplits: {
          include: { warehouse: true, backorders: true },
        },
        negotiationComments: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!quotation) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 })
    }

    return NextResponse.json(quotation)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch quotation' }, { status: 500 })
  }
}

// PATCH /api/quotations/[id] — Update quotation customer
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { errorResponse } = await requireAuth()
  if (errorResponse) return errorResponse

  try {
    const { id } = await params
    const body = await req.json()

    const quotation = await prisma.quotation.findUnique({ where: { id } })
    if (!quotation) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 })
    }

    if (quotation.status !== 'DRAFT') {
      return NextResponse.json({ error: `Cannot edit quotation in ${quotation.status} status` }, { status: 400 })
    }

    const updateData: any = {}
    if (body.customerId !== undefined) updateData.customerId = body.customerId

    const updated = await prisma.quotation.update({
      where: { id },
      data: updateData,
      include: {
        customer: true,
        lines: true,
      },
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update quotation' }, { status: 500 })
  }
}

// DELETE /api/quotations/[id] — Delete DRAFT quotation
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { errorResponse } = await requireAuth()
  if (errorResponse) return errorResponse

  try {
    const { id } = await params

    const quotation = await prisma.quotation.findUnique({ where: { id } })
    if (!quotation) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 })
    }

    if (quotation.status !== 'DRAFT') {
      return NextResponse.json({ error: `Cannot delete quotation in ${quotation.status} status` }, { status: 400 })
    }

    await prisma.quotation.delete({ where: { id } })

    return NextResponse.json({ message: 'Quotation deleted successfully' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete quotation' }, { status: 500 })
  }
}
