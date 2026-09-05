import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-guard'
import { UserRole } from '@prisma/client'
import { NextResponse } from 'next/server'

// GET /api/products/[id]/variants — List variants for a product
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const variants = await prisma.productVariant.findMany({
      where: { productId: id },
      orderBy: { attributeName: 'asc' },
    })

    return NextResponse.json(variants)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch variants' }, { status: 500 })
  }
}

// POST /api/products/[id]/variants — Create a variant (ADMIN/MANAGER)
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { errorResponse } = await requireAuth([UserRole.ADMIN, UserRole.MANAGER])
  if (errorResponse) return errorResponse

  try {
    const { id: productId } = await params
    const body = await req.json()
    const { attributeName, value, extraPrice } = body

    if (!attributeName || !value) {
      return NextResponse.json({ error: 'attributeName and value are required' }, { status: 400 })
    }

    const variant = await prisma.productVariant.create({
      data: {
        productId,
        attributeName: attributeName.trim(),
        value: value.trim(),
        extraPrice: extraPrice !== undefined ? Number(extraPrice) : 0,
      },
    })

    return NextResponse.json(variant, { status: 201 })
  } catch (error: any) {
    if (error.code === 'P2003') {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }
    return NextResponse.json({ error: error.message || 'Failed to create variant' }, { status: 500 })
  }
}
