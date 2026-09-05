import { requireAuth } from '@/lib/auth-guard'
import { routeQuotationForApproval } from '@/lib/services/approval/routingEngine'
import { NextResponse } from 'next/server'

// POST /api/quotations/[id]/submit — Submit quotation for approval
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { errorResponse, session } = await requireAuth()
  if (errorResponse) return errorResponse

  try {
    const { id } = await params

    const result = await routeQuotationForApproval(id, session.user.id)

    return NextResponse.json({
      message:
        result.newStatus === 'APPROVED'
          ? 'Quotation auto-approved successfully'
          : `Quotation submitted for approval (${result.requiredLevel})`,
      result,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to submit quotation' }, { status: 400 })
  }
}
