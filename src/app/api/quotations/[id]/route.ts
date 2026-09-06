import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-guard'
import { UserRole, InvoiceStatus, SubscriptionStatus, BillingEntryStatus } from '@prisma/client'
import { NextResponse } from 'next/server'

const INTERNAL_ROLES = [UserRole.REP, UserRole.MANAGER, UserRole.FINANCE, UserRole.ADMIN]

// GET /api/quotations/[id] — Fetch single quotation with full details
// Hybrid: internal roles see any quotation; CUSTOMER role sees only their own
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { errorResponse, session } = await requireAuth()
  if (errorResponse) return errorResponse

  try {
    const { id } = await params

    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        customer: {
          include: { tier: { include: { tierDiscountCeilings: true } } },
        },
        rep: { select: { id: true, name: true, email: true, role: true } },
        lines: {
          include: {
            product: { include: { category: { include: { categoryDiscountCeilings: true } } } },
            variant: true,
            subscriptionPlan: true,
            subscription: {
              include: {
                plan: true,
                billingEntries: true,
              },
            },
          },
        },
        approvals: {
          include: { approver: { select: { id: true, name: true, role: true } } },
          orderBy: { createdAt: 'asc' },
        },
        warehouseSplits: {
          include: { warehouse: true, backorders: true },
        },
        negotiationComments: {
          orderBy: { createdAt: 'asc' },
        },
        invoices: {
          include: { payments: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!quotation) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 })
    }

    // CUSTOMER can only view their own quotation
    const role = session!.user.role
    if (role === 'CUSTOMER' && quotation.customerId !== session!.user.id) {
      return NextResponse.json({ error: 'Forbidden: You can only view your own quotations' }, { status: 403 })
    }

    return NextResponse.json(quotation)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch quotation' }, { status: 500 })
  }
}

// PATCH /api/quotations/[id] — Update quotation (customer, status transitions, real checkout)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { errorResponse, session } = await requireAuth([
    'REP',
    'MANAGER',
    'FINANCE',
    'ADMIN',
    'CUSTOMER',
  ])
  if (errorResponse) return errorResponse

  try {
    const { id } = await params
    const body = await req.json()

    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        lines: {
          include: { product: true, subscriptionPlan: true },
        },
      },
    })
    if (!quotation) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 })
    }

    const role = session!.user.role

    // RBAC validation for status transitions
    if (body.status !== undefined) {
      if (body.status === 'CONFIRMED') {
        // Customer can only confirm their own quotation
        if (role === 'CUSTOMER') {
          if (quotation.customerId !== session!.user.id) {
            return NextResponse.json({ error: 'Forbidden: You can only confirm quotations for your own account' }, { status: 403 })
          }
        } else if (role === 'REP') {
          // Sales Rep can confirm on behalf of client for their own quotes (or admin)
          if (quotation.repId !== session!.user.id && session!.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden: You can only confirm quotations assigned to you' }, { status: 403 })
          }
        } else if (role === 'ADMIN') {
          // Superuser allowed
        } else {
          // MANAGER and FINANCE cannot directly confirm deals
          return NextResponse.json(
            { error: `Forbidden: Role ${role} cannot directly checkout quotations. Governance approval actions must be executed through the Approvals workflow.` },
            { status: 403 }
          )
        }

        if (quotation.status !== 'APPROVED' && quotation.status !== 'SENT') {
          return NextResponse.json(
            { error: `Cannot confirm quotation while in ${quotation.status} status. It must be APPROVED or SENT first.` },
            { status: 400 }
          )
        }
      } else if (role === 'CUSTOMER') {
        // Customers are strictly limited to confirming approved quotes
        return NextResponse.json({ error: 'Forbidden: Customers can only confirm approved quotations' }, { status: 403 })
      }
    }

    const updateData: any = {}

    // Status transitions
    if (body.status !== undefined) {
      const allowedTransitions: Record<string, string[]> = {
        APPROVED: ['CONFIRMED', 'CANCELLED'],
        SENT: ['CONFIRMED', 'CANCELLED'],
        CONFIRMED: ['FULFILLED'],
        DRAFT: ['CANCELLED'],
      }
      const allowed = allowedTransitions[quotation.status] || []
      if (!allowed.includes(body.status)) {
        return NextResponse.json(
          { error: `Cannot transition quotation from ${quotation.status} to ${body.status}` },
          { status: 400 }
        )
      }
      updateData.status = body.status
    }

    // Structural field edits only allowed in DRAFT
    if (body.customerId !== undefined) {
      if (quotation.status !== 'DRAFT') {
        return NextResponse.json({ error: `Cannot edit quotation in ${quotation.status} status` }, { status: 400 })
      }
      updateData.customerId = body.customerId
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    // Transactional Execution
    const updated = await prisma.$transaction(async (tx) => {
      const q = await tx.quotation.update({
        where: { id },
        data: updateData,
        include: {
          customer: true,
          lines: {
            include: { product: true, subscriptionPlan: true },
          },
          invoices: {
            include: { payments: true },
          },
          warehouseSplits: {
            include: { warehouse: true, backorders: true },
          },
        },
      })

      // When checking out / confirming the quotation, execute downstream fulfillment and invoicing pipeline
      if (body.status === 'CONFIRMED') {
        // 1. Auto-generate real Invoice if not already created
        const existingInvoice = await tx.invoice.findFirst({ where: { quotationId: id } })
        if (!existingInvoice) {
          const subtotal = q.lines.reduce((s, l) => s + Number(l.lineTotal || 0), 0)
          const invoiceAmount = Number((subtotal * 1.18).toFixed(2)) // 18% standard tax
          await tx.invoice.create({
            data: {
              quotationId: id,
              amount: invoiceAmount > 0 ? invoiceAmount : 100,
              status: InvoiceStatus.SENT,
            },
          })
        }

        // 2. Auto-provision real Subscriptions & initial billing schedules for subscription lines
        for (const line of q.lines) {
          if (line.subscriptionPlanId) {
            const existingSub = await tx.subscription.findUnique({ where: { quotationLineId: line.id } })
            if (!existingSub) {
              const newSub = await tx.subscription.create({
                data: {
                  quotationLineId: line.id,
                  planId: line.subscriptionPlanId,
                  status: SubscriptionStatus.ACTIVE,
                  startDate: new Date(),
                },
              })
              await tx.billingScheduleEntry.create({
                data: {
                  subscriptionId: newSub.id,
                  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                  amount: line.lineTotal,
                  status: BillingEntryStatus.PENDING,
                },
              })
            }
          }
        }

        // 3. Auto-allocate Warehouse Split for fulfillment if not existing
        const existingSplits = await tx.warehouseSplit.findMany({ where: { quotationId: id } })
        if (existingSplits.length === 0) {
          const primaryWarehouse = await tx.warehouse.findFirst()
          if (primaryWarehouse) {
            const totalQty = q.lines.reduce((s, l) => s + l.quantity, 0)
            await tx.warehouseSplit.create({
              data: {
                quotationId: id,
                warehouseId: primaryWarehouse.id,
                quantity: totalQty > 0 ? totalQty : 1,
                estimatedShipmentCost: 45.0,
              },
            })
          }
        }

        // 4. Audit Log
        await tx.auditLog.create({
          data: {
            entityType: 'Quotation',
            entityId: id,
            userId: session!.user.id,
            action: 'ORDER_CHECKOUT_CONFIRMED',
            reason:
              role === 'CUSTOMER'
                ? 'Customer confirmed and placed order via portal checkout'
                : `Order checked out & confirmed by ${role} (${session!.user.name || session!.user.email}) on client behalf`,
          },
        })
      }

      return q
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update quotation' }, { status: 500 })
  }
}

// DELETE /api/quotations/[id] — Delete DRAFT quotation
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { errorResponse } = await requireAuth([UserRole.REP, UserRole.MANAGER])
  if (errorResponse) return errorResponse

  try {
    const { id } = await params

    const quotation = await prisma.quotation.findUnique({ where: { id } })
    if (!quotation) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 })
    }

    if (quotation.status !== 'DRAFT') {
      return NextResponse.json({ error: `Cannot delete quotation in ${quotation.status} status` }, { status: 400 })
    }

    await prisma.quotation.delete({ where: { id } })

    return NextResponse.json({ message: 'Quotation deleted successfully' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete quotation' }, { status: 500 })
  }
}

