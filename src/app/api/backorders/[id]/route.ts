import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-guard'
import { UserRole, BackorderStatus } from '@prisma/client'
import { NextResponse } from 'next/server'

// PATCH /api/backorders/[id] — Update backorder status or quantity (ADMIN/MANAGER)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { errorResponse } = await requireAuth([UserRole.ADMIN, UserRole.MANAGER])
  if (errorResponse) return errorResponse

  try {
    const { id } = await params
    const body = await req.json()

    const updateData: any = {}
    if (body.quantityRemaining !== undefined) updateData.quantityRemaining = Number(body.quantityRemaining)
    if (body.status !== undefined) {
      if (!Object.values(BackorderStatus).includes(body.status as BackorderStatus)) {
        return NextResponse.json({ error: 'Invalid BackorderStatus enum' }, { status: 400 })
      }
      updateData.status = body.status as BackorderStatus
    }

    const backorder = await prisma.backorder.update({
      where: { id },
      data: updateData,
      include: {
        warehouseSplit: {
          include: { warehouse: true },
        },
      },
    })

    return NextResponse.json(backorder)
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Backorder not found' }, { status: 404 })
    }
    return NextResponse.json({ error: error.message || 'Failed to update backorder' }, { status: 500 })
  }
}
