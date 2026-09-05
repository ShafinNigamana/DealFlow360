import { prisma } from '@/lib/prisma'
import { BackorderStatus } from '@prisma/client'

export interface SplitAllocation {
  warehouseId: string
  warehouseName: string
  productId: string
  allocatedQty: number
  availableQty: number
  shippingCostWeight: number
  estimatedShipmentCost: number
}

export interface SplitResult {
  quotationId: string
  allocations: SplitAllocation[]
  backorders: Array<{
    warehouseId: string
    warehouseName: string
    productId: string
    shortfall: number
  }>
  totalEstimatedShipping: number
  fullyAllocated: boolean
}

/**
 * Multi-Warehouse Stock Split Algorithm
 *
 * Strategy: Cost-optimized greedy allocation.
 * 1. For each quotation line, find all warehouses with stock for that product.
 * 2. Sort warehouses by shippingCostWeight ASC (cheapest shipping first).
 * 3. Greedily allocate from cheapest warehouse until demand is met.
 * 4. If total stock < demand, create a backorder for the shortfall at the last warehouse used.
 * 5. Persist WarehouseSplit records and Backorder records atomically.
 */
export async function computeWarehouseSplit(quotationId: string): Promise<SplitResult> {
  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
    include: {
      lines: {
        include: { product: true },
      },
    },
  })

  if (!quotation) {
    throw new Error(`Quotation not found: ${quotationId}`)
  }

  // Aggregate demand per product across all lines
  const demandByProduct = new Map<string, number>()
  for (const line of quotation.lines) {
    const current = demandByProduct.get(line.productId) || 0
    demandByProduct.set(line.productId, current + line.quantity)
  }

  const allocations: SplitAllocation[] = []
  const backorderEntries: Array<{
    warehouseId: string
    warehouseName: string
    productId: string
    shortfall: number
  }> = []

  // For each product, find warehouses with stock, sorted by cost
  for (const [productId, totalDemand] of demandByProduct.entries()) {
    const stocks = await prisma.warehouseStock.findMany({
      where: { productId, quantity: { gt: 0 } },
      include: { warehouse: true },
      orderBy: { warehouse: { shippingCostWeight: 'asc' } },
    })

    let remaining = totalDemand

    for (const stock of stocks) {
      if (remaining <= 0) break

      const allocQty = Math.min(remaining, stock.quantity)
      const costPerUnit = Number(stock.warehouse.shippingCostWeight)
      const estimatedCost = Math.round(allocQty * costPerUnit * 100) / 100

      allocations.push({
        warehouseId: stock.warehouseId,
        warehouseName: stock.warehouse.name,
        productId,
        allocatedQty: allocQty,
        availableQty: stock.quantity,
        shippingCostWeight: costPerUnit,
        estimatedShipmentCost: estimatedCost,
      })

      remaining -= allocQty
    }

    // If stock is insufficient, record a backorder
    if (remaining > 0) {
      const lastWarehouse = stocks.length > 0
        ? stocks[stocks.length - 1].warehouse
        : null

      backorderEntries.push({
        warehouseId: lastWarehouse?.id || 'UNASSIGNED',
        warehouseName: lastWarehouse?.name || 'No warehouse available',
        productId,
        shortfall: remaining,
      })
    }
  }

  const totalEstimatedShipping = allocations.reduce((sum, a) => sum + a.estimatedShipmentCost, 0)

  // Persist atomically
  await prisma.$transaction(async (tx) => {
    // Clear previous splits for this quotation
    const existingSplits = await tx.warehouseSplit.findMany({
      where: { quotationId },
      select: { id: true },
    })
    if (existingSplits.length > 0) {
      await tx.backorder.deleteMany({
        where: { warehouseSplitId: { in: existingSplits.map((s) => s.id) } },
      })
      await tx.warehouseSplit.deleteMany({ where: { quotationId } })
    }

    // Create new splits
    for (const alloc of allocations) {
      await tx.warehouseSplit.create({
        data: {
          quotationId,
          warehouseId: alloc.warehouseId,
          quantity: alloc.allocatedQty,
          estimatedShipmentCost: alloc.estimatedShipmentCost,
        },
      })
    }

    // Create backorders
    for (const bo of backorderEntries) {
      if (bo.warehouseId === 'UNASSIGNED') continue

      const split = await tx.warehouseSplit.findFirst({
        where: { quotationId, warehouseId: bo.warehouseId },
      })

      if (split) {
        await tx.backorder.create({
          data: {
            warehouseSplitId: split.id,
            quantityRemaining: bo.shortfall,
            status: BackorderStatus.PENDING,
          },
        })
      }
    }
  })

  return {
    quotationId,
    allocations,
    backorders: backorderEntries,
    totalEstimatedShipping: Math.round(totalEstimatedShipping * 100) / 100,
    fullyAllocated: backorderEntries.length === 0,
  }
}
