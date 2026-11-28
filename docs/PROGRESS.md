# HimaCraft — Project Progress

> Status values: `Not started`, `In progress`, `Blocked`, `Implemented — unverified`, `Verified complete`.

## Current position

- **Current phase:** Phase 8 — Checkout, shipping and order lifecycle.
- **Current task:** Inspect the existing order-related Prisma models, services and routes before designing checkout.
- **Last confirmed milestone:** Phase 7 Cart and Wishlist implementation completed; backend TypeScript typecheck passed.
- **Next task:** Inspect the existing order schema, address handling, inventory reservation lifecycle and cart implementation before implementing checkout.
- Phase 8 (Coupons and Promotions) has been permanently removed from the current project scope. Checkout is now Phase 8.
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
| 6 | Inventory and stock reservations | Implemented — endpoint verification skipped |
| 7 | Cart and wishlist | Implemented — typecheck passed; endpoint verification pending |
| 8 | Checkout, shipping and order lifecycle | Not started |
| 9 | Payments and Stripe webhooks | Not started |
| 10 | Reviews and product recommendations | Not started |
| 11 | Notifications and browser push | Not started |
| 12 | Admin operations and analytics | Not started |
| 13 | Backend hardening and performance | Not started |
| 14 | Frontend implementation and integration | Not started |
| 15 | Production deployment and CI/CD | Not started |

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

<badge color="success">Implemented</badge>

- [x] Inventory management service.
- [x] Stock adjustment with transaction-safe database operations.
- [x] Stock reservation lifecycle: reserve, confirm, release and expiry.
- [x] Stripe reservation expiry background job using BullMQ.
- [x] Inventory worker startup and graceful shutdown integration.
- [x] Backend TypeScript typecheck passed.
- [x] User confirmed the backend and inventory worker start successfully.
- [ ] Endpoint verification intentionally skipped at the user's request.
- [ ] Update detailed API/database documentation if required by future changes.

## Phase 7 — Cart and wishlist

<badge color="success">Implemented</badge>

### Cart
- [x] Retrieve authenticated customer's cart.
- [x] Add a product variant to cart.
- [x] Increase quantity when the variant already exists.
- [x] Update cart item quantity.
- [x] Remove a cart item.
- [x] Clear the cart.
- [x] Validate active product and variant.
- [x] Validate available inventory when adding or updating quantities.
- [x] Calculate line totals, subtotal, item count and availability.
- [x] Use server-side product prices; never trust client-provided prices.
- [x] Restrict cart endpoints to CUSTOMER accounts.
- [x] Apply trusted-origin protection to mutations.

### Wishlist
- [x] Retrieve authenticated customer's wishlist.
- [x] Add a product variant.
- [x] Prevent duplicate entries through the existing unique constraint.
- [x] Remove a wishlist item.
- [x] Include product, variant and inventory information.
- [x] Restrict wishlist endpoints to CUSTOMER accounts.
- [x] Apply trusted-origin protection to mutations.

### Phase 7 verification
- [x] Backend TypeScript typecheck passed.
- [ ] Endpoint verification not yet confirmed.

## Phase 8 — Checkout, shipping and order lifecycle

<badge color="info">Next</badge>

### Before implementation
- [ ] Inspect existing Order, OrderItem, OrderStatus and related Prisma models.
- [ ] Inspect customer address implementation and ownership rules.
- [ ] Inspect cart and inventory reservation services.
- [ ] Define checkout validation and price snapshot rules.
- [ ] Define transaction-safe order creation and inventory reservation.
- [ ] Define shipping address snapshot and shipping cost handling.
- [ ] Define order status transitions and cancellation behavior.
- [ ] Implement customer checkout and order endpoints.
- [ ] Implement ADMIN/STAFF order management endpoints.
- [ ] Verify relevant endpoints and edge cases.
- [ ] Update API, database and progress documentation.

Coupons, discounts and promotional pricing are excluded from the current project scope. Do not add coupon or discount logic to checkout or order calculations.

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
