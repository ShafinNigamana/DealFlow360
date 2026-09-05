// ──────────────────────────────────────────────
// Domain Enums (explicit union definitions)
// ──────────────────────────────────────────────

export type UserRole = 'REP' | 'MANAGER' | 'FINANCE' | 'ADMIN'

export type QuotationStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'SENT'
  | 'CONFIRMED'
  | 'FULFILLED'
  | 'CANCELLED'

export type ApprovalLevel = 'MANAGER' | 'MANAGER_THEN_FINANCE'

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export type SubscriptionCadence = 'MONTHLY' | 'QUARTERLY' | 'YEARLY'

export type SubscriptionStatus = 'ACTIVE' | 'PAUSED' | 'CANCELLED' | 'EXPIRED'

export type BillingEntryStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED'

export type BackorderStatus = 'PENDING' | 'PARTIALLY_FULFILLED' | 'FULFILLED' | 'CANCELLED'

export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED'

export type DealAlertType = 'STALLED' | 'ANOMALY' | 'SLIPPAGE'

export type DealAlertStatus = 'OPEN' | 'ACKNOWLEDGED' | 'ESCALATED'

export type NegotiationAuthorType = 'REP' | 'CUSTOMER' | 'MANAGER'

// ──────────────────────────────────────────────
// Basic Entities & DTOs
// ──────────────────────────────────────────────

export interface UserDTO {
  id: string
  name: string
  email: string
  role: UserRole
  createdAt?: string
  updatedAt?: string
}

export interface CustomerTierDTO {
  id: string
  name: string
}

export interface CustomerDTO {
  id: string
  name: string
  email: string
  tierId?: string | null
  tier?: CustomerTierDTO | null
  createdAt?: string
}

export interface CategoryDTO {
  id: string
  name: string
}

export interface ProductVariantDTO {
  id: string
  productId: string
  attributeName: string
  value: string
  extraPrice: number | string
}

export interface ProductDTO {
  id: string
  name: string
  categoryId: string
  category?: CategoryDTO
  basePrice: number | string
  unit: string
  taxRate: number | string
  description?: string | null
  variants?: ProductVariantDTO[]
  createdAt?: string
}

export interface PriceListDTO {
  id: string
  productId: string
  tierId: string
  currency: string
  price: number | string
  product?: ProductDTO
  tier?: CustomerTierDTO
}

export interface TierDiscountCeilingDTO {
  id: string
  tierId: string
  maxDiscountPercent: number | string
  tier?: CustomerTierDTO
}

export interface CategoryDiscountCeilingDTO {
  id: string
  categoryId: string
  maxDiscountPercent: number | string
  category?: CategoryDTO
}

export interface ApprovalChainConfigDTO {
  id: string
  minDiscountPercent: number | string
  maxDiscountPercent: number | string
  requiredLevel: ApprovalLevel
}

// ──────────────────────────────────────────────
// Quotation & Lines DTOs
// ──────────────────────────────────────────────

export interface QuotationLineDTO {
  id: string
  quotationId: string
  productId: string
  variantId?: string | null
  quantity: number
  unitDiscountPercent: number | string
  subscriptionPlanId?: string | null
  lineTotal: number | string
  margin: number | string
  product?: ProductDTO
  variant?: ProductVariantDTO | null
  subscriptionPlan?: SubscriptionPlanDTO | null
}

export interface ApprovalDTO {
  id: string
  quotationId: string
  level: ApprovalLevel
  approverId: string
  status: ApprovalStatus
  reason?: string | null
  createdAt: string
  approver?: Partial<UserDTO>
}

export interface NegotiationCommentDTO {
  id: string
  quotationId: string
  authorType: NegotiationAuthorType
  comment: string
  counterDiscountPercent?: number | string | null
  createdAt: string
}

export interface QuotationDTO {
  id: string
  customerId: string
  repId: string
  status: QuotationStatus
  blendedRiskScore: number | string
  createdAt: string
  updatedAt: string
  customer?: CustomerDTO
  rep?: Partial<UserDTO>
  lines?: QuotationLineDTO[]
  approvals?: ApprovalDTO[]
  negotiationComments?: NegotiationCommentDTO[]
  warehouseSplits?: WarehouseSplitDTO[]
  invoices?: InvoiceDTO[]
  dealAlerts?: DealAlertDTO[]
}

// ──────────────────────────────────────────────
// Warehouse & Fulfillment DTOs
// ──────────────────────────────────────────────

export interface WarehouseDTO {
  id: string
  name: string
  shippingCostWeight: number | string
}

export interface WarehouseStockDTO {
  id: string
  warehouseId: string
  productId: string
  quantity: number
  replenishmentThreshold: number
  warehouse?: WarehouseDTO
  product?: ProductDTO
}

export interface WarehouseSplitDTO {
  id: string
  quotationId: string
  warehouseId: string
  quantity: number
  estimatedShipmentCost: number | string
  warehouse?: WarehouseDTO
  backorders?: BackorderDTO[]
}

export interface BackorderDTO {
  id: string
  warehouseSplitId: string
  quantityRemaining: number
  status: BackorderStatus
  createdAt: string
  updatedAt: string
}

// ──────────────────────────────────────────────
// Subscriptions & Billing DTOs
// ──────────────────────────────────────────────

export interface SubscriptionPlanDTO {
  id: string
  name: string
  cadence: SubscriptionCadence
  prorationRule: string
  cancellationRule: string
}

export interface SubscriptionDTO {
  id: string
  quotationLineId: string
  planId: string
  status: SubscriptionStatus
  startDate: string
  createdAt: string
  updatedAt: string
  plan?: SubscriptionPlanDTO
  quotationLine?: QuotationLineDTO
  billingEntries?: BillingScheduleEntryDTO[]
  creditNotes?: CreditNoteDTO[]
}

export interface BillingScheduleEntryDTO {
  id: string
  subscriptionId: string
  dueDate: string
  amount: number | string
  status: BillingEntryStatus
}

export interface CreditNoteDTO {
  id: string
  subscriptionId: string
  amount: number | string
  reason: string
  createdAt: string
}

// ──────────────────────────────────────────────
// Upsell DTOs
// ──────────────────────────────────────────────

export interface UpsellRuleDTO {
  id: string
  sourceProductId: string
  suggestedProductId: string
  isPromoted: boolean
  minMarginThreshold: number | string
  sourceProduct?: ProductDTO
  suggestedProduct?: ProductDTO
}

export interface UpsellSuggestionDTO {
  ruleId: string
  suggestedProduct: ProductDTO
  marginDelta: number
  reason: string
  isPromoted: boolean
}

// ──────────────────────────────────────────────
// Billing, Invoices & Payments DTOs
// ──────────────────────────────────────────────

export interface InvoiceDTO {
  id: string
  quotationId: string
  amount: number | string
  status: InvoiceStatus
  createdAt: string
  updatedAt: string
  quotation?: QuotationDTO
  payments?: PaymentDTO[]
}

export interface PaymentDTO {
  id: string
  invoiceId: string
  amount: number | string
  method: string
  paidAt: string
}

export interface DealAlertDTO {
  id: string
  quotationId: string
  type: DealAlertType
  status: DealAlertStatus
  createdAt: string
  quotation?: QuotationDTO
}

// ──────────────────────────────────────────────
// Dashboard & Aggregations
// ──────────────────────────────────────────────

export interface DashboardSummaryDTO {
  totalQuotations: number
  draftCount: number
  pendingApprovalCount: number
  approvedCount: number
  rejectedCount: number
  fulfilledCount: number
  openAlertsCount: number
}

export interface DashboardMetricsResponse {
  summary: DashboardSummaryDTO
  recentQuotations: QuotationDTO[]
}

// ──────────────────────────────────────────────
// Payload / Action DTOs
// ──────────────────────────────────────────────

export interface CreateQuotationDTO {
  customerId: string
}

export interface AddQuotationLineDTO {
  productId: string
  variantId?: string
  quantity: number
  unitDiscountPercent?: number
  subscriptionPlanId?: string
}

export interface UpdateQuotationLineDTO {
  quantity?: number
  unitDiscountPercent?: number
  variantId?: string
  subscriptionPlanId?: string
}

export interface ApprovalDecisionDTO {
  action: 'APPROVE' | 'REJECT' | 'RETURN'
  reason?: string
}

export interface SubmitNegotiationDTO {
  comment: string
  counterDiscountPercent?: number
}

export interface WarehouseSplitOverrideDTO {
  splits: {
    warehouseId: string
    quantity: number
  }[]
}

export interface RecordPaymentDTO {
  amount: number
  method: string
}
