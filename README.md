# 🚀 DealFlow360

> **the b2b sales ops platform that governs itself so you don't have to**

---

## 💡 what is this

DealFlow360 is a full-stack B2B sales operations platform built for an **Odoo hackathon**. It goes beyond basic quote-to-invoice flows:

- 🎯 **multi-tier discount governance** — blended risk scoring that catches margin leakage across every line item, not just one order-level total
- ✅ **smart approval routing** — tier + category ceilings + blended risk score determine who needs to sign off (Sales Manager → Finance)
- 🏭 **multi-warehouse fulfillment splitting** — stock-aware split algorithm with shipping-cost weighting and backorder consolidation
- 💳 **hybrid billing** — one-time + recurring subscription lines in the same quotation, with automated proration on mid-cycle changes
- 🤝 **customer portal negotiation** — customer counter-proposals with inline thread dialogue that auto-re-enters approval when discount ceilings are exceeded
- 📊 **deal health monitoring** — stalled deals, discount anomalies, delivery slippage detection & alerts

---

## 🛠️ stack & design system

```
Next.js 16 (App Router) · TypeScript · Prisma · PostgreSQL · Auth.js v5 · Lucide Icons
```

- **Palette**: `#FAFAFA` background, `#FFFFFF` surface cards, `#E4E4E7` borders, `#18181B` primary text, `#4F46E5` indigo accent fill
- **Status Pills**: Muted green (approved/paid), amber (pending/warning), red (rejected/over-limit), gray (draft/inactive)
- **Shared Stepper**: Circle-and-line stepper for Approval governance and Invoice payment progress

---

## 📍 project status

```
[██████████] Backend 100% Complete · Frontend 100% Complete (Production Ready)
```

- ✅ **Shared API Contracts**: `src/types/api-contracts.ts` standardizing all 21 module request/response DTOs
- ✅ **Authentication**: NextAuth Credentials provider with role-based session middleware
- ✅ **All 18 Screens Built**:
  1. Login / Signup (`/login`)
  2. Sales Executive Dashboard (`/dashboard`)
  3. Quotations List & Kanban Board (`/quotations`)
  4. Quotation Builder & Live Governance (`/quotations/[id]`)
  5. Approvals List (`/approvals`)
  6. Approval Detail & Decision Stepper (`/approvals/[id]`)
  7. Fulfillment & Warehouse Stock (`/fulfillment`)
  8. Warehouse Split Detail (`/fulfillment/[id]`)
  9. Subscriptions List (`/subscriptions`)
  10. Billing Detail & Proration (`/subscriptions/[id]`)
  11. Customer Portal Negotiation (`/portal/quotation/[id]`)
  12. Invoices List (`/invoices`)
  13. Invoice Detail & Payment Stepper (`/invoices/[id]`)
  14. Deal Health & Anomaly Dashboard (`/deal-health`)
  15. Admin Reports & Export (`/admin/reports`)
  16. Admin Products Catalog (`/admin/products`)
  17. Discount Setup Policy Matrix (`/admin/discount-config`)

---

## 🚦 getting started

```bash
# 1. navigate to project directory
cd DealFlow360

# 2. install dependencies
npm install

# 3. generate prisma client
npx prisma generate

# 4. seed demo data
npm run db:seed

# 5. start development server (runs both backend API and frontend UI)
npm run dev
```

Open [http://localhost:3000/login](http://localhost:3000/login) in your browser.

### 👤 Demo Credentials
Password for all demo accounts: `password123`
- **Sales Rep**: `rep1@dealflow360.com`
- **Sales Manager**: `manager@dealflow360.com`
- **Finance**: `finance@dealflow360.com`
- **Admin**: `admin@dealflow360.com`
- **Customer**: `customer1@acme.com`

---

## 📝 docs

- [`PRD.md`](../files_to_read/PRD.md) — product requirements
- [`ARCHITECTURE.md`](../files_to_read/ARCHITECTURE.md) — stack, data model, architectural decisions
- [`DECISIONS_AND_REASONING.md`](../files_to_read/DECISIONS_AND_REASONING.md) — technical decision rationale
- [`MVP_WORK_DIVISION.md`](../files_to_read/MVP_WORK_DIVISION.md) — task division and build sequence
