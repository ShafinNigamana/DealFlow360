import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-guard'
import { BackorderStatus } from '@prisma/client'
import { NextResponse } from 'next/server'

// GET /api/backorders — List backorders (filter by status)
export async function GET(req: Request) {
  const { errorResponse } = await requireAuth()
  if (errorResponse) return errorResponse

  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') as BackorderStatus | null

    const where: any = {}
    if (status) where.status = status

    const backorders = await prisma.backorder.findMany({
      where,
      include: {
        warehouseSplit: {
          include: {
            warehouse: true,
            quotation: {
              include: { customer: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(backorders)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch backorders' }, { status: 500 })
  }
}
