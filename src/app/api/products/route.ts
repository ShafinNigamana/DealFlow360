import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-guard'
import { UserRole } from '@prisma/client'
import { NextResponse } from 'next/server'

// GET /api/products — List all products with category & variants
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const categoryId = searchParams.get('categoryId')

    const where: any = {}
    if (categoryId) {
      where.categoryId = categoryId
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
        variants: true,
        priceLists: {
          include: { tier: true },
        },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(products)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch products' }, { status: 500 })
  }
}

// POST /api/products — Create a product (ADMIN/MANAGER)
export async function POST(req: Request) {
  const { errorResponse } = await requireAuth([UserRole.ADMIN, UserRole.MANAGER])
  if (errorResponse) return errorResponse

  try {
    const body = await req.json()
    const { name, categoryId, basePrice, unit, taxRate, description } = body

    if (!name || !categoryId || basePrice === undefined) {
      return NextResponse.json(
        { error: 'Name, categoryId, and basePrice are required' },
        { status: 400 }
      )
    }

    const numericBasePrice = Number(basePrice)
    if (isNaN(numericBasePrice) || numericBasePrice < 0) {
      return NextResponse.json({ error: 'basePrice must be a non-negative number' }, { status: 400 })
    }

    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        categoryId,
        basePrice: numericBasePrice,
        unit: unit?.trim() || 'unit',
        taxRate: taxRate !== undefined ? Number(taxRate) : 0,
        description: description?.trim() || null,
      },
      include: {
        category: true,
      },
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error: any) {
    if (error.code === 'P2003') {
      return NextResponse.json({ error: 'Invalid categoryId' }, { status: 400 })
    }
    return NextResponse.json({ error: error.message || 'Failed to create product' }, { status: 500 })
  }
}
