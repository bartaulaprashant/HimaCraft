# HimaCraft — Database Notes

## Database choices

- PostgreSQL 17
- Prisma 7
- PostgreSQL driver adapter (`@prisma/adapter-pg`)
- Prisma schema: `apps/backend/prisma/schema.prisma`
- Prisma config: `apps/backend/prisma7.config.ts`

PostgreSQL is the source of truth. Redis must not replace durable relational records.

> This is a working schema snapshot, not a replacement for `schema.prisma`. Inspect the live schema before every schema change.

## Authentication and user models

### User

Known fields:
- `id`
- `email` (unique)
- `passwordHash`
- `firstName`, `lastName`
- optional `phone`
- `role` (`UserRole`, default `CUSTOMER`)
- `status` (`UserStatus`, default `ACTIVE`)
- optional `emailVerifiedAt`
- `createdAt`, `updatedAt`

Relations include addresses, refresh tokens, password-reset OTPs, cart, wishlist items, orders, reviews, notifications, push subscriptions and audit logs.

### RefreshToken

- `id`
- `userId`
- `tokenHash` (unique)
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
- `attempts` (default 0)
- optional `usedAt`
- `createdAt`
- User relation with cascade delete
- Index on `[userId, expiresAt]`

## Catalogue models

### Category

Known fields:
- `id`, `name`, `slug` (unique)
- optional `description`, `imageUrl`
- `isActive` (default true)
- optional `parentId`
- `sortOrder` (default 0)
- `createdAt`, `updatedAt`

Self-relation supports parent and child categories. Products relate to categories. Index: `[parentId, isActive]`.

### Artisan

Known fields:
- `id`, `name`, `slug` (unique)
- optional `bio`, `location`, `imageUrl`
- `isVerified` (default false)
- `isActive` (default true)
- `createdAt`, `updatedAt`

Artisans have a one-to-many relationship with products.

### Product

Known fields:
- `id`
- `categoryId`
- optional `artisanId`
- `name`, `slug` (unique), `description`
- optional `material`
- `origin` (default `"Nepal"`)
- optional `careInstructions`
- `status` (`ProductStatus`, default `DRAFT`)
- `isFeatured` (default false)
- `createdAt`, `updatedAt`

Relations include category, optional artisan, variants, images and reviews.

Known indexes:
- `[categoryId, status]`
- `[status, isFeatured]`
- `[name]`
- `[createdAt]`

### ProductVariant

Known fields:
- `id`, `productId`
- `sku` (unique)
- `name`
- optional `size`, `color`
- `price`
- optional `compareAtPrice`
- `currency` (default `"NPR"`)
- `isActive` (default true)
- `createdAt`, `updatedAt`

Relations include product, inventory, cart items, wishlist items, order items, stock reservations and inventory movements.

Known index: `[productId, isActive]`.

### ProductImage

Known fields:
- `id`, `productId`
- `url`
- `publicId` (Cloudinary public ID)
- optional `altText`
- `sortOrder` (default 0)
- `isPrimary` (default false)

Relation to Product uses cascade delete. Known index: `[productId, sortOrder]`.

## Inventory model snapshot

### Inventory

Known fields:
- `id`
- `variantId` (unique)
- `quantity` (default 0)
- `reserved` (default 0)
- `updatedAt`

Each product variant has an optional one-to-one inventory relation. Variant creation currently creates an inventory record with `quantity: 0` and `reserved: 0`.

Inventory availability is a business invariant and must be handled transactionally. Inspect the current inventory and stock-reservation models before implementing Phase 6.

## Other domain areas

The broader schema includes inventory movements, cart, wishlist, orders, order history, stock reservations, payments, webhook events, reviews, notifications, push subscriptions and audit logs. Confirm exact fields, constraints, relations and indexes in Prisma before implementation.

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
