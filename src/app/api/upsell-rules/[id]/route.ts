import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-guard'
import { UserRole } from '@prisma/client'
import { NextResponse } from 'next/server'

// DELETE /api/upsell-rules/[id] — Delete upsell rule (ADMIN/MANAGER)
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { errorResponse } = await requireAuth([UserRole.ADMIN, UserRole.MANAGER])
  if (errorResponse) return errorResponse

  try {
    const { id } = await params

    await prisma.upsellRule.delete({ where: { id } })

    return NextResponse.json({ message: 'Upsell rule deleted successfully' })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Upsell rule not found' }, { status: 404 })
    }
    return NextResponse.json({ error: error.message || 'Failed to delete upsell rule' }, { status: 500 })
  }
}
