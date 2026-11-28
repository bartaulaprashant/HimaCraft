# HimaCraft — Project Progress

> Status values: `Not started`, `In progress`, `Blocked`, `Implemented — unverified`, `Verified complete`.

## Current position

- **Current phase:** Phase 6 — Inventory and stock reservations.
- **Current task:** Inspect existing inventory models and implementation, then plan inventory management.
- **Last confirmed milestone:** Phase 5 product catalogue and category endpoints manually verified; backend TypeScript typecheck passed.
- **Next task:** Inspect the existing inventory and stock-reservation schema, routes and services before implementing inventory operations.
- Automated tests are deferred by user preference.
- Production build status for the latest Phase 5 batch has not been confirmed in this log.

## Phase overview

| Phase | Scope | Status |
|---|---|---|
| 1 | Repository and project setup | Verified complete |
| 2 | Backend foundation and infrastructure | Verified complete |
| 3 | Authentication and authorization | Verified complete |
| 4 | Customer profile and address management | Verified complete |
| 5 | Product catalogue, categories and artisans | Verified complete |
| 6 | Inventory and stock reservations | Not started |
| 7 | Cart and wishlist | Not started |
| 8 | Coupons and promotions | Not started |
| 9 | Checkout, shipping and order lifecycle | Not started |
| 10 | Payments and Stripe webhooks | Not started |
| 11 | Reviews and product recommendations | Not started |
| 12 | Notifications and browser push | Not started |
| 13 | Admin operations and analytics | Not started |
| 14 | Backend hardening and performance | Not started |
| 15 | Frontend implementation and integration | Not started |
| 16 | Production deployment and CI/CD | Not started |

## Phase 1 — Setup

- [x] npm workspaces monorepo.
- [x] Backend and frontend scaffolds.
- [x] Shared package and documentation directories.
- [x] Docker Compose configuration.

## Phase 2 — Backend foundation

- [x] PostgreSQL and Redis configured through Docker Compose.
- [x] Express and TypeScript backend foundation.
- [x] Prisma 7 configuration and PostgreSQL adapter.
- [x] Initial database connection/migration issue resolved.

## Phase 3 — Authentication and authorization

- [x] Customer registration and login.
- [x] Argon2id password hashing.
- [x] JWT access authentication.
- [x] Opaque refresh tokens stored as hashes.
- [x] HTTP-only access and refresh cookies.
- [x] Refresh-token rotation and session handling.
- [x] Logout/session revocation functionality.
- [x] Authentication middleware.
- [x] RBAC middleware (`CUSTOMER`, `STAFF`, `ADMIN`).
- [x] Password change.
- [x] Password-reset OTP flow.
- [x] Email/SMTP delivery verified by user.
- [x] Cookie-based authentication with Bearer-token fallback in middleware.
- [x] User confirmed authentication functionality works.

### Role assignment

- Public registration assigns `CUSTOMER`.
- `ADMIN` and `STAFF` are currently assigned manually through Prisma Studio or trusted database administration.
- Do not expose role selection through public registration.

## Phase 4 — Customer profile and address management

- [x] Get current customer profile.
- [x] Update customer profile.
- [x] List customer addresses.
- [x] Create customer address.
- [x] Update customer address.
- [x] Delete customer address.
- [x] Enforce address ownership.
- [x] Handle default-address behavior.
- [x] User confirmed the functionality works.

### Endpoints

- `GET /api/v1/customers/me`
- `PATCH /api/v1/customers/me`
- `GET /api/v1/customers/addresses`
- `POST /api/v1/customers/addresses`
- `PATCH /api/v1/customers/addresses/:addressId`
- `DELETE /api/v1/customers/addresses/:addressId`

## Phase 5 — Product catalogue and categories

<badge color="success">Verified complete</badge>

### Category Management

- [x] Category validation, service, controller and routes.
- [x] Public category listing and lookup by slug.
- [x] ADMIN/STAFF category listing and management.
- [x] Category creation and update.
- [x] Category deletion with product/child protection.
- [x] Parent-child hierarchy validation and cycle prevention.
- [x] Existing Category model reused; no migration required.
- [x] User verified endpoints.
  
### Product Management

- [x] Product creation.
- [x] Product lookup by ID.
- [x] Product update.
- [x] Product archive instead of hard deletion.
- [x] Automatic slug generation and uniqueness handling.
- [x] Category and artisan reference validation.

### Artisan Management

- [x] Artisan listing and lookup.
- [x] Artisan creation and update.
- [x] Artisan deactivation instead of hard deletion.
- [x] Automatic slug generation and uniqueness handling.

### Product variants

- [x] List, create, get, update and deactivate variants.
- [x] SKU uniqueness handling.
- [x] Variant ownership validation against parent product.
- [x] Automatic inventory record creation with quantity and reserved set to zero.

### Product images

- [x] Cloudinary integration and upload middleware.
- [x] Product image listing and upload.
- [x] Image metadata update.
- [x] Set primary image.
- [x] Delete image and promote next image when deleting the primary.
- [x] Best-effort Cloudinary cleanup.

### Public catalogue

- [x] Public product listing.
- [x] Search and filtering.
- [x] Sorting and pagination.
- [x] Public product detail lookup by slug.
- [x] Active products and active variants included in public catalogue responses.

### Phase 5 verification

- [x] User manually verified endpoint groups.
- [x] Backend TypeScript typecheck passed.
- [ ] Production build result recorded.

Known follow-up items:
- Optimize price sorting, which currently loads matching products and sorts in application code before pagination.
- Consider stronger image validation using actual file content rather than trusting MIME metadata.
- Consider a database-level strategy to guarantee at most one primary image per product under concurrent writes.
- Monitor and clean up orphaned Cloudinary assets when provider cleanup fails.

## Phase 6 — Inventory and stock reservations

<badge color="info">Next</badge>

### Before implementation

- [ ] Inspect the complete current Prisma definitions for Inventory, InventoryMovement and StockReservation.
- [ ] Inspect existing inventory-related routes, services, controllers and validation schemas.
- [ ] Confirm how inventory is currently created with product variants.
- [ ] Define stock adjustment and reservation state-transition rules.
- [ ] Define concurrency-safe transaction strategy.
- [ ] Implement inventory management endpoints.
- [ ] Implement stock reservation lifecycle.
- [ ] Manually verify endpoints and edge cases.
- [ ] Update API and database documentation.

Do not recreate existing models or introduce migrations without first inspecting the current schema.

## Verification policy

- Use TypeScript typecheck and production build.
- Verify API behavior manually with Postman or an equivalent API client.
- Automated tests are deferred by user preference.
- Mark features `Verified complete` only after the relevant verification is confirmed by the user.

## Important cautions

- Never commit or share `.env`.
- Never expose passwords, JWT secrets, SMTP credentials or tokens.
- Do not reset Docker volumes to fix database issues.
- Preserve existing database data.
- Inspect existing schema and code before adding or changing models, routes or services.
