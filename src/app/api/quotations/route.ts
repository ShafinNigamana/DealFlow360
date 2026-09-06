import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-guard'
import { UserRole, QuotationStatus } from '@prisma/client'
import { NextResponse } from 'next/server'

// GET /api/quotations — List quotations (filtered by role / query params)
export async function GET(req: Request) {
  const { errorResponse, session } = await requireAuth([UserRole.REP, UserRole.MANAGER, UserRole.FINANCE, UserRole.ADMIN])
  if (errorResponse) return errorResponse

  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') as QuotationStatus | null
    const customerId = searchParams.get('customerId')
    const repId = searchParams.get('repId')

    const where: any = {}

    // Role-based visibility scoping
    if (session.user.role === UserRole.REP) {
      where.repId = session.user.id
    } else if (repId) {
      where.repId = repId
    }

    if (status) where.status = status
    if (customerId) where.customerId = customerId

    const quotations = await prisma.quotation.findMany({
      where,
      include: {
        customer: true,
        rep: {
          select: { id: true, name: true, email: true, role: true },
        },
        lines: {
          include: {
            product: true,
            variant: true,
            subscriptionPlan: true,
          },
        },
        approvals: {
          include: {
            approver: { select: { id: true, name: true, role: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(quotations)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch quotations' }, { status: 500 })
  }
}

// POST /api/quotations — Create a new Quotation in DRAFT status
export async function POST(req: Request) {
  const { errorResponse, session } = await requireAuth([UserRole.REP, UserRole.MANAGER])
  if (errorResponse) return errorResponse

  try {
    const body = await req.json()
    const { customerId } = body

    if (!customerId) {
      return NextResponse.json({ error: 'customerId is required' }, { status: 400 })
    }

    const quotation = await prisma.quotation.create({
      data: {
        customerId,
        repId: session.user.id,
        status: QuotationStatus.DRAFT,
        blendedRiskScore: 0,
      },
      include: {
        customer: true,
        rep: { select: { id: true, name: true, email: true } },
      },
    })

    return NextResponse.json(quotation, { status: 201 })
  } catch (error: any) {
    if (error.code === 'P2003') {
      return NextResponse.json({ error: 'Customer not found' }, { status: 400 })
    }
    return NextResponse.json({ error: error.message || 'Failed to create quotation' }, { status: 500 })
  }
}
