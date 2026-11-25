# HimaCraft — AI Development Context

> Read this file together with `PROGRESS.md` before continuing work. The repository and its current code are the source of truth; this document is a compact orientation guide, not proof that every listed feature is implemented.

## Project overview

HimaCraft is a Nepal-focused e-commerce platform for Pashmina products and Nepalese handicrafts, serving domestic and international customers. It is a portfolio-grade, moderately complex application focused on maintainability, security, performance, scalability and deployment.

The application is a single-store e-commerce platform, not a multi-vendor marketplace. Artisan and origin/authenticity information is associated with products.

## Collaboration and implementation rules

- Develop and verify the backend before starting substantial frontend implementation.
- Use a modular monolith; do not split into microservices without a documented reason.
- Implement coherent, complete batches rather than many tiny steps.
- Inspect the existing code and schema before modifying them. Never assume a file's current contents from an old conversation.
- Provide complete files or precise patches with exact paths, plus commands to run.
- Explain unfamiliar concepts briefly and practically; avoid unnecessary jargon.
- Prefer production-sensible patterns without adding enterprise complexity that the project does not need.
- Do not claim code is complete until the user has run the relevant checks and shared successful results.
- Never ask the user to expose `.env`, secrets, tokens, passwords or private database data.
- Preserve existing user data. Never recommend destructive commands such as `docker compose down -v` without an explicit, informed reason.
- Update documentation and `PROGRESS.md` after each verified batch.
- At the end of a work session, provide a concise handoff: current task, changed files, verification results, remaining issues and exact next action.
- If the current code conflicts with documentation, inspect it and reconcile the documentation rather than blindly following stale notes.

## Technology choices

### Backend
- Node.js 22, TypeScript, Express 5
- PostgreSQL 17, Prisma 7 with PostgreSQL adapter
- Redis 7, ioredis, BullMQ for background jobs
- Zod validation, Winston logging
- Argon2id password hashing
- JWT access/refresh authentication, HTTP-only cookies, RBAC
- Cloudinary uploads, Stripe test-mode payments, email and browser push integrations

### Frontend
- React, TypeScript, Tailwind CSS
- TanStack Query
- Framer Motion and GSAP 2D animations

### Infrastructure
- npm workspaces monorepo
- Docker Compose for local PostgreSQL and Redis
- GitHub Actions CI/CD
- Nginx and HTTPS for VPS deployment
- Ubuntu PC acting as a VPS initially; a suitable free/low-cost cloud deployment later

## Repository layout

```text
HimaCraft/
├── apps/
│   ├── backend/
│   └── frontend/
├── packages/
│   └── shared/
├── docs/
│   ├── phases/
│   ├── AI_CONTEXT.md
│   ├── PROGRESS.md
│   ├── ARCHITECTURE.md
│   ├── DATABASE.md
│   ├── API.md
│   ├── DECISIONS.md
│   └── DEVELOPMENT_LOG.md
├── docker-compose.yml
├── package.json
└── README.md
```

Actual repository contents may evolve. Inspect before assuming every path exists.

## Product roles and core domain

Roles: `CUSTOMER`, `STAFF`, `ADMIN`.

Core domain includes products, categories, artisans, product variants, variant-level inventory, cart, wishlist, coupons, checkout, stock reservations, orders, payments, reviews, notifications and administration.

Important business rules:
- PostgreSQL is the source of truth.
- Money is stored as integer minor units (for NPR, paisa) unless a later documented decision changes this.
- Inventory changes and stock reservations must be transactionally safe.
- Stripe webhooks, not browser redirects, are authoritative for asynchronous payment state.
- Webhook processing must be idempotent.
- Authorization must check both role and resource ownership where applicable.
- Background work belongs in workers/queues, not long-running HTTP request handlers.

## Backend architecture

- REST API prefix: `/api/v1`.
- Modular monolith organized by business module.
- PostgreSQL/Prisma for persistent data.
- Redis for caching, rate limiting and BullMQ.
- BullMQ workers run as a separate process while sharing backend code.
- Centralized validation, error handling, logging and security middleware.
- Keep controllers thin; business rules belong in services.
- External providers are isolated behind integration modules.

## Development workflow

For each batch:
1. Read `AI_CONTEXT.md`, `PROGRESS.md` and relevant phase/architecture documents.
2. Inspect the current relevant source files, package scripts and schema.
3. State the implementation scope and any assumptions.
4. Implement a coherent batch with exact file paths.
5. Provide commands for typecheck, tests, migrations and/or manual verification as appropriate.
6. Review actual output and resolve errors.
7. Update API/database/architecture documentation where affected.
8. Update `PROGRESS.md` only after verification.
9. Add a concise entry to `DEVELOPMENT_LOG.md`.
10. Provide a handoff summary.

## Current known environment

- Project root on user's Ubuntu machine: `/home/prashant/Desktop/HimaCraft`
- Node.js: `v22.22.1` (known working baseline; do not request an upgrade without a concrete compatibility reason).
- Docker Compose has PostgreSQL 17 and Redis 7 services.
- User confirmed the initial database connection/migration issue was resolved.
- Never assume local services are currently running; ask for or inspect fresh command output when relevant.

## Current phase

Phase 1 — repository/project setup: completed.
Phase 2 — backend foundation and initial database migration: completed according to user confirmation.
Phase 3 — authentication and authorization: starting; implementation status must be checked against the repository and `PROGRESS.md`.

## New-chat continuation prompt

"Continue HimaCraft development. Read `docs/AI_CONTEXT.md`, `docs/PROGRESS.md`, and the relevant phase document. Inspect the current repository files before changing anything. Continue from the next unverified task, follow the documented implementation workflow, and update the project documentation after each verified batch."
