import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-guard'
import { UserRole } from '@prisma/client'
import { NextResponse } from 'next/server'

// PATCH /api/customer-tiers/[id] — Update tier (ADMIN/MANAGER)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { errorResponse } = await requireAuth([UserRole.ADMIN, UserRole.MANAGER])
  if (errorResponse) return errorResponse

  try {
    const { id } = await params
    const body = await req.json()
    const { name } = body

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Valid tier name is required' }, { status: 400 })
    }

    const updated = await prisma.customerTier.update({
      where: { id },
      data: { name: name.trim().toUpperCase() },
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Customer tier not found' }, { status: 404 })
    }
    return NextResponse.json({ error: error.message || 'Failed to update customer tier' }, { status: 500 })
  }
}

// DELETE /api/customer-tiers/[id] — Delete tier (ADMIN/MANAGER)
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { errorResponse } = await requireAuth([UserRole.ADMIN, UserRole.MANAGER])
  if (errorResponse) return errorResponse

  try {
    const { id } = await params

    await prisma.customerTier.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Customer tier deleted successfully' })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Customer tier not found' }, { status: 404 })
    }
    return NextResponse.json({ error: error.message || 'Failed to delete customer tier' }, { status: 500 })
  }
}
