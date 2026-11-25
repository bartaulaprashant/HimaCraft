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

**Decision:** Repository documentation is the durable project memory across ChatGPT conversations. `AI_CONTEXT.md`, `PROGRESS.md`, phase notes and the actual source code take precedence over chat history.

**Reason:** Prevent context-window loss from interrupting development.
