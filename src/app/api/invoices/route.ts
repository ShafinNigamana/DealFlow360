import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-guard'
import { InvoiceStatus, UserRole } from '@prisma/client'
import { NextResponse } from 'next/server'

// GET /api/invoices — List invoices
export async function GET(req: Request) {
  const { errorResponse } = await requireAuth([UserRole.FINANCE, UserRole.MANAGER])
  if (errorResponse) return errorResponse

  try {
    const { searchParams } = new URL(req.url)
    const quotationId = searchParams.get('quotationId')
    const status = searchParams.get('status') as InvoiceStatus | null

    const where: any = {}
    if (quotationId) where.quotationId = quotationId
    if (status) where.status = status

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        quotation: { include: { customer: true } },
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(invoices)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch invoices' }, { status: 500 })
  }
}

// POST /api/invoices — Create invoice from quotation
export async function POST(req: Request) {
  const { errorResponse } = await requireAuth([UserRole.FINANCE])
  if (errorResponse) return errorResponse

  try {
    const body = await req.json()
    const { quotationId, amount } = body

    if (!quotationId || amount === undefined) {
      return NextResponse.json({ error: 'quotationId and amount are required' }, { status: 400 })
    }

    const numAmount = Number(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json({ error: 'amount must be a positive number' }, { status: 400 })
    }

    const invoice = await prisma.invoice.create({
      data: {
        quotationId,
        amount: numAmount,
        status: InvoiceStatus.DRAFT,
      },
      include: {
        quotation: { include: { customer: true } },
      },
    })

    return NextResponse.json(invoice, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create invoice' }, { status: 500 })
  }
}
