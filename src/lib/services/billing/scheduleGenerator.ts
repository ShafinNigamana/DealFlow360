import { prisma } from '@/lib/prisma'
import { SubscriptionCadence, BillingEntryStatus } from '@prisma/client'

export interface ScheduleGenerationResult {
  subscriptionId: string
  entriesCreated: number
  totalBilled: number
  entries: Array<{
    dueDate: Date
    amount: number
  }>
}

/**
 * Generates a billing schedule for a subscription based on its plan's cadence.
 * Creates BillingScheduleEntry records for the upcoming billing period.
 *
 * @param subscriptionId - The subscription to generate billing for
 * @param periodsAhead  - How many billing periods to generate (default: 12)
 */
export async function generateBillingSchedule(
  subscriptionId: string,
  periodsAhead: number = 12
): Promise<ScheduleGenerationResult> {
  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: {
      plan: true,
      quotationLine: {
        include: { product: true },
      },
    },
  })

  if (!subscription) {
    throw new Error(`Subscription not found: ${subscriptionId}`)
  }

  const lineTotal = Number(subscription.quotationLine.lineTotal)
  const cadence = subscription.plan.cadence
  const startDate = new Date(subscription.startDate)

  // Calculate per-period amount based on cadence
  let periodAmount: number
  let monthsPerPeriod: number

  switch (cadence) {
    case SubscriptionCadence.MONTHLY:
      periodAmount = lineTotal
      monthsPerPeriod = 1
      break
    case SubscriptionCadence.QUARTERLY:
      periodAmount = lineTotal * 3
      monthsPerPeriod = 3
      break
    case SubscriptionCadence.YEARLY:
      periodAmount = lineTotal * 12
      monthsPerPeriod = 12
      break
    default:
      throw new Error(`Unsupported cadence: ${cadence}`)
  }

  periodAmount = Math.round(periodAmount * 100) / 100

  const entries: Array<{ dueDate: Date; amount: number }> = []

  for (let i = 0; i < periodsAhead; i++) {
    const dueDate = new Date(startDate)
    dueDate.setMonth(dueDate.getMonth() + i * monthsPerPeriod)

    entries.push({
      dueDate,
      amount: periodAmount,
    })
  }

  // Persist entries, skip any that already exist for these due dates
  let entriesCreated = 0
  let totalBilled = 0

  await prisma.$transaction(async (tx) => {
    for (const entry of entries) {
      const existing = await tx.billingScheduleEntry.findFirst({
        where: {
          subscriptionId,
          dueDate: entry.dueDate,
        },
      })

      if (!existing) {
        await tx.billingScheduleEntry.create({
          data: {
            subscriptionId,
            dueDate: entry.dueDate,
            amount: entry.amount,
            status: BillingEntryStatus.PENDING,
          },
        })
        entriesCreated++
      }

      totalBilled += entry.amount
    }
  })

  return {
    subscriptionId,
    entriesCreated,
    totalBilled: Math.round(totalBilled * 100) / 100,
    entries,
  }
}
