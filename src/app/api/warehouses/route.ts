import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-guard'
import { UserRole } from '@prisma/client'
import { NextResponse } from 'next/server'

// GET /api/warehouses — List all warehouses with stock items
export async function GET() {
  try {
    const warehouses = await prisma.warehouse.findMany({
      include: {
        stocks: {
          include: { product: true },
        },
        _count: {
          select: { stocks: true, warehouseSplits: true },
        },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(warehouses)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch warehouses' }, { status: 500 })
  }
}

// POST /api/warehouses — Create warehouse (ADMIN/MANAGER)
export async function POST(req: Request) {
  const { errorResponse } = await requireAuth([UserRole.ADMIN, UserRole.MANAGER])
  if (errorResponse) return errorResponse

  try {
    const body = await req.json()
    const { name, shippingCostWeight } = body

    if (!name || shippingCostWeight === undefined) {
      return NextResponse.json({ error: 'name and shippingCostWeight are required' }, { status: 400 })
    }

    const weight = Number(shippingCostWeight)
    if (isNaN(weight) || weight < 0) {
      return NextResponse.json({ error: 'shippingCostWeight must be a non-negative number' }, { status: 400 })
    }

    const warehouse = await prisma.warehouse.create({
      data: {
        name: name.trim(),
        shippingCostWeight: weight,
      },
    })

    return NextResponse.json(warehouse, { status: 201 })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Warehouse with this name already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message || 'Failed to create warehouse' }, { status: 500 })
  }
}
