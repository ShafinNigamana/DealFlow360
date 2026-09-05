import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-guard'
import { InvoiceStatus } from '@prisma/client'
import { NextResponse } from 'next/server'

// GET /api/invoices/[id] — Fetch single invoice with quotation, customer, and payments
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        quotation: {
          include: {
            customer: true,
            lines: {
              include: { product: true, variant: true },
            },
            rep: { select: { id: true, name: true, email: true } },
          },
        },
        payments: {
          orderBy: { paidAt: 'desc' },
        },
      },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    return NextResponse.json(invoice)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch invoice' }, { status: 500 })
  }
}

// PATCH /api/invoices/[id] — Update invoice status
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { errorResponse } = await requireAuth()
  if (errorResponse) return errorResponse

  try {
    const { id } = await params
    const body = await req.json()
    const { status } = body

    if (!status || !Object.values(InvoiceStatus).includes(status as InvoiceStatus)) {
      return NextResponse.json({ error: 'Valid InvoiceStatus enum is required' }, { status: 400 })
    }

    const invoice = await prisma.invoice.update({
      where: { id },
      data: { status: status as InvoiceStatus },
      include: { payments: true },
    })

    return NextResponse.json(invoice)
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }
    return NextResponse.json({ error: error.message || 'Failed to update invoice' }, { status: 500 })
  }
}
