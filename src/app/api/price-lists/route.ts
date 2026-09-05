import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-guard'
import { UserRole } from '@prisma/client'
import { NextResponse } from 'next/server'

// GET /api/price-lists — List price list rules
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const productId = searchParams.get('productId')
    const tierId = searchParams.get('tierId')

    const where: any = {}
    if (productId) where.productId = productId
    if (tierId) where.tierId = tierId

    const priceLists = await prisma.priceList.findMany({
      where,
      include: {
        product: true,
        tier: true,
      },
      orderBy: { price: 'asc' },
    })

    return NextResponse.json(priceLists)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch price lists' }, { status: 500 })
  }
}

// POST /api/price-lists — Upsert a price list entry (ADMIN/MANAGER)
export async function POST(req: Request) {
  const { errorResponse } = await requireAuth([UserRole.ADMIN, UserRole.MANAGER])
  if (errorResponse) return errorResponse

  try {
    const body = await req.json()
    const { productId, tierId, price, currency } = body

    if (!productId || !tierId || price === undefined) {
      return NextResponse.json({ error: 'productId, tierId, and price are required' }, { status: 400 })
    }

    const numericPrice = Number(price)
    if (isNaN(numericPrice) || numericPrice < 0) {
      return NextResponse.json({ error: 'price must be a non-negative number' }, { status: 400 })
    }

    const curr = currency?.trim().toUpperCase() || 'USD'

    const priceList = await prisma.priceList.upsert({
      where: {
        productId_tierId_currency: {
          productId,
          tierId,
          currency: curr,
        },
      },
      update: { price: numericPrice },
      create: {
        productId,
        tierId,
        currency: curr,
        price: numericPrice,
      },
      include: {
        product: true,
        tier: true,
      },
    })

    return NextResponse.json(priceList, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to set price list entry' }, { status: 500 })
  }
}
