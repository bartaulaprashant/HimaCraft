# HimaCraft — AI Development Context

> Read this file together with `PROGRESS.md` before continuing work. Current source code and actual command output are the source of truth.

## Project overview

HimaCraft is a Nepal-focused e-commerce platform for Pashmina products and Nepalese handicrafts, serving domestic and international customers.

It is a single-store e-commerce platform, not a multi-vendor marketplace. Artisan and origin/authenticity information is associated with products.

The project is intended as a portfolio-grade fullstack application focused on maintainability, security, performance, scalability and deployment.

## Collaboration and implementation rules

- Develop and verify the backend before substantial frontend implementation.
- Use a modular monolith; do not split into microservices without a documented reason.
- Implement coherent, complete batches rather than many tiny steps.
- Inspect existing source files and schema before modifying them.
- Provide complete files or precise patches with exact paths and commands.
- Keep explanations concise and practical.
- Do not claim code is complete until the user confirms relevant checks.
- Never ask the user to expose `.env`, secrets, tokens or passwords.
- Preserve existing database data; avoid destructive Docker/database commands.
- Update documentation after each coherent implementation batch.
- Automated tests are currently deferred at the user's request. Use typecheck, build and manual API verification.
- At handoff, include current task, changed files, verification results, remaining issues and exact next action.

## Technology choices

### Backend

- Node.js 22, TypeScript, Express 5.
- PostgreSQL 17, Prisma 7 with PostgreSQL adapter.
- Redis 7, ioredis, BullMQ for background jobs.
- Zod validation, Winston logging.
- Argon2id password hashing.
- JWT access authentication and opaque refresh sessions.
- HTTP-only cookies and RBAC.
- Cloudinary uploads, Stripe test-mode payments, email and browser push integrations.

### Frontend

- React, TypeScript, Tailwind CSS.
- TanStack Query.
- Framer Motion and GSAP 2D animations.

### Infrastructure

- npm workspaces monorepo.
- Docker Compose for local PostgreSQL and Redis.
- GitHub Actions CI/CD.
- Nginx and HTTPS for VPS deployment.
- Ubuntu PC acting as a VPS initially; suitable free/low-cost cloud deployment later.

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

## Product roles and domain

Roles: `CUSTOMER`, `STAFF`, `ADMIN`.

Public registration assigns `CUSTOMER`. ADMIN and STAFF roles are currently assigned manually through Prisma Studio or trusted database administration. Never permit public users to select their own role.

Core domain includes products, categories, artisans, product variants, variant-level inventory, cart, wishlist, coupons, checkout, stock reservations, orders, payments, reviews, notifications and administration.

Important business rules:

- PostgreSQL is the source of truth.
- Money is stored as integer minor units (for NPR, paisa), unless a later documented decision changes this.
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

## Current implementation state

### Authentication and authorization — completed

- Customer registration and login.
- Argon2id password hashing.
- JWT access tokens and opaque refresh tokens stored as hashes.
- HTTP-only cookies named `hc_access` and `hc_refresh`.
- Refresh rotation and session revocation.
- Authentication and RBAC middleware.
- Password change and OTP password reset.
- Email/SMTP delivery tested by user.
- Cookie authentication is the normal browser flow.
- Bearer token is supported as middleware fallback; login does not return it in the response body.
- User confirmed the authentication functionality works.

### Customer profile and addresses — completed

- Get and update current customer profile.
- List, create, update and delete addresses.
- Address ownership enforcement.
- Default-address handling.
- User confirmed the functionality works.

### Category Management — implementation provided

- Category validation, service, controller and routes.
- Public category listing and slug lookup.
- ADMIN/STAFF-protected management routes.
- Parent-child hierarchy validation and cycle prevention.
- Deletion protection when products or children exist.
- Existing Prisma Category model reused; no migration required.
- User confirmed TypeScript typecheck passes.
- Production build and manual API verification remain pending.

## Known environment

- Project root on user's Ubuntu machine: `/home/prashant/Desktop/HimaCraft`.
- Node.js: `v22.22.1`.
- Docker Compose services: PostgreSQL 17 and Redis 7.
- Prisma 7.10.1.
- Prisma client import path: `../../generated/prisma/client.js`.
- Backend database singleton: `src/config/database.ts`, exports `prisma`.
- Prisma config: `apps/backend/prisma7.config.ts`.
- Do not assume local services are running without fresh confirmation.

## Development workflow

For each batch:

1. Read `AI_CONTEXT.md`, `PROGRESS.md` and relevant phase/architecture documents.
2. Inspect current relevant source files, package scripts and schema.
3. State implementation scope and assumptions.
4. Implement a coherent batch with exact file paths.
5. Provide commands for typecheck, build, migrations and/or manual verification as appropriate.
6. Review actual output and resolve errors.
7. Update API/database/architecture documentation where affected.
8. Update `PROGRESS.md` only after verification.
9. Add a concise entry to `DEVELOPMENT_LOG.md`.
10. Provide a concise handoff summary.

## Current phase and next action

- Phase 1 — repository/project setup: completed.
- Phase 2 — backend foundation: completed.
- Phase 3 — authentication and authorization: completed.
- Phase 4 — customer profile and address management: completed.
- Phase 5 — product catalogue and categories: in progress.

**Immediate next action:** Run the backend production build and manually verify Category Management endpoints. Then proceed to Product Management.

## New-chat continuation prompt

"Continue HimaCraft development. Read `docs/AI_CONTEXT.md` and `docs/PROGRESS.md`. Category Management has been implemented and TypeScript typecheck has passed, but production build and manual API verification are still pending. Continue from this point, inspect the current repository before changing anything, keep explanations concise, and update documentation after each verified batch."
