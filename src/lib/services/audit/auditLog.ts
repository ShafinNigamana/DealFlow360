import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export interface LogAuditParams {
  entityType: string
  entityId: string
  userId: string
  action: string
  reason?: string
}

/**
 * Creates an append-only audit log entry.
 * Can be executed inside a Prisma transaction ($transaction) or standard query context.
 */
export async function logAudit(
  params: LogAuditParams,
  tx?: Prisma.TransactionClient
) {
  const client = tx || prisma

  return await client.auditLog.create({
    data: {
      entityType: params.entityType,
      entityId: params.entityId,
      userId: params.userId,
      action: params.action,
      reason: params.reason || null,
    },
  })
}
