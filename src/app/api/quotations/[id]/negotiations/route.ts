import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-guard'
import { logAudit } from '@/lib/services/audit/auditLog'
import { routeQuotationForApproval } from '@/lib/services/approval/routingEngine'
import { NegotiationAuthorType, QuotationStatus } from '@prisma/client'
import { NextResponse } from 'next/server'

// GET /api/quotations/[id]/negotiations — List negotiation thread
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const comments = await prisma.negotiationComment.findMany({
      where: { quotationId: id },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json(comments)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch negotiation thread' }, { status: 500 })
  }
}

// POST /api/quotations/[id]/negotiations — Add comment or counter-proposal
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: quotationId } = await params
    const body = await req.json()
    const { authorType, comment, counterDiscountPercent } = body

    if (!comment || !authorType) {
      return NextResponse.json({ error: 'comment and authorType are required' }, { status: 400 })
    }

    if (!Object.values(NegotiationAuthorType).includes(authorType as NegotiationAuthorType)) {
      return NextResponse.json({ error: 'Invalid authorType enum' }, { status: 400 })
    }

    const quotation = await prisma.quotation.findUnique({
      where: { id: quotationId },
      include: {
        customer: {
          include: { tier: { include: { tierDiscountCeilings: true } } },
        },
      },
    })

    if (!quotation) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 })
    }

    const counterDisc = counterDiscountPercent !== undefined ? Number(counterDiscountPercent) : null

    // Create the negotiation comment
    const negotiationComment = await prisma.negotiationComment.create({
      data: {
        quotationId,
        authorType: authorType as NegotiationAuthorType,
        comment: comment.trim(),
        counterDiscountPercent: counterDisc,
      },
    })

    // Portal re-routing logic:
    // If a CUSTOMER counter-proposal has a discount exceeding the tier ceiling,
    // re-enter the approval flow.
    let reRoutedForApproval = false
    let routingResult = null

    if (
      authorType === NegotiationAuthorType.CUSTOMER &&
      counterDisc !== null &&
      counterDisc > 0
    ) {
      // Check if counter-proposal exceeds tier discount ceiling
      const tierCeiling = quotation.customer?.tier?.tierDiscountCeilings[0]
      const maxTierDisc = tierCeiling ? Number(tierCeiling.maxDiscountPercent) : 0

      if (counterDisc > maxTierDisc) {
        // Re-route: reset quotation to DRAFT, update line discounts, then re-submit
        await prisma.$transaction(async (tx) => {
          // Update all lines to the counter-proposed discount
          await tx.quotationLine.updateMany({
            where: { quotationId },
            data: { unitDiscountPercent: counterDisc },
          })
          // Reset to DRAFT so routing engine can re-evaluate
          await tx.quotation.update({
            where: { id: quotationId },
            data: { status: QuotationStatus.DRAFT },
          })

          // Find the rep to use as audit actor for portal-originated re-routes
          const repUser = await tx.quotation.findUnique({
            where: { id: quotationId },
            select: { repId: true },
          })

          await logAudit(
            {
              entityType: 'Quotation',
              entityId: quotationId,
              userId: repUser?.repId || quotationId,
              action: 'COUNTER_PROPOSAL_REROUTED',
              reason: `Customer counter-proposal of ${counterDisc}% exceeds tier ceiling of ${maxTierDisc}%. Re-entering approval flow.`,
            },
            tx
          )
        })

        // Re-submit through the approval routing engine using the quotation's rep
        const repInfo = await prisma.quotation.findUnique({
          where: { id: quotationId },
          select: { repId: true },
        })
        routingResult = await routeQuotationForApproval(quotationId, repInfo?.repId || quotationId)
        reRoutedForApproval = true
      }
    }

    return NextResponse.json(
      {
        comment: negotiationComment,
        reRoutedForApproval,
        routingResult,
      },
      { status: 201 }
    )
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to add negotiation comment' }, { status: 500 })
  }
}
