import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-guard'
import { logAudit } from '@/lib/services/audit/auditLog'
import { UserRole, ApprovalStatus, QuotationStatus } from '@prisma/client'
import { NextResponse } from 'next/server'

// POST /api/approvals/[id]/decide — Approve or Reject a quotation approval request
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { errorResponse, session } = await requireAuth([UserRole.MANAGER, UserRole.FINANCE, UserRole.ADMIN])
  if (errorResponse) return errorResponse

  try {
    const { id: approvalId } = await params
    const body = await req.json()
    const { action, reason } = body

    if (!action || !['APPROVE', 'REJECT', 'RETURN'].includes(action)) {
      return NextResponse.json({ error: 'Action must be APPROVE, REJECT, or RETURN' }, { status: 400 })
    }

    const approval = await prisma.approval.findUnique({
      where: { id: approvalId },
      include: { quotation: true },
    })

    if (!approval) {
      return NextResponse.json({ error: 'Approval request not found' }, { status: 404 })
    }

    if (approval.status !== ApprovalStatus.PENDING) {
      return NextResponse.json({ error: `Approval request is already ${approval.status}` }, { status: 400 })
    }

    const isApprove = action === 'APPROVE'
    const isReturn = action === 'RETURN'

    const updatedResult = await prisma.$transaction(async (tx) => {
      // 1. Update this approval entry
      const updatedApproval = await tx.approval.update({
        where: { id: approvalId },
        data: {
          status: isApprove ? ApprovalStatus.APPROVED : ApprovalStatus.REJECTED,
          reason: reason?.trim() || null,
          approverId: session.user.id,
        },
      })

      let finalQuotationStatus = approval.quotation.status

      if (isReturn) {
        // RETURN: Send back for revision — reset to DRAFT so rep can edit
        finalQuotationStatus = QuotationStatus.DRAFT
        await tx.quotation.update({
          where: { id: approval.quotationId },
          data: { status: QuotationStatus.DRAFT },
        })
      } else if (!isApprove) {
        // If rejected, reject the entire quotation
        finalQuotationStatus = QuotationStatus.REJECTED
        await tx.quotation.update({
          where: { id: approval.quotationId },
          data: { status: QuotationStatus.REJECTED },
        })
      } else {
        // If approved, check if all pending approvals for this quotation are resolved
        const remainingPending = await tx.approval.count({
          where: {
            quotationId: approval.quotationId,
            status: ApprovalStatus.PENDING,
          },
        })

        if (remainingPending === 0) {
          finalQuotationStatus = QuotationStatus.APPROVED
          await tx.quotation.update({
            where: { id: approval.quotationId },
            data: { status: QuotationStatus.APPROVED },
          })
        }
      }

      // Log Audit Trail
      await logAudit(
        {
          entityType: 'Quotation',
          entityId: approval.quotationId,
          userId: session.user.id,
          action: isApprove ? 'APPROVAL_DECISION_APPROVED' : isReturn ? 'APPROVAL_DECISION_RETURNED' : 'APPROVAL_DECISION_REJECTED',
          reason: `Approver decision: ${action} (${approval.level}). ${reason || ''}`,
        },
        tx
      )

      return { updatedApproval, finalQuotationStatus }
    })

    return NextResponse.json({
      message: `Approval request ${isApprove ? 'approved' : isReturn ? 'returned for revision' : 'rejected'} successfully`,
      approval: updatedResult.updatedApproval,
      quotationStatus: updatedResult.finalQuotationStatus,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to process approval decision' }, { status: 500 })
  }
}
