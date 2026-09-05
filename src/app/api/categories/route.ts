import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-guard'
import { UserRole } from '@prisma/client'
import { NextResponse } from 'next/server'

// GET /api/categories — List all categories
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(categories)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch categories' }, { status: 500 })
  }
}

// POST /api/categories — Create a category (ADMIN/MANAGER)
export async function POST(req: Request) {
  const { errorResponse } = await requireAuth([UserRole.ADMIN, UserRole.MANAGER])
  if (errorResponse) return errorResponse

  try {
    const body = await req.json()
    const { name } = body

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 })
    }

    const existing = await prisma.category.findUnique({
      where: { name: name.trim() },
    })

    if (existing) {
      return NextResponse.json({ error: 'Category with this name already exists' }, { status: 409 })
    }

    const category = await prisma.category.create({
      data: { name: name.trim() },
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create category' }, { status: 500 })
  }
}
