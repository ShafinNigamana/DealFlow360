import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-guard'
import { UserRole } from '@prisma/client'
import { NextResponse } from 'next/server'

// GET /api/credit-notes — List credit notes
export async function GET(req: Request) {
  const { errorResponse } = await requireAuth()
  if (errorResponse) return errorResponse

  try {
    const { searchParams } = new URL(req.url)
    const subscriptionId = searchParams.get('subscriptionId')

    const where: any = {}
    if (subscriptionId) where.subscriptionId = subscriptionId

    const creditNotes = await prisma.creditNote.findMany({
      where,
      include: {
        subscription: {
          include: {
            quotationLine: { include: { product: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(creditNotes)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch credit notes' }, { status: 500 })
  }
}

// POST /api/credit-notes — Issue a credit note (ADMIN/MANAGER/FINANCE)
export async function POST(req: Request) {
  const { errorResponse } = await requireAuth([UserRole.ADMIN, UserRole.MANAGER, UserRole.FINANCE])
  if (errorResponse) return errorResponse

  try {
    const body = await req.json()
    const { subscriptionId, amount, reason } = body

    if (!subscriptionId || amount === undefined || !reason) {
      return NextResponse.json({ error: 'subscriptionId, amount, and reason are required' }, { status: 400 })
    }

    const numAmount = Number(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json({ error: 'amount must be a positive number' }, { status: 400 })
    }

    const creditNote = await prisma.creditNote.create({
      data: {
        subscriptionId,
        amount: numAmount,
        reason: reason.trim(),
      },
      include: {
        subscription: true,
      },
    })

    return NextResponse.json(creditNote, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to issue credit note' }, { status: 500 })
  }
}
