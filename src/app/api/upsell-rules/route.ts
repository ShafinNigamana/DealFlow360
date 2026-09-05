import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-guard'
import { UserRole } from '@prisma/client'
import { NextResponse } from 'next/server'

// GET /api/upsell-rules — List upsell rules
export async function GET() {
  try {
    const rules = await prisma.upsellRule.findMany({
      include: {
        sourceProduct: true,
        suggestedProduct: true,
      },
    })

    return NextResponse.json(rules)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch upsell rules' }, { status: 500 })
  }
}

// POST /api/upsell-rules — Create upsell rule (ADMIN/MANAGER)
export async function POST(req: Request) {
  const { errorResponse } = await requireAuth([UserRole.ADMIN, UserRole.MANAGER])
  if (errorResponse) return errorResponse

  try {
    const body = await req.json()
    const { sourceProductId, suggestedProductId, isPromoted, minMarginThreshold } = body

    if (!sourceProductId || !suggestedProductId) {
      return NextResponse.json({ error: 'sourceProductId and suggestedProductId are required' }, { status: 400 })
    }

    const rule = await prisma.upsellRule.create({
      data: {
        sourceProductId,
        suggestedProductId,
        isPromoted: Boolean(isPromoted),
        minMarginThreshold: minMarginThreshold !== undefined ? Number(minMarginThreshold) : 0,
      },
      include: {
        sourceProduct: true,
        suggestedProduct: true,
      },
    })

    return NextResponse.json(rule, { status: 201 })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Upsell rule for these products already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message || 'Failed to create upsell rule' }, { status: 500 })
  }
}
