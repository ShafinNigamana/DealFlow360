import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-guard'
import { SubscriptionStatus, UserRole } from '@prisma/client'
import { NextResponse } from 'next/server'

// GET /api/subscriptions — List subscriptions (filter by status)
export async function GET(req: Request) {
  const { errorResponse } = await requireAuth([UserRole.REP, UserRole.MANAGER, UserRole.FINANCE])
  if (errorResponse) return errorResponse

  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') as SubscriptionStatus | null

    const where: any = {}
    if (status) where.status = status

    const subscriptions = await prisma.subscription.findMany({
      where,
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
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(subscriptions)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch subscriptions' }, { status: 500 })
  }
}

// POST /api/subscriptions — Create/Activate a subscription for a quotation line
export async function POST(req: Request) {
  const { errorResponse } = await requireAuth([UserRole.REP, UserRole.MANAGER, UserRole.FINANCE])
  if (errorResponse) return errorResponse

  try {
    const body = await req.json()
    const { quotationLineId, planId, startDate } = body

    if (!quotationLineId || !planId) {
      return NextResponse.json({ error: 'quotationLineId and planId are required' }, { status: 400 })
    }

    const subscription = await prisma.subscription.create({
      data: {
        quotationLineId,
        planId,
        status: SubscriptionStatus.ACTIVE,
        startDate: startDate ? new Date(startDate) : new Date(),
      },
      include: {
        plan: true,
        quotationLine: true,
      },
    })

    return NextResponse.json(subscription, { status: 201 })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Subscription already exists for this quotation line' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message || 'Failed to create subscription' }, { status: 500 })
  }
}
