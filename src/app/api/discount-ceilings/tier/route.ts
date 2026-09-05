import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-guard'
import { UserRole } from '@prisma/client'
import { NextResponse } from 'next/server'

// GET /api/discount-ceilings/tier — List all tier discount ceilings
export async function GET() {
  try {
    const ceilings = await prisma.tierDiscountCeiling.findMany({
      include: { tier: true },
      orderBy: { maxDiscountPercent: 'asc' },
    })

    return NextResponse.json(ceilings)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch tier discount ceilings' }, { status: 500 })
  }
}

// POST /api/discount-ceilings/tier — Upsert tier discount ceiling (ADMIN/MANAGER/FINANCE)
export async function POST(req: Request) {
  const { errorResponse } = await requireAuth([UserRole.ADMIN, UserRole.MANAGER, UserRole.FINANCE])
  if (errorResponse) return errorResponse

  try {
    const body = await req.json()
    const { tierId, maxDiscountPercent } = body

    if (!tierId || maxDiscountPercent === undefined) {
      return NextResponse.json({ error: 'tierId and maxDiscountPercent are required' }, { status: 400 })
    }

    const discount = Number(maxDiscountPercent)
    if (isNaN(discount) || discount < 0 || discount > 100) {
      return NextResponse.json({ error: 'maxDiscountPercent must be between 0 and 100' }, { status: 400 })
    }

    const ceiling = await prisma.tierDiscountCeiling.upsert({
      where: { tierId },
      update: { maxDiscountPercent: discount },
      create: { tierId, maxDiscountPercent: discount },
      include: { tier: true },
    })

    return NextResponse.json(ceiling, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to set tier discount ceiling' }, { status: 500 })
  }
}
