import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-guard'
import { InvoiceStatus, UserRole } from '@prisma/client'
import { NextResponse } from 'next/server'

// GET /api/payments — List payments
export async function GET(req: Request) {
  const { errorResponse } = await requireAuth([UserRole.FINANCE, UserRole.MANAGER])
  if (errorResponse) return errorResponse

  try {
    const { searchParams } = new URL(req.url)
    const invoiceId = searchParams.get('invoiceId')

    const where: any = {}
    if (invoiceId) where.invoiceId = invoiceId

    const payments = await prisma.payment.findMany({
      where,
      include: {
        invoice: { include: { quotation: { include: { customer: true } } } },
      },
      orderBy: { paidAt: 'desc' },
    })

    return NextResponse.json(payments)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch payments' }, { status: 500 })
  }
}

// POST /api/payments — Record a payment against an invoice
export async function POST(req: Request) {
  const { errorResponse } = await requireAuth([UserRole.FINANCE])
  if (errorResponse) return errorResponse

  try {
    const body = await req.json()
    const { invoiceId, amount, method, paidAt } = body

    if (!invoiceId || amount === undefined) {
      return NextResponse.json({ error: 'invoiceId and amount are required' }, { status: 400 })
    }

    const numAmount = Number(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json({ error: 'amount must be a positive number' }, { status: 400 })
    }

    const payment = await prisma.$transaction(async (tx) => {
      const createdPayment = await tx.payment.create({
        data: {
          invoiceId,
          amount: numAmount,
          method: method?.trim() || 'CREDIT_CARD',
          paidAt: paidAt ? new Date(paidAt) : new Date(),
        },
      })

      // Update invoice status to PAID if total payments match or exceed amount
      const invoice = await tx.invoice.findUnique({
        where: { id: invoiceId },
        include: { payments: true },
      })

      if (invoice) {
        const totalPaid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0)
        if (totalPaid >= Number(invoice.amount)) {
          await tx.invoice.update({
            where: { id: invoiceId },
            data: { status: InvoiceStatus.PAID },
          })
        }
      }

      return createdPayment
    })

    return NextResponse.json(payment, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to record payment' }, { status: 500 })
  }
}
