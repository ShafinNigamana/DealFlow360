# 🚀 DealFlow360

> **the b2b sales ops platform that governs itself so you don't have to**

---

## 💡 what is this

DealFlow360 is a full-stack B2B sales operations platform we're building for an **Odoo hackathon**. it's not just another quote-to-invoice tool — we're going deep:

- 🎯 **multi-tier discount governance** — blended risk scoring that catches margin leakage across every line item, not just one big number
- ✅ **smart approval routing** — tier + category ceilings + blended score determine who needs to sign off
- 🏭 **multi-warehouse fulfillment splitting** — live stock + shipping-cost weighting, manual override supported
- 💳 **hybrid billing** — one-time + recurring lines in the same quotation, proration on mid-cycle changes
- 🤝 **customer portal negotiation** — counter-proposals that auto-re-enter approval when thresholds are exceeded
- 📊 **deal health monitoring** — stalled deals, discount anomalies, delivery slippage alerts

## 🧠 the thinking

we chose **boring tech done right** over shiny complexity:

| decision | choice | why |
|---|---|---|
| architecture | single Next.js app, single PostgreSQL DB | 2 devs + hackathon = monolith is the correct call |
| orm | Prisma | type-safe queries + real `$transaction` for atomic ops |
| auth | Auth.js v5 + JWT sessions | extensible to OAuth later without rewrite |
| deployment | persistent Node server | avoids serverless + postgres connection pool hell |

> full rationale in `DECISIONS_AND_REASONING.md` — we can defend every choice

## 🛠️ stack

```
Next.js 16 · TypeScript · Prisma · PostgreSQL · Auth.js v5
```

## 👥 team

two devs, layer-split for MVP:
- **shafin** — backend (API routes, Prisma schema, `lib/services/` business logic)
- **teammate** — frontend (UI components, pages, state management)

## 📍 where we're at

```
[█████████░] Backend 100% Complete · Ready for Frontend Integration
```

- ✅ **Project Scaffolding**: Next.js 16 + TypeScript + Prisma 5
- ✅ **Database Architecture**: 27 models mapped, relational integrity, initial migration applied
- ✅ **Database Seeding**: Demo accounts (Admin, Rep, Manager, Finance), categories, products, customer tiers, warehouse stock
- ✅ **Authentication & RBAC**: Auth.js v5 Credentials Provider, JWT session callbacks, strict `withAuth` route guard
- ✅ **Quotation Engine**: CRUD, dynamic line item totals, currency precision, auto risk-score recalculation
- ✅ **Discount Governance**: Tier ceilings, category ceilings, blended deal risk score (0–100)
- ✅ **Multi-Level Approval Routing**: Dynamic level routing (Rep → Manager → VP → CEO), append-only audit trail
- ✅ **Warehouse Fulfillment Split**: Stock-aware split algorithm with shipping cost weighting & backorders
- ✅ **Hybrid Subscriptions & Billing**: One-time + recurring lines, schedule generator, mid-cycle proration engine
- ✅ **Negotiations & Upsell**: Customer portal counter-proposals with threshold-driven re-approval, rule-based cross-sell/upsell
- ✅ **Deal Health & Dashboard**: Stalled deals, discount anomaly detection, executive dashboard KPIs
- 🔄 **Frontend Connection**: API routes ready to consume with full TypeScript contracts

---

## 🔌 API Endpoints Summary

| Module | Endpoints | Description |
|---|---|---|
| **Auth** | `POST /api/auth/[...nextauth]` | Session login, JWT issuance, current session |
| **Catalog** | `/api/categories`, `/api/products`, `/api/products/[id]/variants` | Product catalog & variant management |
| **Pricing & Governance** | `/api/customer-tiers`, `/api/customers`, `/api/price-lists`, `/api/discount-ceilings/*` | Tier & category discount policies |
| **Quotations** | `/api/quotations`, `/api/quotations/[id]/lines`, `/api/quotations/[id]/submit` | Full quote builder & submission workflow |
| **Approvals** | `/api/approval-chains`, `/api/approvals/[id]/decide`, `/api/quotations/[id]/approvals` | Multi-level approval sign-off & audit log |
| **Fulfillment** | `/api/warehouses`, `/api/warehouses/[id]/stock`, `/api/quotations/[id]/warehouse-split`, `/api/backorders` | Multi-warehouse routing & backorder tracking |
| **Billing** | `/api/subscription-plans`, `/api/subscriptions`, `/api/billing-entries`, `/api/invoices`, `/api/payments` | Subscriptions, prorated invoicing, credit notes |
| **Growth & Analytics** | `/api/upsell-rules`, `/api/quotations/[id]/upsell-suggestions`, `/api/quotations/[id]/negotiations`, `/api/deal-alerts`, `/api/dashboard` | Upsells, counter-proposals, deal health KPIs |

---

## 🚦 getting started

```bash
# 1. install dependencies
npm install

# 2. launch postgresql (docker)
docker run --name dealflow-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=dealflow360_dev -p 5433:5432 -d postgres:16

# 3. set up your .env
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/dealflow360_dev"
AUTH_SECRET="super-secret-random-key-dealflow360-hackathon"
NEXTAUTH_URL="http://localhost:3000"

# 4. run prisma migrations
npx prisma migrate dev --name init

# 5. seed demo data
npm run db:seed

# 6. start development server
npm run dev

# 7. (optional) open database viewer
npx prisma studio
```

### 👤 Demo Credentials
All seeded users share the password: `Password123!`
- **Admin**: `admin@dealflow360.com` (Role: `ADMIN`)
- **Sales Rep**: `rep@dealflow360.com` (Role: `SALES_REP`)
- **Manager**: `manager@dealflow360.com` (Role: `SALES_MANAGER`)
- **Finance**: `finance@dealflow360.com` (Role: `FINANCE`)

---

## 📝 docs

- [`PRD.md`](./md%20document%20files/PRD.md) — product requirements
- [`ARCHITECTURE.md`](./md%20document%20files/ARCHITECTURE.md) — stack, data model, architectural decisions
- [`DECISIONS_AND_REASONING.md`](./md%20document%20files/DECISIONS_AND_REASONING.md) — every technical decision defended

---

*built with ☕ and questionable sleep schedules for the Odoo hackathon*
