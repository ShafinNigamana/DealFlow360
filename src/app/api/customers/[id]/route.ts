import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-guard'
import { UserRole } from '@prisma/client'
import { NextResponse } from 'next/server'

// GET /api/customers/[id] — Get single customer details
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        tier: {
          include: { tierDiscountCeilings: true },
        },
        quotations: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    })

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    return NextResponse.json(customer)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch customer' }, { status: 500 })
  }
}

// PATCH /api/customers/[id] — Update customer details (ADMIN/MANAGER/REP)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { errorResponse } = await requireAuth([UserRole.ADMIN, UserRole.MANAGER, UserRole.REP])
  if (errorResponse) return errorResponse

  try {
    const { id } = await params
    const body = await req.json()

    const updateData: any = {}
    if (body.name !== undefined) updateData.name = body.name.trim()
    if (body.email !== undefined) updateData.email = body.email.trim().toLowerCase()
    if (body.tierId !== undefined) updateData.tierId = body.tierId || null

    const customer = await prisma.customer.update({
      where: { id },
      data: updateData,
      include: {
        tier: true,
      },
    })

    return NextResponse.json(customer)
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Email address already in use' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message || 'Failed to update customer' }, { status: 500 })
  }
}

// DELETE /api/customers/[id] — Delete customer (ADMIN/MANAGER)
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { errorResponse } = await requireAuth([UserRole.ADMIN, UserRole.MANAGER])
  if (errorResponse) return errorResponse

  try {
    const { id } = await params

    await prisma.customer.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Customer deleted successfully' })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }
    return NextResponse.json({ error: error.message || 'Failed to delete customer' }, { status: 500 })
  }
}
