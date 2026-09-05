import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-guard'
import { UserRole } from '@prisma/client'
import { NextResponse } from 'next/server'

// GET /api/products/[id] — Get single product details
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        variants: true,
        priceLists: {
          include: { tier: true },
        },
        warehouseStocks: {
          include: { warehouse: true },
        },
      },
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json(product)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch product' }, { status: 500 })
  }
}

// PATCH /api/products/[id] — Update product (ADMIN/MANAGER)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { errorResponse } = await requireAuth([UserRole.ADMIN, UserRole.MANAGER])
  if (errorResponse) return errorResponse

  try {
    const { id } = await params
    const body = await req.json()

    const updateData: any = {}
    if (body.name !== undefined) updateData.name = body.name.trim()
    if (body.categoryId !== undefined) updateData.categoryId = body.categoryId
    if (body.basePrice !== undefined) updateData.basePrice = Number(body.basePrice)
    if (body.unit !== undefined) updateData.unit = body.unit.trim()
    if (body.taxRate !== undefined) updateData.taxRate = Number(body.taxRate)
    if (body.description !== undefined) updateData.description = body.description ? body.description.trim() : null

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        variants: true,
      },
    })

    return NextResponse.json(product)
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }
    return NextResponse.json({ error: error.message || 'Failed to update product' }, { status: 500 })
  }
}

// DELETE /api/products/[id] — Delete product (ADMIN/MANAGER)
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { errorResponse } = await requireAuth([UserRole.ADMIN, UserRole.MANAGER])
  if (errorResponse) return errorResponse

  try {
    const { id } = await params

    await prisma.product.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Product deleted successfully' })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }
    return NextResponse.json({ error: error.message || 'Failed to delete product' }, { status: 500 })
  }
}
