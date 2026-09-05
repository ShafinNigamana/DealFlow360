import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-guard'
import { UserRole, SubscriptionCadence } from '@prisma/client'
import { NextResponse } from 'next/server'

// PATCH /api/subscription-plans/[id] — Update plan (ADMIN/MANAGER)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { errorResponse } = await requireAuth([UserRole.ADMIN, UserRole.MANAGER])
  if (errorResponse) return errorResponse

  try {
    const { id } = await params
    const body = await req.json()

    const updateData: any = {}
    if (body.name !== undefined) updateData.name = body.name.trim()
    if (body.cadence !== undefined) {
      if (!Object.values(SubscriptionCadence).includes(body.cadence as SubscriptionCadence)) {
        return NextResponse.json({ error: 'Invalid SubscriptionCadence enum' }, { status: 400 })
      }
      updateData.cadence = body.cadence as SubscriptionCadence
    }
    if (body.prorationRule !== undefined) updateData.prorationRule = body.prorationRule.trim()
    if (body.cancellationRule !== undefined) updateData.cancellationRule = body.cancellationRule.trim()

    const plan = await prisma.subscriptionPlan.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(plan)
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Subscription plan not found' }, { status: 404 })
    }
    return NextResponse.json({ error: error.message || 'Failed to update subscription plan' }, { status: 500 })
  }
}

// DELETE /api/subscription-plans/[id] — Delete plan (ADMIN/MANAGER)
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { errorResponse } = await requireAuth([UserRole.ADMIN, UserRole.MANAGER])
  if (errorResponse) return errorResponse

  try {
    const { id } = await params

    await prisma.subscriptionPlan.delete({ where: { id } })

    return NextResponse.json({ message: 'Subscription plan deleted successfully' })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Subscription plan not found' }, { status: 404 })
    }
    return NextResponse.json({ error: error.message || 'Failed to delete subscription plan' }, { status: 500 })
  }
}
