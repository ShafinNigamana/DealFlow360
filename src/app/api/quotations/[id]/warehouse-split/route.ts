import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-guard'
import { computeWarehouseSplit } from '@/lib/services/warehouse/splitAlgorithm'
import { UserRole } from '@prisma/client'
import { NextResponse } from 'next/server'

// POST /api/quotations/[id]/warehouse-split — Compute and persist warehouse split
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { errorResponse } = await requireAuth([UserRole.FINANCE])
  if (errorResponse) return errorResponse

  try {
    const { id } = await params

    const result = await computeWarehouseSplit(id)

    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to compute warehouse split' }, { status: 400 })
  }
}

// GET /api/quotations/[id]/warehouse-split — Retrieve existing warehouse split
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { errorResponse } = await requireAuth([UserRole.REP, UserRole.MANAGER, UserRole.FINANCE])
  if (errorResponse) return errorResponse

  try {
    const { id } = await params

    const splits = await prisma.warehouseSplit.findMany({
      where: { quotationId: id },
      include: {
        warehouse: true,
        backorders: true,
      },
    })

    return NextResponse.json(splits)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch warehouse split' }, { status: 500 })
  }
}
