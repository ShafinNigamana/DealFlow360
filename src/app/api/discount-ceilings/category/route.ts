import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-guard'
import { UserRole } from '@prisma/client'
import { NextResponse } from 'next/server'

// GET /api/discount-ceilings/category — List all category discount ceilings
export async function GET() {
  try {
    const ceilings = await prisma.categoryDiscountCeiling.findMany({
      include: { category: true },
      orderBy: { maxDiscountPercent: 'asc' },
    })

    return NextResponse.json(ceilings)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch category discount ceilings' }, { status: 500 })
  }
}

// POST /api/discount-ceilings/category — Upsert category discount ceiling (ADMIN/MANAGER/FINANCE)
export async function POST(req: Request) {
  const { errorResponse } = await requireAuth([UserRole.ADMIN, UserRole.MANAGER, UserRole.FINANCE])
  if (errorResponse) return errorResponse

  try {
    const body = await req.json()
    const { categoryId, maxDiscountPercent } = body

    if (!categoryId || maxDiscountPercent === undefined) {
      return NextResponse.json({ error: 'categoryId and maxDiscountPercent are required' }, { status: 400 })
    }

    const discount = Number(maxDiscountPercent)
    if (isNaN(discount) || discount < 0 || discount > 100) {
      return NextResponse.json({ error: 'maxDiscountPercent must be between 0 and 100' }, { status: 400 })
    }

    const ceiling = await prisma.categoryDiscountCeiling.upsert({
      where: { categoryId },
      update: { maxDiscountPercent: discount },
      create: { categoryId, maxDiscountPercent: discount },
      include: { category: true },
    })

    return NextResponse.json(ceiling, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to set category discount ceiling' }, { status: 500 })
  }
}
