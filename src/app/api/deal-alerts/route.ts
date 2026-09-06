import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-guard'
import { evaluateDealHealthAlerts } from '@/lib/services/alerts/dealHealth'
import { DealAlertStatus, UserRole } from '@prisma/client'
import { NextResponse } from 'next/server'

// GET /api/deal-alerts — List deal health alerts
export async function GET(req: Request) {
  const { errorResponse } = await requireAuth([UserRole.MANAGER])
  if (errorResponse) return errorResponse

  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') as DealAlertStatus | null

    // Trigger evaluation on list query
    await evaluateDealHealthAlerts()

    const where: any = {}
    if (status) where.status = status

    const alerts = await prisma.dealAlert.findMany({
      where,
      include: {
        quotation: {
          include: { customer: true, rep: { select: { name: true, email: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(alerts)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch deal alerts' }, { status: 500 })
  }
}
