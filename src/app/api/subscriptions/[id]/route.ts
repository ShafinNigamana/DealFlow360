import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-guard'
import { SubscriptionStatus } from '@prisma/client'
import { NextResponse } from 'next/server'

// GET /api/subscriptions/[id] — Fetch single subscription details
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { errorResponse } = await requireAuth()
  if (errorResponse) return errorResponse

  try {
    const { id } = await params

    const subscription = await prisma.subscription.findUnique({
      where: { id },
      include: {
        plan: true,
        quotationLine: {
          include: {
            product: true,
            quotation: { include: { customer: true } },
          },
        },
        billingEntries: { orderBy: { dueDate: 'asc' } },
        creditNotes: true,
      },
    })

    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
    }

    return NextResponse.json(subscription)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch subscription' }, { status: 500 })
  }
}

// PATCH /api/subscriptions/[id] — Update subscription status (pause/cancel)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { errorResponse } = await requireAuth()
  if (errorResponse) return errorResponse

  try {
    const { id } = await params
    const body = await req.json()
    const { status } = body

    if (!status || !Object.values(SubscriptionStatus).includes(status as SubscriptionStatus)) {
      return NextResponse.json({ error: 'Valid status enum is required' }, { status: 400 })
    }

    const updated = await prisma.subscription.update({
      where: { id },
      data: { status: status as SubscriptionStatus },
      include: { plan: true },
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
    }
    return NextResponse.json({ error: error.message || 'Failed to update subscription' }, { status: 500 })
  }
}
