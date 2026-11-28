# HimaCraft — Project Progress

> Status values: `Not started`, `In progress`, `Blocked`, `Implemented — unverified`, `Verified complete`.

## Current position

- **Current phase:** Phase 5 — Product catalogue and categories.
- **Current task:** Complete Category Management build and manual API verification.
- **Last confirmed milestone:** Category module TypeScript typecheck passed and build verified.
- **Next task:** Implement Product Management.
- Automated tests are deferred by user preference.

## Phase overview

| Phase | Scope | Status |
|---|---|---|
| 1 | Repository and project setup | Verified complete |
| 2 | Backend foundation and infrastructure | Verified complete |
| 3 | Authentication and authorization | Verified complete |
| 4 | Customer profile and address management | Verified complete |
| 5 | Product catalogue, categories and artisans | In progress |
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

### Category Management

- [x] Category validation schemas implemented.
- [x] Category service implemented.
- [x] Category controllers implemented.
- [x] Category routes implemented.
- [x] Public category listing.
- [x] Public category lookup by slug.
- [x] Admin/staff category listing.
- [x] Category creation and update.
- [x] Category deletion with product/child protection.
- [x] Parent-child category hierarchy validation.
- [x] TypeScript typecheck verified.
- [ ] Production build verified.
- [ ] Manual API verification completed.
- [ ] API documentation finalized.

No Prisma schema migration was required; the Category model already existed.

### Category endpoints

- `GET /api/v1/categories`
- `GET /api/v1/categories/:slug`
- `GET /api/v1/categories/admin`
- `POST /api/v1/categories`
- `PATCH /api/v1/categories/:categoryId`
- `DELETE /api/v1/categories/:categoryId`

### Remaining Phase 5 work

- [ ] Complete Category Management verification.
- [ ] Product Management.
- [ ] Artisan Management.
- [ ] Product variants and product images.
- [ ] Product listing, filtering and pagination.

## Verification policy

- Use TypeScript typecheck and production build.
- Verify API behavior manually with Postman or an equivalent API client.
- Automated tests are deferred by user preference.
- Mark features `Verified complete` only after the relevant verification is confirmed.

## Important cautions

- Never commit or share `.env`.
- Never expose passwords, JWT secrets, SMTP credentials or tokens.
- Do not reset Docker volumes to fix database issues.
- Preserve existing database data.
