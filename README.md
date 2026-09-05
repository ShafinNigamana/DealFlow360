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
[■□□□□□□□□□] just getting started
```

we're currently:
- ✅ project scaffolded (Next.js + TS + Prisma)
- ✅ prisma schema designed (27 models, all relationships mapped)
- 🔄 wiring up auth + first API routes
- ⬜ quotation builder flow
- ⬜ approval routing engine
- ⬜ warehouse split algorithm
- ⬜ billing + subscriptions
- ⬜ customer portal
- ⬜ deal health dashboard

## 🚦 getting started

```bash
# install deps
npm install

# set up your .env (copy from .env.example when it exists)
# DATABASE_URL="postgresql://user:pass@localhost:5432/dealflow360_dev"

# run prisma migrations (once DB is ready)
npx prisma migrate dev

# start dev server
npm run dev
```

## 📝 docs

- [`PRD.md`](./md%20document%20files/PRD.md) — product requirements
- [`ARCHITECTURE.md`](./md%20document%20files/ARCHITECTURE.md) — stack, data model, architectural decisions
- [`DECISIONS_AND_REASONING.md`](./md%20document%20files/DECISIONS_AND_REASONING.md) — every technical decision defended

## 🧪 what we'd build next

if we had more time:
- multi-currency conversion logic
- full accounting system (invoice/payment is lightweight rn)
- OAuth providers (Google, GitHub)
- real-time notifications (WebSocket)
- PDF quotation generation

---

*built with ☕ and questionable sleep schedules for the Odoo hackathon*
