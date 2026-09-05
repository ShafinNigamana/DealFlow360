import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-guard'
import { DealAlertStatus } from '@prisma/client'
import { NextResponse } from 'next/server'

// PATCH /api/deal-alerts/[id] — Acknowledge or escalate deal alert
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { errorResponse } = await requireAuth()
  if (errorResponse) return errorResponse

  try {
    const { id } = await params
    const body = await req.json()
    const { status } = body

    if (!status || !Object.values(DealAlertStatus).includes(status as DealAlertStatus)) {
      return NextResponse.json({ error: 'Valid DealAlertStatus enum is required' }, { status: 400 })
    }

    const alert = await prisma.dealAlert.update({
      where: { id },
      data: { status: status as DealAlertStatus },
    })

    return NextResponse.json(alert)
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Deal alert not found' }, { status: 404 })
    }
    return NextResponse.json({ error: error.message || 'Failed to update deal alert' }, { status: 500 })
  }
}
