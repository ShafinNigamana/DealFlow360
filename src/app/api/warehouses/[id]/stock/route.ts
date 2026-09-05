import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-guard'
import { UserRole } from '@prisma/client'
import { NextResponse } from 'next/server'

// GET /api/warehouses/[id]/stock — List stock items in warehouse
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const stock = await prisma.warehouseStock.findMany({
      where: { warehouseId: id },
      include: { product: true },
      orderBy: { product: { name: 'asc' } },
    })

    return NextResponse.json(stock)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch warehouse stock' }, { status: 500 })
  }
}

// POST /api/warehouses/[id]/stock — Upsert stock quantity for a product in warehouse (ADMIN/MANAGER)
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { errorResponse } = await requireAuth([UserRole.ADMIN, UserRole.MANAGER])
  if (errorResponse) return errorResponse

  try {
    const { id: warehouseId } = await params
    const body = await req.json()
    const { productId, quantity, replenishmentThreshold } = body

    if (!productId || quantity === undefined) {
      return NextResponse.json({ error: 'productId and quantity are required' }, { status: 400 })
    }

    const qty = Number(quantity)
    if (isNaN(qty) || qty < 0) {
      return NextResponse.json({ error: 'quantity must be a non-negative integer' }, { status: 400 })
    }

    const stock = await prisma.warehouseStock.upsert({
      where: {
        warehouseId_productId: {
          warehouseId,
          productId,
        },
      },
      update: {
        quantity: qty,
        replenishmentThreshold: replenishmentThreshold !== undefined ? Number(replenishmentThreshold) : undefined,
      },
      create: {
        warehouseId,
        productId,
        quantity: qty,
        replenishmentThreshold: replenishmentThreshold !== undefined ? Number(replenishmentThreshold) : 0,
      },
      include: { product: true },
    })

    return NextResponse.json(stock, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update warehouse stock' }, { status: 500 })
  }
}
