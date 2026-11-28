# HimaCraft — Architecture

## Architectural style

HimaCraft uses a **modular monolith**. Business capabilities are separated into modules inside one backend application and one deployable API. Background workers run as a separate process but reuse backend code and integrations. Microservices are intentionally out of scope.

## High-level system

```text
React + TypeScript browser application
              |
       HTTPS / REST API
              |
       Nginx reverse proxy
              |
      Express modular monolith
       |        |         |
   PostgreSQL  Redis   Integrations
       |        |      - Stripe
       |        |      - Cloudinary
       |        |      - Email
       |        |      - Web Push
       |        |
       |      BullMQ queues
       |        |
       |    Worker process
       |
  Persistent business data
```

## Repository responsibilities

- `apps/backend`: Express API, business modules, integrations, workers and backend tests.
- `apps/frontend`: React application.
- `packages/shared`: genuinely shared types, schemas or constants. Avoid coupling it to server-only code.
- `docs`: project context, progress, architecture, database, API, decisions and development history.

## Backend module conventions

A business module should own its routes, controller, service and validation schemas where appropriate. Shared cross-cutting code belongs in common locations such as config, middleware, utilities and infrastructure.

Current relevant modules include:
- `modules/auth` — authentication, sessions and authorization support.
- `modules/customers` — customer profiles and addresses.
- `modules/categories` — category management.
- `modules/artisans` — artisan management.
- `modules/products` — products, variants, images and public catalogue.
- `modules/inventory` — inventory records, adjustments, movements and stock reservations.
- `modules/cart` — authenticated customer cart operations.
- `modules/wishlist` — authenticated customer wishlist operations.

The products module currently contains product, variant, image and public catalogue functionality. Inspect the actual repository before assuming module filenames or adding new modules.

## Request lifecycle

1. Request enters through Nginx/Express.
2. Security, CORS, cookie and request parsing middleware run.
3. Authentication middleware identifies the user when the route requires it.
4. Authorization checks role and resource access.
5. Route validation parses untrusted input.
6. Controller delegates to service.
7. Service applies business rules and uses Prisma/Redis/integrations.
8. Central error middleware formats failures.
9. Winston records operational events without logging secrets or sensitive credentials.

## Product and catalogue routing

The public catalogue and protected product administration routes share the `/api/v1/products` prefix.

In `apps/backend/src/app.ts`, register the public catalogue router before the protected product router:

```ts
app.use("/api/v1/products", catalogRoutes);
app.use("/api/v1/products", productRoutes);
```

The protected product router applies authentication and ADMIN/STAFF authorization to its routes. Keep the registration order intact when modifying route mounting. Verify route matching after adding overlapping paths.

Product administration includes product CRUD/archive, nested variant management and nested image management. Public catalogue routes expose active products and product details by slug.

## Background jobs and workers

Background jobs use BullMQ with Redis. Queue producers and workers are separate
from HTTP request handling and reuse backend modules and infrastructure.

### Inventory queue

- Queue implementation: `src/jobs/queues/inventory.queue.ts`.
- Worker implementation: `src/jobs/workers/inventory.worker.ts`.
- Queue name: `inventory`.
- Scheduled job: `expire-stripe-reservations`.
- The worker invokes `expireStripeReservations()` from the inventory reservation service.
- Worker concurrency is configured as `1`.
- The server initializes the queue and worker during startup and closes them during shutdown.
- Worker failures and errors are logged through the backend logger.

The reservation service owns reservation lifecycle operations. Do not duplicate
reservation expiry logic inside HTTP controllers or the worker.

## Data and consistency

- PostgreSQL is the source of truth for users, catalog, inventory, orders and payments.
- Use Prisma transactions for operations that must commit atomically.
- Inventory reservation and adjustment operations must be concurrency-safe.
- Redis is an optimization and coordination layer, not the source of truth for durable business records.
- Cache invalidation must be explicit for affected resources.
- Queue jobs must be retry-safe and idempotent where possible.

### Current catalogue implementation notes

- Product/category/artisan slugs are generated from names when omitted.
- Product archive, artisan deactivation and variant deactivation preserve records rather than hard-delete them.
- Creating a product variant also creates its inventory row with quantity and reserved both zero.
- Product image files are stored in Cloudinary; image metadata and Cloudinary public IDs are stored in PostgreSQL.
- Image database operations use transactions where multiple image records must change together.
- Cloudinary cleanup is best-effort. Failed cleanup can leave orphaned assets.
- Catalogue price sorting currently loads matching products and sorts in application code before pagination. This is correct for the current implementation but should be optimized before the catalogue grows significantly.

## Security principles

- Validate all external input.
- Hash passwords with Argon2id.
- Store refresh-token hashes, not raw refresh tokens.
- Use short-lived access tokens and rotate refresh tokens.
- Use HTTP-only, Secure-in-production cookies with an explicit SameSite/CSRF strategy.
- Enforce role and resource ownership checks server-side.
- Rate-limit sensitive endpoints.
- Verify Stripe webhook signatures and process events idempotently.
- Restrict upload size, type and access.
- Never log passwords, tokens, OTPs, secrets or full payment credentials.

## API conventions

- Base prefix: `/api/v1`.
- Use resource-oriented REST endpoints and appropriate HTTP status codes.
- Validate request params, query strings and bodies with Zod.
- Use a consistent success/error response shape.
- Paginate list endpoints.
- Keep controllers thin and business logic in services.
- Document endpoints and authorization requirements in `API.md`.

## Deployment direction

Local development uses Docker Compose for PostgreSQL and Redis. Initial deployment target is the user's Ubuntu PC acting as a VPS, with Nginx and HTTPS. GitHub Actions will run quality checks and deployment steps. A cloud platform may be added later after the self-hosted deployment is understood.


## Current implementation modules

The backend currently has dedicated modules for inventory, cart and wishlist
in addition to authentication, customers, categories, artisans and products.

- Inventory adjustments are transactional and create inventory movement records.
- Inventory availability is derived from physical quantity minus reserved quantity.
- Cart operations are customer-scoped and use server-side variant prices.
- Wishlist entries are customer-scoped and variant-specific.
- Inventory reservation expiry is processed asynchronously through the BullMQ inventory queue.
- Coupons, discounts and promotional pricing are excluded from the current project scope.
