# HimaCraft — AI Development Context

> Read this file together with `PROGRESS.md` before continuing. Current source code and actual command output are the source of truth.

## Project overview

HimaCraft is a Nepal-focused single-store e-commerce platform for Pashmina products and Nepalese handicrafts, serving domestic and international customers.

Artisan and origin/authenticity information is associated with products. This is not a multi-vendor marketplace.

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
- Automated tests are deferred at the user's request. Use typecheck, build and manual API verification.
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
│   ├── AI_CONTEXT.md
│   ├── PROGRESS.md
│   ├── ARCHITECTURE.md
│   ├── DATABASE.md
│   ├── API.md
│   ├── DECISIONS.md
│   └── DEVELOPMENT_LOG.md
├── docker-compose.yml
├── package.json
└── package-lock.json
```

## Product roles and domain

Roles: `CUSTOMER`, `STAFF`, `ADMIN`.

Public registration assigns `CUSTOMER`. ADMIN and STAFF roles are currently assigned manually through Prisma Studio or trusted database administration. Never permit public users to select their own role.

Core domain includes users, addresses, categories, artisans, products, product variants, product images, inventory, inventory movements, cart, wishlist, stock reservations, orders, payments, reviews, notifications and administration. Coupons, discounts and promotional pricing are explicitly excluded from the current project scope.

Important business rules:

- PostgreSQL is the source of truth.
- Money is stored as integer minor units (for NPR, paisa).
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

### Authentication and authorization — verified complete

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
- Public registration creates CUSTOMER accounts only.
- User confirmed the authentication functionality works.

### Customer profile and addresses — verified complete

- Get and update current customer profile.
- List, create, update and delete addresses.
- Address ownership enforcement.
- Default-address handling.
- User confirmed the functionality works.

### Phase 5 — Product catalogue and categories — verified complete

#### Categories
- Public active-category listing and lookup by slug.
- ADMIN/STAFF category listing and management.
- Generated slugs when not supplied.
- Parent-child hierarchy validation and cycle prevention.
- Deletion blocked when products or child categories exist.
- Existing Prisma Category model reused; no schema migration required.

#### Products
- ADMIN/STAFF product creation, lookup by ID, update and archive.
- Generated slugs when not supplied.
- Category and optional artisan references validated.
- Archiving sets status to ARCHIVED and clears `isFeatured`; products are not hard-deleted.

#### Artisans
- ADMIN/STAFF artisan listing, lookup, creation, update and deactivation.
- Generated slugs when not supplied.
- Deactivation sets `isActive` to false instead of deleting the record.

#### Product variants
- ADMIN/STAFF nested variant management.
- SKU uniqueness handled.
- Creating a variant creates its inventory record with quantity and reserved both zero.
- Deactivation sets `isActive` to false rather than deleting the variant.

#### Product images
- ADMIN/STAFF image management through Cloudinary.
- Uploads use Multer memory storage and the multipart field `image`.
- Maximum upload size is 5 MB; accepted MIME types are JPEG, PNG and WebP.
- Primary image switching and fallback promotion after primary-image deletion are implemented.
- Failed database writes trigger a Cloudinary cleanup attempt.
- Database image deletion takes precedence over Cloudinary cleanup; failed cleanup can leave an orphaned Cloudinary asset.

#### Public catalogue
- Public product listing with search, filters, sorting and pagination.
- Public product detail lookup by slug.
- Only ACTIVE products appear in the public catalogue.
- Catalogue responses include category, artisan, primary image, active variants and inventory information.
- Price sorting currently loads matching products and sorts in application code before pagination. This is a known optimization opportunity.

User confirmed Phase 5 endpoint verification and TypeScript typecheck. Do not assume a production build was run unless separately confirmed.

### Phase 6 — Inventory and stock reservations — implemented

- Inventory management and stock adjustment service.
- Reservation lifecycle: reserve, confirm, release and expire.
- BullMQ worker handles Stripe reservation expiry.
- Worker startup and graceful shutdown integrated.
- Backend TypeScript typecheck passed.
- Endpoint verification was intentionally skipped at the user's request.

### Phase 7 — Cart and wishlist — implemented

- Customer cart retrieval, add, update, remove and clear operations.
- Customer wishlist retrieval, add and remove operations.
- Cart validates active products/variants and available stock.
- Cart totals use server-side variant prices.
- Wishlist entries are variant-specific.
- Customer-only authorization and trusted-origin protection on mutations.
- Backend TypeScript typecheck passed.
- Endpoint verification remains unconfirmed.

Coupons, discounts and promotional pricing are excluded from the current project scope. Do not introduce them in checkout, order or payment implementation.

## Known environment

- Project root: `/home/prashant/Desktop/HimaCraft`.
- Node.js: `v22.22.1`.
- Docker Compose services: PostgreSQL 17 and Redis 7.
- Prisma 7.
- Prisma client import path: `../../generated/prisma/client.js`.
- Backend database singleton: `apps/backend/src/config/database.ts`, exports `prisma`.
- Prisma config: `apps/backend/prisma7.config.ts`.
- Do not assume local services are running without fresh confirmation.

## Development workflow

For each batch:

1. Read `AI_CONTEXT.md`, `PROGRESS.md` and relevant architecture/database/API documentation.
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
- Phase 2 — backend foundation and infrastructure: completed.
- Phase 3 — authentication and authorization: completed.
- Phase 4 — customer profile and address management: completed.
- Phase 5 — product catalogue and categories: completed; endpoint groups manually verified.
- Phase 6 — inventory and stock reservations: implemented; backend typecheck and worker startup confirmed; endpoint verification intentionally skipped.
- Phase 7 — cart and wishlist: implemented; backend TypeScript typecheck passed; endpoint verification remains unconfirmed.
- Phase 8 — checkout, shipping and order lifecycle: completed. Customer order endpoints manually verified; admin/staff endpoints marked verified per user confirmation. Coupon/discount removal migration applied, Prisma Client regenerated and backend typecheck passed.

**Current phase: Phase 9 — Payments and Stripe webhooks.**

Immediate next action: inspect the existing `Payment` and `PaymentWebhookEvent` models, payment configuration, and inventory reservation-expiry workflow before implementing payment-provider integration. Stripe webhook events must be signature-verified and processed idempotently. Do not introduce coupons, discounts or promotional pricing. Automated tests remain deferred unless the user changes that preference.

## New-chat continuation prompt

"Continue HimaCraft development. Read `docs/AI_CONTEXT.md`, `docs/PROGRESS.md`, `docs/ARCHITECTURE.md`, `docs/DATABASE.md`, `docs/API.md` and `docs/DECISIONS.md`. Phases 1–5 are complete. Phases 6 and 7 are implemented; see `PROGRESS.md` for their endpoint-verification details. Phase 8 checkout and order lifecycle is complete. Customer order endpoints were manually verified and admin/staff endpoints were marked verified per user confirmation. The next phase is Phase 9: payments and Stripe webhooks. Coupons, discounts and promotional pricing are explicitly excluded from the project scope. Inspect the actual repository and Prisma schema before changing anything. Keep explanations concise, implement backend-first, and update existing documentation after verified implementation batches."
