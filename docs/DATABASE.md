# HimaCraft — Database Notes

## Database choices

- PostgreSQL 17
- Prisma 7
- PostgreSQL driver adapter (`@prisma/adapter-pg`)
- Prisma schema: `apps/backend/prisma/schema.prisma`
- Prisma config: `apps/backend/prisma7.config.ts` (verify exact current filename)

PostgreSQL is the source of truth. Redis must not replace durable relational records.

## Known schema snapshot

The following model names and fields were observed in the project during Phase 3 planning. Always inspect the live schema before editing; this document is not a substitute for `schema.prisma`.

### User

- `id`: UUID primary key
- `email`: unique
- `passwordHash`
- `firstName`, `lastName`
- optional `phone`
- `role`: `UserRole`, default `CUSTOMER`
- `status`: `UserStatus`, default `ACTIVE`
- optional `emailVerifiedAt`
- `createdAt`, `updatedAt`
- Relations include addresses, refresh tokens, password-reset OTPs, cart, wishlist items, orders, reviews, notifications, push subscriptions, coupon usages and audit logs.

### RefreshToken

- `id`
- `userId`
- `tokenHash`: unique
- `expiresAt`
- optional `revokedAt`
- `createdAt`
- User relation with cascade delete
- Index on `[userId, expiresAt]`

### PasswordResetOtp

- `id`
- `userId`
- `otpHash`
- `expiresAt`
- `attempts`, default 0
- optional `usedAt`
- `createdAt`
- User relation with cascade delete
- Index on `[userId, expiresAt]`

## Domain areas

The broader schema includes users/addresses, categories, artisans, products, variants, images, inventory and movements, cart, wishlist, coupons, orders, order history, stock reservations, payments, webhook events, reviews, notifications, push subscriptions and audit logs. Confirm exact current models and relations in Prisma before implementation.

## Data rules

- Use UUID identifiers as defined by the schema.
- Store monetary amounts as integers in minor currency units (NPR paisa for NPR).
- Store timestamps in database-supported timestamp types; use UTC internally.
- Add indexes based on actual query patterns, not speculatively.
- Use foreign keys and explicit delete behavior.
- Use transactions for multi-record business operations.
- Keep order-item price/product snapshots so historical orders remain meaningful if catalog data changes.
- Treat inventory availability as a concurrency-sensitive invariant.
- Avoid destructive migrations and never delete local Docker volumes as a routine troubleshooting step.

## Migration workflow

From repository root, use the existing workspace scripts after checking their current definitions. Typical commands:

```bash
npm run db:generate -w backend
npm run db:migrate -w backend -- --name descriptive_change
npm run db:deploy -w backend
```

Run migrations only after reviewing schema changes. `migrate dev` is for development; deployment environments should use `migrate deploy`.

## Change log

Update this document when models, relations, constraints, indexes or important data invariants change.
