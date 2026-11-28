# HimaCraft — Development Log

## 2026-11-28 — Phase 6 and 7 implementation; roadmap update

- Implemented inventory management and stock reservation lifecycle, including the BullMQ expiry worker.
- Inventory backend typecheck passed; endpoint verification was skipped at the user's request.
- Implemented customer cart and wishlist modules and registered their API routes.
- Cart supports retrieval, add, quantity update, item removal and clearing.
- Wishlist supports retrieval, add and removal.
- Cart and wishlist backend TypeScript typecheck passed; endpoint verification remains pending.
- Removed Coupons and Promotions from the project roadmap and current product scope.
- Renumbered Checkout, Shipping and Order Lifecycle as Phase 8.
- Recorded the scope decision in `DECISIONS.md` as D-020.
- No application code, Prisma schema, migrations or user data were changed as part of this documentation update.


Append concise entries in reverse chronological order. Record meaningful changes, commands/results, decisions and unresolved issues. Never record secret values.

## 2026-11-28 — Phase 5 product catalogue and category completion

- Completed Category Management: public listing and slug lookup, ADMIN/STAFF management, hierarchy validation and deletion protection.
- Completed Product Management: create, get by ID, update and archive.
- Completed Artisan Management: list, get, create, update and deactivate.
- Completed product variant management, including automatic creation of zeroed inventory records.
- Completed product image management using Cloudinary and Multer.
- Implemented primary image switching and promotion of the next image when the primary image is deleted.
- Implemented public catalogue listing, search, filtering, sorting, pagination and product detail lookup by slug.
- Public catalogue exposes ACTIVE products only.
- User manually verified the endpoint groups and confirmed backend TypeScript typecheck passes.
- No new schema migration was required for the catalogue implementation described above.
- Known follow-up: catalogue price sorting currently loads matching products and sorts in application code before pagination. Optimize when appropriate.
- Known follow-up: Cloudinary cleanup is best-effort and may leave orphaned assets if provider cleanup fails.
- Updated existing documentation files; no phase-specific documentation directory is used.

## 2026-11-28 — Documentation state reconciliation

- Updated project progress to reflect completed authentication and customer profile/address functionality.
- Recorded manual ADMIN/STAFF role assignment through Prisma Studio.
- Updated API documentation for authentication, customer and category endpoints.
- Updated AI handoff context.

## 2026-11-25 — Authentication and customer functionality

- Authentication implementation completed and confirmed working by user.
- Password change and password-reset OTP functionality working.
- Email/SMTP delivery tested successfully by user.
- Customer profile and address management implemented and confirmed working.
- Authentication uses HTTP-only cookies for browser sessions.
- Authentication middleware also supports Bearer-token fallback for API clients.
- ADMIN and STAFF roles are currently assigned manually.

## Earlier project history

- HimaCraft monorepo created with npm workspaces.
- Backend scaffold created with Express, TypeScript and Prisma 7.
- Docker Compose configured for PostgreSQL 17 and Redis 7.
- Initial Prisma database connection issue was encountered and subsequently reported resolved by the user.
