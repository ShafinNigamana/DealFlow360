import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-guard'
import { UserRole } from '@prisma/client'
import { NextResponse } from 'next/server'

// GET /api/customers — List all customers with tier details
export async function GET() {
  try {
    const customers = await prisma.customer.findMany({
      include: {
        tier: {
          include: {
            tierDiscountCeilings: true,
          },
        },
        _count: {
          select: { quotations: true },
        },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(customers)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch customers' }, { status: 500 })
  }
}

// POST /api/customers — Create customer (ADMIN/MANAGER/REP)
export async function POST(req: Request) {
  const { errorResponse } = await requireAuth([UserRole.ADMIN, UserRole.MANAGER, UserRole.REP])
  if (errorResponse) return errorResponse

  try {
    const body = await req.json()
    const { name, email, tierId } = body

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
    }

    const customer = await prisma.customer.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        tierId: tierId || null,
      },
      include: {
        tier: true,
      },
    })

    return NextResponse.json(customer, { status: 201 })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Customer with this email already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message || 'Failed to create customer' }, { status: 500 })
  }
}
