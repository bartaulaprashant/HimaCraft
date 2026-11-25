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
- `docs`: project documentation and phase records.

## Backend module conventions

A business module should own its routes, controller, service and validation schemas where appropriate. Shared cross-cutting code belongs in common locations such as config, middleware, utilities and infrastructure.

Suggested module layout (adapt to the existing repository rather than moving files without need):

```text
src/
├── config/
├── middleware/
├── common/
├── modules/
│   ├── auth/
│   ├── users/
│   ├── addresses/
│   ├── products/
│   ├── categories/
│   ├── inventory/
│   ├── cart/
│   ├── wishlist/
│   ├── coupons/
│   ├── checkout/
│   ├── orders/
│   ├── payments/
│   ├── reviews/
│   ├── notifications/
│   └── admin/
├── integrations/
├── jobs/
│   ├── queues/
│   ├── workers/
│   └── processors/
├── app.ts
└── server.ts
```

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

## Data and consistency

- PostgreSQL is the source of truth for users, catalog, inventory, orders and payments.
- Use Prisma transactions for operations that must commit atomically.
- Use conditional updates/locking or another justified concurrency-safe approach for inventory reservation.
- Redis is an optimization and coordination layer, not the source of truth for durable business records.
- Cache invalidation must be explicit for affected resources.
- Queue jobs must be retry-safe and idempotent where possible.

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
