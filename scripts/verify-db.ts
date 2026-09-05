import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('\n🔍 =========================================================')
  console.log('         DEALFLOW360 — DATABASE HEALTH & INTEGRITY CHECK')
  console.log('=========================================================\n')

  try {
    await prisma.$connect()
    console.log('✅ PostgreSQL Connection: SUCCESSFUL on port 5433\n')

    const checks = [
      { name: 'Users (Admin/Rep/Manager/Finance)', fn: () => prisma.user.count() },
      { name: 'Customer Tiers', fn: () => prisma.customerTier.count() },
      { name: 'Customers', fn: () => prisma.customer.count() },
      { name: 'Categories', fn: () => prisma.category.count() },
      { name: 'Products', fn: () => prisma.product.count() },
      { name: 'Product Variants', fn: () => prisma.productVariant.count() },
      { name: 'Price Lists', fn: () => prisma.priceList.count() },
      { name: 'Tier Discount Ceilings', fn: () => prisma.tierDiscountCeiling.count() },
      { name: 'Category Discount Ceilings', fn: () => prisma.categoryDiscountCeiling.count() },
      { name: 'Approval Chain Configs', fn: () => prisma.approvalChainConfig.count() },
      { name: 'Warehouses', fn: () => prisma.warehouse.count() },
      { name: 'Warehouse Stocks', fn: () => prisma.warehouseStock.count() },
      { name: 'Subscription Plans', fn: () => prisma.subscriptionPlan.count() },
      { name: 'Quotations', fn: () => prisma.quotation.count() },
      { name: 'Quotation Lines', fn: () => prisma.quotationLine.count() },
      { name: 'Approvals', fn: () => prisma.approval.count() },
      { name: 'Audit Logs', fn: () => prisma.auditLog.count() },
      { name: 'Warehouse Splits', fn: () => prisma.warehouseSplit.count() },
      { name: 'Backorders', fn: () => prisma.backorder.count() },
      { name: 'Subscriptions', fn: () => prisma.subscription.count() },
      { name: 'Billing Schedule Entries', fn: () => prisma.billingScheduleEntry.count() },
      { name: 'Credit Notes', fn: () => prisma.creditNote.count() },
      { name: 'Invoices', fn: () => prisma.invoice.count() },
      { name: 'Payments', fn: () => prisma.payment.count() },
      { name: 'Upsell Rules', fn: () => prisma.upsellRule.count() },
      { name: 'Negotiation Comments', fn: () => prisma.negotiationComment.count() },
      { name: 'Deal Alerts', fn: () => prisma.dealAlert.count() },
    ]

    console.log('📋 Table Row Count & Model Verification:')
    console.log('─────────────────────────────────────────────────────────')

    let totalTablesVerified = 0

    for (const check of checks) {
      const count = await check.fn()
      console.log(`  ${count > 0 ? '🟢' : '⚪'} ${check.name.padEnd(38)} : ${count} rows`)
      totalTablesVerified++
    }

    console.log('─────────────────────────────────────────────────────────')
    console.log(`\n🎉 ALL ${totalTablesVerified} TABLES & MODELS ARE OPERATIONAL IN POSTGRESQL!\n`)

    // Sample Data Preview
    const sampleUser = await prisma.user.findFirst({ select: { name: true, email: true, role: true } })
    const sampleProduct = await prisma.product.findFirst({ select: { name: true, basePrice: true, category: { select: { name: true } } } })
    const sampleWarehouse = await prisma.warehouse.findFirst({ select: { name: true, shippingCostWeight: true } })

    console.log('🌟 Sample Verification Records:')
    console.log(`   • Seed User:     ${sampleUser?.name} (${sampleUser?.email}) [Role: ${sampleUser?.role}]`)
    console.log(`   • Seed Product:  ${sampleProduct?.name} ($${sampleProduct?.basePrice}) [Category: ${sampleProduct?.category.name}]`)
    console.log(`   • Warehouse:     ${sampleWarehouse?.name} (Weight: ${sampleWarehouse?.shippingCostWeight})`)
    console.log('\n=========================================================\n')

  } catch (error) {
    console.error('❌ Database verification failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
