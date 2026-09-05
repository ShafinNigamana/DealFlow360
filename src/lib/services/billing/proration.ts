import { prisma } from '@/lib/prisma'
import { SubscriptionCadence, SubscriptionStatus } from '@prisma/client'

export interface ProrationResult {
  subscriptionId: string
  action: 'UPGRADE' | 'DOWNGRADE' | 'CANCEL_MID_CYCLE'
  daysUsed: number
  daysInPeriod: number
  usageRatio: number
  creditAmount: number
  chargeAmount: number
  reason: string
}

/**
 * Proration Engine
 *
 * Handles mid-cycle subscription changes:
 * 1. CANCEL_MID_CYCLE: Credits unused portion of the current billing period.
 * 2. UPGRADE / DOWNGRADE: Credits remainder at old rate, charges remainder at new rate.
 *
 * Uses day-level granularity: (daysUsed / daysInPeriod) ratio.
 */
export async function calculateProration(
  subscriptionId: string,
  action: 'UPGRADE' | 'DOWNGRADE' | 'CANCEL_MID_CYCLE',
  newLineTotal?: number
): Promise<ProrationResult> {
  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: {
      plan: true,
      quotationLine: true,
      billingEntries: {
        orderBy: { dueDate: 'desc' },
        take: 1,
      },
    },
  })

  if (!subscription) {
    throw new Error(`Subscription not found: ${subscriptionId}`)
  }

  if (subscription.status !== SubscriptionStatus.ACTIVE) {
    throw new Error(`Cannot prorate a subscription in ${subscription.status} status`)
  }

  const now = new Date()
  const currentLineTotal = Number(subscription.quotationLine.lineTotal)

  // Determine period length in days based on cadence
  let daysInPeriod: number
  switch (subscription.plan.cadence) {
    case SubscriptionCadence.MONTHLY:
      daysInPeriod = 30
      break
    case SubscriptionCadence.QUARTERLY:
      daysInPeriod = 90
      break
    case SubscriptionCadence.YEARLY:
      daysInPeriod = 365
      break
    default:
      daysInPeriod = 30
  }

  // Find last billing entry to determine current period start
  const lastEntry = subscription.billingEntries[0]
  const periodStart = lastEntry ? new Date(lastEntry.dueDate) : new Date(subscription.startDate)

  // Calculate days used in current period
  const msElapsed = now.getTime() - periodStart.getTime()
  const daysUsed = Math.max(0, Math.min(daysInPeriod, Math.ceil(msElapsed / (1000 * 60 * 60 * 24))))
  const daysRemaining = daysInPeriod - daysUsed
  const usageRatio = daysUsed / daysInPeriod

  // Per-period amount at old rate
  let oldPeriodAmount: number
  switch (subscription.plan.cadence) {
    case SubscriptionCadence.MONTHLY:
      oldPeriodAmount = currentLineTotal
      break
    case SubscriptionCadence.QUARTERLY:
      oldPeriodAmount = currentLineTotal * 3
      break
    case SubscriptionCadence.YEARLY:
      oldPeriodAmount = currentLineTotal * 12
      break
    default:
      oldPeriodAmount = currentLineTotal
  }

  let creditAmount = 0
  let chargeAmount = 0
  let reason = ''

  switch (action) {
    case 'CANCEL_MID_CYCLE': {
      // Credit the unused portion
      creditAmount = Math.round(oldPeriodAmount * (daysRemaining / daysInPeriod) * 100) / 100
      chargeAmount = 0
      reason = `Cancellation mid-cycle. ${daysUsed}/${daysInPeriod} days used. Credited $${creditAmount} for ${daysRemaining} unused days.`

      // Issue credit note and update subscription status
      await prisma.$transaction(async (tx) => {
        if (creditAmount > 0) {
          await tx.creditNote.create({
            data: {
              subscriptionId,
              amount: creditAmount,
              reason,
            },
          })
        }

        await tx.subscription.update({
          where: { id: subscriptionId },
          data: { status: SubscriptionStatus.CANCELLED },
        })
      })
      break
    }

    case 'UPGRADE':
    case 'DOWNGRADE': {
      if (newLineTotal === undefined) {
        throw new Error('newLineTotal is required for UPGRADE/DOWNGRADE proration')
      }

      let newPeriodAmount: number
      switch (subscription.plan.cadence) {
        case SubscriptionCadence.MONTHLY:
          newPeriodAmount = newLineTotal
          break
        case SubscriptionCadence.QUARTERLY:
          newPeriodAmount = newLineTotal * 3
          break
        case SubscriptionCadence.YEARLY:
          newPeriodAmount = newLineTotal * 12
          break
        default:
          newPeriodAmount = newLineTotal
      }

      // Credit remaining at old rate
      creditAmount = Math.round(oldPeriodAmount * (daysRemaining / daysInPeriod) * 100) / 100
      // Charge remaining at new rate
      chargeAmount = Math.round(newPeriodAmount * (daysRemaining / daysInPeriod) * 100) / 100

      reason = `${action} mid-cycle. ${daysUsed}/${daysInPeriod} days used. Credited $${creditAmount} at old rate, charged $${chargeAmount} at new rate for ${daysRemaining} remaining days.`

      await prisma.$transaction(async (tx) => {
        if (creditAmount > 0) {
          await tx.creditNote.create({
            data: {
              subscriptionId,
              amount: creditAmount,
              reason: `${action} credit: unused portion at previous rate`,
            },
          })
        }
      })
      break
    }
  }

  return {
    subscriptionId,
    action,
    daysUsed,
    daysInPeriod,
    usageRatio: Math.round(usageRatio * 10000) / 10000,
    creditAmount,
    chargeAmount,
    reason,
  }
}
