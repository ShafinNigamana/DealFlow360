import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-guard'
import { BillingEntryStatus } from '@prisma/client'
import { NextResponse } from 'next/server'

// GET /api/billing-entries — List billing entries
export async function GET(req: Request) {
  const { errorResponse } = await requireAuth()
  if (errorResponse) return errorResponse

  try {
    const { searchParams } = new URL(req.url)
    const subscriptionId = searchParams.get('subscriptionId')
    const status = searchParams.get('status') as BillingEntryStatus | null

    const where: any = {}
    if (subscriptionId) where.subscriptionId = subscriptionId
    if (status) where.status = status

    const entries = await prisma.billingScheduleEntry.findMany({
      where,
      include: {
        subscription: {
          include: { plan: true },
        },
      },
      orderBy: { dueDate: 'asc' },
    })

    return NextResponse.json(entries)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch billing entries' }, { status: 500 })
  }
}

// PATCH /api/billing-entries — Update billing entry status
export async function PATCH(req: Request) {
  const { errorResponse } = await requireAuth()
  if (errorResponse) return errorResponse

  try {
    const body = await req.json()
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json({ error: 'id and status are required' }, { status: 400 })
    }

    if (!Object.values(BillingEntryStatus).includes(status as BillingEntryStatus)) {
      return NextResponse.json({ error: 'Invalid BillingEntryStatus enum' }, { status: 400 })
    }

    const updated = await prisma.billingScheduleEntry.update({
      where: { id },
      data: { status: status as BillingEntryStatus },
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Billing schedule entry not found' }, { status: 404 })
    }
    return NextResponse.json({ error: error.message || 'Failed to update billing entry' }, { status: 500 })
  }
}
