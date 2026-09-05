import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-guard'
import { UserRole } from '@prisma/client'
import { NextResponse } from 'next/server'

// GET /api/customer-tiers — List all tiers
export async function GET() {
  try {
    const tiers = await prisma.customerTier.findMany({
      include: {
        tierDiscountCeilings: true,
        _count: {
          select: { customers: true },
        },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(tiers)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch customer tiers' }, { status: 500 })
  }
}

// POST /api/customer-tiers — Create a tier (ADMIN/MANAGER)
export async function POST(req: Request) {
  const { errorResponse } = await requireAuth([UserRole.ADMIN, UserRole.MANAGER])
  if (errorResponse) return errorResponse

  try {
    const body = await req.json()
    const { name } = body

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Tier name is required' }, { status: 400 })
    }

    const tier = await prisma.customerTier.create({
      data: { name: name.trim().toUpperCase() },
    })

    return NextResponse.json(tier, { status: 201 })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Tier with this name already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message || 'Failed to create tier' }, { status: 500 })
  }
}
