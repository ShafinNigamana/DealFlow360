import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-guard'
import { UserRole, ApprovalLevel } from '@prisma/client'
import { NextResponse } from 'next/server'

// GET /api/approval-chains — List all approval chain configurations
export async function GET() {
  try {
    const configs = await prisma.approvalChainConfig.findMany({
      orderBy: { minDiscountPercent: 'asc' },
    })

    return NextResponse.json(configs)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch approval chain configs' }, { status: 500 })
  }
}

// POST /api/approval-chains — Create approval chain config (ADMIN/MANAGER/FINANCE)
export async function POST(req: Request) {
  const { errorResponse } = await requireAuth([UserRole.ADMIN, UserRole.MANAGER, UserRole.FINANCE])
  if (errorResponse) return errorResponse

  try {
    const body = await req.json()
    const { minDiscountPercent, maxDiscountPercent, requiredLevel } = body

    if (minDiscountPercent === undefined || maxDiscountPercent === undefined || !requiredLevel) {
      return NextResponse.json(
        { error: 'minDiscountPercent, maxDiscountPercent, and requiredLevel are required' },
        { status: 400 }
      )
    }

    if (!Object.values(ApprovalLevel).includes(requiredLevel as ApprovalLevel)) {
      return NextResponse.json({ error: 'Invalid requiredLevel enum' }, { status: 400 })
    }

    const config = await prisma.approvalChainConfig.create({
      data: {
        minDiscountPercent: Number(minDiscountPercent),
        maxDiscountPercent: Number(maxDiscountPercent),
        requiredLevel: requiredLevel as ApprovalLevel,
      },
    })

    return NextResponse.json(config, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create approval chain config' }, { status: 500 })
  }
}
