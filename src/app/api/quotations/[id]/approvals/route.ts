import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-guard'
import { NextResponse } from 'next/server'

// GET /api/quotations/[id]/approvals — Fetch approval chain history for a quotation
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { errorResponse } = await requireAuth()
  if (errorResponse) return errorResponse

  try {
    const { id } = await params

    const approvals = await prisma.approval.findMany({
      where: { quotationId: id },
      include: {
        approver: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json(approvals)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch approvals' }, { status: 500 })
  }
}
