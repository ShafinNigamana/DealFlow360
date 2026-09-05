import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-guard'
import { UserRole, ApprovalLevel } from '@prisma/client'
import { NextResponse } from 'next/server'

// PATCH /api/approval-chains/[id] — Update approval chain config (ADMIN/MANAGER/FINANCE)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { errorResponse } = await requireAuth([UserRole.ADMIN, UserRole.MANAGER, UserRole.FINANCE])
  if (errorResponse) return errorResponse

  try {
    const { id } = await params
    const body = await req.json()

    const updateData: any = {}
    if (body.minDiscountPercent !== undefined) updateData.minDiscountPercent = Number(body.minDiscountPercent)
    if (body.maxDiscountPercent !== undefined) updateData.maxDiscountPercent = Number(body.maxDiscountPercent)
    if (body.requiredLevel !== undefined) {
      if (!Object.values(ApprovalLevel).includes(body.requiredLevel as ApprovalLevel)) {
        return NextResponse.json({ error: 'Invalid requiredLevel enum' }, { status: 400 })
      }
      updateData.requiredLevel = body.requiredLevel as ApprovalLevel
    }

    const updated = await prisma.approvalChainConfig.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Approval chain config not found' }, { status: 404 })
    }
    return NextResponse.json({ error: error.message || 'Failed to update approval chain config' }, { status: 500 })
  }
}

// DELETE /api/approval-chains/[id] — Delete approval chain config (ADMIN/MANAGER/FINANCE)
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { errorResponse } = await requireAuth([UserRole.ADMIN, UserRole.MANAGER, UserRole.FINANCE])
  if (errorResponse) return errorResponse

  try {
    const { id } = await params

    await prisma.approvalChainConfig.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Approval chain config deleted successfully' })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Approval chain config not found' }, { status: 404 })
    }
    return NextResponse.json({ error: error.message || 'Failed to delete approval chain config' }, { status: 500 })
  }
}
