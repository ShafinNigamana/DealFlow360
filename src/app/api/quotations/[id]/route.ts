import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-guard'
import { UserRole } from '@prisma/client'
import { NextResponse } from 'next/server'

const INTERNAL_ROLES = [UserRole.REP, UserRole.MANAGER, UserRole.FINANCE, UserRole.ADMIN]

// GET /api/quotations/[id] — Fetch single quotation with full details
// Hybrid: internal roles see any quotation; CUSTOMER role sees only their own
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { errorResponse, session } = await requireAuth()
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

    // CUSTOMER can only view their own quotation
    const role = session!.user.role
    if (role === 'CUSTOMER' && quotation.customerId !== session!.user.id) {
      return NextResponse.json({ error: 'Forbidden: You can only view your own quotations' }, { status: 403 })
    }

    return NextResponse.json(quotation)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch quotation' }, { status: 500 })
  }
}

// PATCH /api/quotations/[id] — Update quotation (customer, status transitions)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { errorResponse } = await requireAuth([UserRole.REP, UserRole.MANAGER, UserRole.FINANCE])
  if (errorResponse) return errorResponse

  try {
    const { id } = await params
    const body = await req.json()

    const quotation = await prisma.quotation.findUnique({ where: { id } })
    if (!quotation) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 })
    }

    const updateData: any = {}

    // Status transitions (e.g., customer confirms an APPROVED quote)
    if (body.status !== undefined) {
      const allowedTransitions: Record<string, string[]> = {
        APPROVED: ['CONFIRMED'],
        CONFIRMED: ['FULFILLED'],
        DRAFT: ['CANCELLED'],
        SENT: ['CANCELLED'],
      }
      const allowed = allowedTransitions[quotation.status] || []
      if (!allowed.includes(body.status)) {
        return NextResponse.json(
          { error: `Cannot transition quotation from ${quotation.status} to ${body.status}` },
          { status: 400 }
        )
      }
      updateData.status = body.status
    }

    // Structural field edits only allowed in DRAFT
    if (body.customerId !== undefined) {
      if (quotation.status !== 'DRAFT') {
        return NextResponse.json({ error: `Cannot edit quotation in ${quotation.status} status` }, { status: 400 })
      }
      updateData.customerId = body.customerId
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

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
  const { errorResponse } = await requireAuth([UserRole.REP, UserRole.MANAGER])
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

