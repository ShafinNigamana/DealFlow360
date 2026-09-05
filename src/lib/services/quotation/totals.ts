import { prisma } from '@/lib/prisma'

export async function recalculateQuotationLineTotal(
  productId: string,
  variantId: string | null,
  quantity: number,
  unitDiscountPercent: number
) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { variants: true },
  })

  if (!product) throw new Error('Product not found')

  let unitPrice = Number(product.basePrice)
  if (variantId) {
    const variant = product.variants.find((v) => v.id === variantId)
    if (variant) {
      unitPrice += Number(variant.extraPrice)
    }
  }

  const rawTotal = quantity * unitPrice
  const discountAmount = rawTotal * (unitDiscountPercent / 100)
  const lineTotal = Math.max(0, rawTotal - discountAmount)

  // Estimated cost / margin calculation (margin = lineTotal - base cost)
  const baseCost = quantity * Number(product.basePrice) * 0.7 // 70% estimated COGS
  const margin = lineTotal - baseCost

  return {
    lineTotal: Math.round(lineTotal * 100) / 100,
    margin: Math.round(margin * 100) / 100,
  }
}
