import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding Price Lists & Upsell Rules for Demo Flow 2...')

  // 1. Fetch Products & Tiers
  const products = await prisma.product.findMany()
  const tiers = await prisma.customerTier.findMany()

  if (products.length < 2) {
    console.log('⚠️ Not enough products found to seed price lists or upsells.')
    return
  }

  // 2. Seed Price Lists
  console.log('📦 Seeding Price Lists...')
  for (const product of products) {
    for (const tier of tiers) {
      // Tier 1 / VIP gets 10% discount off base, Tier 4 gets base price
      const discountMult = tier.name.includes('TIER 1') || tier.name.includes('VIP') ? 0.9 : 1.0
      const tierPrice = Number(product.basePrice) * discountMult

      await prisma.priceList.upsert({
        where: {
          productId_tierId_currency: {
            productId: product.id,
            tierId: tier.id,
            currency: 'USD',
          },
        },
        update: { price: tierPrice },
        create: {
          productId: product.id,
          tierId: tier.id,
          currency: 'USD',
          price: tierPrice,
        },
      })
    }
  }

  const priceListCount = await prisma.priceList.count()
  console.log(`✅ Seeded ${priceListCount} Price List entries.`)

  // 3. Seed Upsell Rules
  console.log('💡 Seeding Upsell Rules...')
  // Link Product 0 -> Product 1 (Promoted)
  await prisma.upsellRule.upsert({
    where: {
      sourceProductId_suggestedProductId: {
        sourceProductId: products[0].id,
        suggestedProductId: products[1].id,
      },
    },
    update: { isPromoted: true, minMarginThreshold: 20 },
    create: {
      sourceProductId: products[0].id,
      suggestedProductId: products[1].id,
      isPromoted: true,
      minMarginThreshold: 20,
    },
  })

  // Link Product 0 -> Product 2 (if available)
  if (products.length > 2) {
    await prisma.upsellRule.upsert({
      where: {
        sourceProductId_suggestedProductId: {
          sourceProductId: products[0].id,
          suggestedProductId: products[2].id,
        },
      },
      update: { isPromoted: false, minMarginThreshold: 15 },
      create: {
        sourceProductId: products[0].id,
        suggestedProductId: products[2].id,
        isPromoted: false,
        minMarginThreshold: 15,
      },
    })
  }

  // Link Product 1 -> Product 2 (if available)
  if (products.length > 2) {
    await prisma.upsellRule.upsert({
      where: {
        sourceProductId_suggestedProductId: {
          sourceProductId: products[1].id,
          suggestedProductId: products[2].id,
        },
      },
      update: { isPromoted: true, minMarginThreshold: 25 },
      create: {
        sourceProductId: products[1].id,
        suggestedProductId: products[2].id,
        isPromoted: true,
        minMarginThreshold: 25,
      },
    })
  }

  const upsellCount = await prisma.upsellRule.count()
  console.log(`✅ Seeded ${upsellCount} Upsell Rules.`)
  console.log('🎉 Demo Seed Complete!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
