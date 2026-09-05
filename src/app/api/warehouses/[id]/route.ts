import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-guard'
import { UserRole } from '@prisma/client'
import { NextResponse } from 'next/server'

// PATCH /api/warehouses/[id] — Update warehouse (ADMIN/MANAGER)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { errorResponse } = await requireAuth([UserRole.ADMIN, UserRole.MANAGER])
  if (errorResponse) return errorResponse

  try {
    const { id } = await params
    const body = await req.json()

    const updateData: any = {}
    if (body.name !== undefined) updateData.name = body.name.trim()
    if (body.shippingCostWeight !== undefined) updateData.shippingCostWeight = Number(body.shippingCostWeight)

    const warehouse = await prisma.warehouse.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(warehouse)
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Warehouse not found' }, { status: 404 })
    }
    return NextResponse.json({ error: error.message || 'Failed to update warehouse' }, { status: 500 })
  }
}

// DELETE /api/warehouses/[id] — Delete warehouse (ADMIN/MANAGER)
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { errorResponse } = await requireAuth([UserRole.ADMIN, UserRole.MANAGER])
  if (errorResponse) return errorResponse

  try {
    const { id } = await params

    await prisma.warehouse.delete({ where: { id } })

    return NextResponse.json({ message: 'Warehouse deleted successfully' })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Warehouse not found' }, { status: 404 })
    }
    return NextResponse.json({ error: error.message || 'Failed to delete warehouse' }, { status: 500 })
  }
}
