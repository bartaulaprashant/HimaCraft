# HimaCraft — Architecture Decision Records

Record durable technical decisions here. Add new decisions with a date, context, decision and consequences. Do not silently reverse an existing decision.

## D-001 — Modular monolith

**Decision:** Build one modular backend application rather than microservices.

**Reason:** The project is developed by one learner/developer with AI assistance. A modular monolith provides clear boundaries without distributed-system overhead.

## D-002 — npm workspaces monorepo

**Decision:** Use npm workspaces for backend, frontend and shared package.

**Reason:** One repository simplifies coordinated changes, shared contracts and CI.

## D-003 — PostgreSQL as source of truth

**Decision:** Use PostgreSQL for durable business data; Redis is an auxiliary cache/coordination layer.

**Reason:** Relational integrity and transactions are important for orders, payments and inventory.

## D-004 — Prisma ORM

**Decision:** Use Prisma with PostgreSQL and the Prisma 7 driver-adapter configuration already established in the repository.

**Reason:** Typed database access and migrations. Keep the current working Prisma configuration unless a verified issue requires a change.

## D-005 — API versioning

**Decision:** Prefix REST endpoints with `/api/v1`.

## D-006 — Role model

**Decision:** Initial application roles are `CUSTOMER`, `STAFF` and `ADMIN`.

**Reason:** The product is a single-store e-commerce application, not a multi-vendor platform.

## D-007 — Money representation

**Decision:** Store money as integer minor units; NPR amounts are represented in paisa.

**Reason:** Avoid floating-point rounding errors.

## D-008 — Authentication token storage

**Decision:** Use short-lived access JWTs and rotating refresh tokens in HTTP-only cookies. Store only a cryptographic hash of each refresh token in PostgreSQL.

**Reason:** Reduce token exposure and support session revocation/reuse detection. Final cookie, CSRF and token details must be documented with the implementation.

## D-009 — Password hashing

**Decision:** Use Argon2id for password hashing.

## D-010 — Background jobs

**Decision:** Use Redis-backed BullMQ queues with a separate worker process sharing backend code.

**Reason:** Keep slow/retryable work outside HTTP request lifecycles.

## D-011 — Payment authority

**Decision:** Stripe webhook events are authoritative for asynchronous payment state. Verify signatures and process events idempotently.

## D-012 — Deployment learning path

**Decision:** Deploy first to the user's Ubuntu PC acting as a VPS, then consider a free/low-cost cloud target.

**Reason:** Learn the full deployment and server-management lifecycle.

## D-013 — Verify before marking complete

**Decision:** A feature is complete only after relevant checks have been run and successful results confirmed.

**Reason:** Generated code alone does not prove a working implementation.

## D-014 — Documentation as continuity

**Decision:** Repository documentation is the durable project memory across ChatGPT conversations. The existing context, progress, architecture, database, API, decisions and development-log documents are the handoff source, together with actual source code.

**Reason:** Prevent context-window loss from interrupting development. Do not create separate phase documentation unless explicitly requested.

## D-015 — Product archival

**Decision:** Product removal through the administration API archives the product by setting status to `ARCHIVED` and clearing `isFeatured`, rather than hard-deleting it.

**Reason:** Preserve product records and their relationships for historical and operational integrity.

## D-016 — Artisan and variant deactivation

**Decision:** Artisan and product variant DELETE routes deactivate their records instead of hard-deleting them.

**Reason:** Preserve relationships and historical references while preventing inactive records from being treated as active catalogue options.

## D-017 — Inventory initialization with variants

**Decision:** Creating a product variant also creates its inventory record with quantity and reserved both set to zero.

**Reason:** Ensure each newly created variant has an inventory record before stock-management operations begin.

## D-018 — Cloudinary product image storage

**Decision:** Store product image files in Cloudinary and image metadata, URL and Cloudinary public ID in PostgreSQL.

**Reason:** Keep binary media outside the relational database while retaining database-managed image relationships and ordering.

**Consequences:** Cloudinary cleanup is best-effort. A failed cleanup can leave an orphaned asset. A failed database write after upload triggers a compensating Cloudinary deletion attempt.

## D-019 — Public and protected product route registration

**Decision:** Register the public catalogue router before the protected product administration router under `/api/v1/products`.

**Reason:** Both routers share a URL prefix. The public listing and slug routes must be matched before requests fall through to the router that applies authentication and ADMIN/STAFF authorization.


## D-020 — Exclude coupons and discounts

**Date:** 2026-11-28

**Decision:** Coupons, discounts, promotional pricing and coupon-redemption functionality are excluded from HimaCraft's current product scope. Checkout and order calculations will use the applicable product prices and separately defined shipping charges, without coupon or discount adjustments.

**Reason:** Keep the initial single-store e-commerce implementation focused on catalogue, inventory, cart, checkout, orders and payments without introducing a separate promotional-pricing subsystem.

**Consequences:** Do not implement coupon or discount endpoints, services, validation, UI or order-calculation logic. Existing completed phases do not depend on this functionality. Reconsider this decision only if the project scope is explicitly changed in the future.

## D-021 — COD checkout and free shipping

**Date:** 2026-11-28

**Decision:** The initial checkout flow uses Cash on Delivery (COD). The payment record is created with `PENDING` status. Shipping is free, so `shippingFee` is zero and the order total equals the subtotal.

**Reason:** Keep the initial checkout and order lifecycle focused while payment-provider integration is implemented separately.

**Consequences:** Stripe payment processing and webhook handling are implemented in Phase 9. Do not add shipping charges or alternative payment methods without an explicit scope decision.
