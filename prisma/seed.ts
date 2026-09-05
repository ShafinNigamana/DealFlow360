import { PrismaClient, UserRole, ApprovalLevel } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // 1. Password Hashing
  const defaultPassword = 'Password123!'
  const passwordHash = await bcrypt.hash(defaultPassword, 10)

  // 2. Seed Users
  console.log('👤 Seeding Users...')
  await prisma.user.upsert({
    where: { email: 'admin@dealflow360.com' },
    update: {},
    create: {
      name: 'System Admin',
      email: 'admin@dealflow360.com',
      passwordHash,
      role: UserRole.ADMIN,
    },
  })

  await prisma.user.upsert({
    where: { email: 'rep@dealflow360.com' },
    update: {},
    create: {
      name: 'Alex SalesRep',
      email: 'rep@dealflow360.com',
      passwordHash,
      role: UserRole.REP,
    },
  })

  await prisma.user.upsert({
    where: { email: 'manager@dealflow360.com' },
    update: {},
    create: {
      name: 'Morgan Manager',
      email: 'manager@dealflow360.com',
      passwordHash,
      role: UserRole.MANAGER,
    },
  })

  await prisma.user.upsert({
    where: { email: 'finance@dealflow360.com' },
    update: {},
    create: {
      name: 'Fiona Finance',
      email: 'finance@dealflow360.com',
      passwordHash,
      role: UserRole.FINANCE,
    },
  })

  console.log(`✅ Users created: Admin, Rep, Manager, Finance (Default Password: ${defaultPassword})`)

  // 3. Seed Customer Tiers
  console.log('🏷️ Seeding Customer Tiers...')
  const bronze = await prisma.customerTier.upsert({
    where: { name: 'BRONZE' },
    update: {},
    create: { name: 'BRONZE' },
  })

  const silver = await prisma.customerTier.upsert({
    where: { name: 'SILVER' },
    update: {},
    create: { name: 'SILVER' },
  })

  const gold = await prisma.customerTier.upsert({
    where: { name: 'GOLD' },
    update: {},
    create: { name: 'GOLD' },
  })

  const platinum = await prisma.customerTier.upsert({
    where: { name: 'PLATINUM' },
    update: {},
    create: { name: 'PLATINUM' },
  })

  // 4. Seed Customers
  console.log('🏢 Seeding Customers...')
  await prisma.customer.upsert({
    where: { email: 'contact@acme.com' },
    update: { tierId: gold.id },
    create: {
      name: 'Acme Corporation',
      email: 'contact@acme.com',
      passwordHash,
      tierId: gold.id,
    },
  })

  await prisma.customer.upsert({
    where: { email: 'procurement@globex.com' },
    update: { tierId: platinum.id },
    create: {
      name: 'Globex Corporation',
      email: 'procurement@globex.com',
      passwordHash,
      tierId: platinum.id,
    },
  })

  await prisma.customer.upsert({
    where: { email: 'tech@stark.com' },
    update: { tierId: silver.id },
    create: {
      name: 'Stark Industries',
      email: 'tech@stark.com',
      passwordHash,
      tierId: silver.id,
    },
  })

  await prisma.customer.upsert({
    where: { email: 'info@cyberdyne.com' },
    update: { tierId: bronze.id },
    create: {
      name: 'Cyberdyne Systems',
      email: 'info@cyberdyne.com',
      passwordHash,
      tierId: bronze.id,
    },
  })

  // 5. Seed Categories
  console.log('📦 Seeding Categories...')
  const softwareCategory = await prisma.category.upsert({
    where: { name: 'Software Licenses' },
    update: {},
    create: { name: 'Software Licenses' },
  })

  const hardwareCategory = await prisma.category.upsert({
    where: { name: 'Hardware & Devices' },
    update: {},
    create: { name: 'Hardware & Devices' },
  })

  const servicesCategory = await prisma.category.upsert({
    where: { name: 'Professional Services' },
    update: {},
    create: { name: 'Professional Services' },
  })

  const cloudCategory = await prisma.category.upsert({
    where: { name: 'Cloud Infrastructure' },
    update: {},
    create: { name: 'Cloud Infrastructure' },
  })

  // 6. Seed Products & Variants
  console.log('💻 Seeding Products...')
  const erpProduct = await prisma.product.upsert({
    where: { id: 'prod-erp-001' },
    update: {},
    create: {
      id: 'prod-erp-001',
      name: 'Enterprise ERP Core Suite',
      categoryId: softwareCategory.id,
      basePrice: 5000.0,
      unit: 'user/year',
      taxRate: 18.0,
      description: 'Complete ERP suite including sales, inventory, and accounting modules.',
    },
  })

  await prisma.productVariant.upsert({
    where: { id: 'var-erp-001' },
    update: {},
    create: {
      id: 'var-erp-001',
      productId: erpProduct.id,
      attributeName: 'Module',
      value: 'Standard Core',
      extraPrice: 0.0,
    },
  })

  await prisma.productVariant.upsert({
    where: { id: 'var-erp-002' },
    update: {},
    create: {
      id: 'var-erp-002',
      productId: erpProduct.id,
      attributeName: 'Module',
      value: 'AI Copilot Addon',
      extraPrice: 1500.0,
    },
  })

  const serverProduct = await prisma.product.upsert({
    where: { id: 'prod-server-001' },
    update: {},
    create: {
      id: 'prod-server-001',
      name: 'High-Performance Server Node X1',
      categoryId: hardwareCategory.id,
      basePrice: 12000.0,
      unit: 'box',
      taxRate: 18.0,
      description: 'Rackmount 2U server node for heavy enterprise workloads.',
    },
  })

  await prisma.productVariant.upsert({
    where: { id: 'var-server-001' },
    update: {},
    create: {
      id: 'var-server-001',
      productId: serverProduct.id,
      attributeName: 'RAM Capacity',
      value: '64GB DDR5',
      extraPrice: 0.0,
    },
  })

  await prisma.productVariant.upsert({
    where: { id: 'var-server-002' },
    update: {},
    create: {
      id: 'var-server-002',
      productId: serverProduct.id,
      attributeName: 'RAM Capacity',
      value: '256GB DDR5 ECC',
      extraPrice: 3500.0,
    },
  })

  const servicesProduct = await prisma.product.upsert({
    where: { id: 'prod-consulting-001' },
    update: {},
    create: {
      id: 'prod-consulting-001',
      name: 'Solutions Architecture Consulting',
      categoryId: servicesCategory.id,
      basePrice: 150.0,
      unit: 'hour',
      taxRate: 18.0,
      description: 'Dedicated senior architect consulting and integration engineering.',
    },
  })

  const cloudNodeProduct = await prisma.product.upsert({
    where: { id: 'prod-cloud-001' },
    update: {},
    create: {
      id: 'prod-cloud-001',
      name: 'Managed K8s Cluster Worker Node',
      categoryId: cloudCategory.id,
      basePrice: 400.0,
      unit: 'node/month',
      taxRate: 18.0,
      description: 'Fully managed Kubernetes node with auto-scaling and monitoring.',
    },
  })

  // 7. Seed Tier Discount Ceilings
  console.log('🛡️ Seeding Discount Governance...')
  await prisma.tierDiscountCeiling.upsert({
    where: { tierId: bronze.id },
    update: { maxDiscountPercent: 10.0 },
    create: { tierId: bronze.id, maxDiscountPercent: 10.0 },
  })

  await prisma.tierDiscountCeiling.upsert({
    where: { tierId: silver.id },
    update: { maxDiscountPercent: 15.0 },
    create: { tierId: silver.id, maxDiscountPercent: 15.0 },
  })

  await prisma.tierDiscountCeiling.upsert({
    where: { tierId: gold.id },
    update: { maxDiscountPercent: 25.0 },
    create: { tierId: gold.id, maxDiscountPercent: 25.0 },
  })

  await prisma.tierDiscountCeiling.upsert({
    where: { tierId: platinum.id },
    update: { maxDiscountPercent: 40.0 },
    create: { tierId: platinum.id, maxDiscountPercent: 40.0 },
  })

  // 8. Seed Category Discount Ceilings
  await prisma.categoryDiscountCeiling.upsert({
    where: { categoryId: softwareCategory.id },
    update: { maxDiscountPercent: 30.0 },
    create: { categoryId: softwareCategory.id, maxDiscountPercent: 30.0 },
  })

  await prisma.categoryDiscountCeiling.upsert({
    where: { categoryId: hardwareCategory.id },
    update: { maxDiscountPercent: 15.0 },
    create: { categoryId: hardwareCategory.id, maxDiscountPercent: 15.0 },
  })

  await prisma.categoryDiscountCeiling.upsert({
    where: { categoryId: servicesCategory.id },
    update: { maxDiscountPercent: 20.0 },
    create: { categoryId: servicesCategory.id, maxDiscountPercent: 20.0 },
  })

  await prisma.categoryDiscountCeiling.upsert({
    where: { categoryId: cloudCategory.id },
    update: { maxDiscountPercent: 25.0 },
    create: { categoryId: cloudCategory.id, maxDiscountPercent: 25.0 },
  })

  // 9. Seed Approval Chains
  const existingChains = await prisma.approvalChainConfig.count()
  if (existingChains === 0) {
    await prisma.approvalChainConfig.createMany({
      data: [
        {
          minDiscountPercent: 15.0,
          maxDiscountPercent: 25.0,
          requiredLevel: ApprovalLevel.MANAGER,
        },
        {
          minDiscountPercent: 25.0,
          maxDiscountPercent: 100.0,
          requiredLevel: ApprovalLevel.MANAGER_THEN_FINANCE,
        },
      ],
    })
  }

  // 10. Seed Warehouses & Stock
  console.log('🏭 Seeding Warehouses & Stock...')
  const warehouseAlpha = await prisma.warehouse.upsert({
    where: { name: 'Warehouse Alpha (US East)' },
    update: { shippingCostWeight: 1.0 },
    create: {
      id: 'wh-alpha-001',
      name: 'Warehouse Alpha (US East)',
      shippingCostWeight: 1.0,
    },
  })

  const warehouseBeta = await prisma.warehouse.upsert({
    where: { name: 'Warehouse Beta (EU Central)' },
    update: { shippingCostWeight: 1.5 },
    create: {
      id: 'wh-beta-001',
      name: 'Warehouse Beta (EU Central)',
      shippingCostWeight: 1.5,
    },
  })

  await prisma.warehouseStock.upsert({
    where: {
      warehouseId_productId: {
        warehouseId: warehouseAlpha.id,
        productId: serverProduct.id,
      },
    },
    update: { quantity: 50 },
    create: {
      warehouseId: warehouseAlpha.id,
      productId: serverProduct.id,
      quantity: 50,
    },
  })

  await prisma.warehouseStock.upsert({
    where: {
      warehouseId_productId: {
        warehouseId: warehouseBeta.id,
        productId: serverProduct.id,
      },
    },
    update: { quantity: 20 },
    create: {
      warehouseId: warehouseBeta.id,
      productId: serverProduct.id,
      quantity: 20,
    },
  })

  await prisma.warehouseStock.upsert({
    where: {
      warehouseId_productId: {
        warehouseId: warehouseAlpha.id,
        productId: erpProduct.id,
      },
    },
    update: { quantity: 1000 },
    create: {
      warehouseId: warehouseAlpha.id,
      productId: erpProduct.id,
      quantity: 1000,
    },
  })

  console.log('✨ Database seeding complete!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
