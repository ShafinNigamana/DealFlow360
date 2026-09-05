import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-guard'
import { UserRole, SubscriptionCadence } from '@prisma/client'
import { NextResponse } from 'next/server'

// GET /api/subscription-plans — List all plans
export async function GET() {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(plans)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch subscription plans' }, { status: 500 })
  }
}

// POST /api/subscription-plans — Create a plan (ADMIN/MANAGER)
export async function POST(req: Request) {
  const { errorResponse } = await requireAuth([UserRole.ADMIN, UserRole.MANAGER])
  if (errorResponse) return errorResponse

  try {
    const body = await req.json()
    const { name, cadence, prorationRule, cancellationRule } = body

    if (!name || !cadence) {
      return NextResponse.json({ error: 'name and cadence are required' }, { status: 400 })
    }

    if (!Object.values(SubscriptionCadence).includes(cadence as SubscriptionCadence)) {
      return NextResponse.json({ error: 'Invalid SubscriptionCadence enum' }, { status: 400 })
    }

    const plan = await prisma.subscriptionPlan.create({
      data: {
        name: name.trim(),
        cadence: cadence as SubscriptionCadence,
        prorationRule: prorationRule?.trim() || 'prorate',
        cancellationRule: cancellationRule?.trim() || 'end_of_period',
      },
    })

    return NextResponse.json(plan, { status: 201 })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Plan with this name already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message || 'Failed to create subscription plan' }, { status: 500 })
  }
}
