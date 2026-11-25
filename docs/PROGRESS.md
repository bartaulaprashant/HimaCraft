# HimaCraft — Project Progress

> Status values: `Not started`, `In progress`, `Blocked`, `Implemented — unverified`, `Verified complete`.

## Current position

- **Current phase:** Phase 3 — Authentication and authorization
- **Current task:** Establish authentication module foundation and implement registration/login/session lifecycle.
- **Last confirmed milestone:** User confirmed the initial database connection and migration issue was resolved.
- **Important:** The checklist below is a working record. Verify against current source and command output before treating any item as complete.

## Phase overview

| Phase | Scope | Status |
|---|---|---|
| 1 | Repository and project setup | Verified complete (per project history) |
| 2 | Backend foundation, infrastructure and initial database schema | Verified complete (user confirmed migration issue resolved) |
| 3 | Authentication and authorization | In progress |
| 4 | User profile and address management | Not started |
| 5 | Product catalog, categories, artisans and variants | Not started |
| 6 | Inventory and stock reservations | Not started |
| 7 | Cart and wishlist | Not started |
| 8 | Coupons and promotions | Not started |
| 9 | Checkout, shipping and order lifecycle | Not started |
| 10 | Payments and Stripe webhooks | Not started |
| 11 | Reviews and product recommendations | Not started |
| 12 | Notifications, email and browser push | Not started |
| 13 | Admin operations and analytics | Not started |
| 14 | Backend hardening, testing and performance | Not started |
| 15 | Frontend implementation and integration | Not started |
| 16 | Dockerized production deployment and CI/CD | Not started |

Phase ordering may be adjusted when dependencies require it; record changes in `DECISIONS.md`.

## Phase 1 — Setup

- [x] npm workspaces monorepo created.
- [x] Backend and frontend application scaffolds created.
- [x] Shared package and docs directories created.
- [x] Docker Compose configuration created.

## Phase 2 — Backend foundation

- [x] PostgreSQL and Redis configured through Docker Compose.
- [x] Backend TypeScript/Express foundation created.
- [x] Prisma 7 configuration and PostgreSQL adapter approach established.
- [x] Initial Prisma migration/database connection issue resolved (user confirmation).
- [ ] Re-verify current `npm run typecheck -w backend`, tests and build when next touching foundation.
- [ ] Reconcile this checklist against current files and actual migration history if needed.

## Phase 3 — Authentication and authorization

### Foundation
- [ ] Verify installed dependencies (`argon2`, `jose`, and required type/runtime packages).
- [ ] Verify JWT secrets and expiry settings in root `.env` without sharing secret values.
- [ ] Confirm Prisma `User`, `RefreshToken` and `PasswordResetOtp` models against current schema.
- [ ] Establish auth module structure and shared cookie/token utilities.

### Authentication lifecycle
- [ ] Customer registration with normalized email and safe duplicate handling.
- [ ] Login with Argon2id password verification.
- [ ] Short-lived access JWT.
- [ ] Opaque, cryptographically random refresh token; store only its hash.
- [ ] Refresh-token rotation with replay/reuse handling.
- [ ] HTTP-only cookie set/clear behavior and appropriate cookie flags.
- [ ] Logout current session.
- [ ] Logout all sessions.
- [ ] Authentication middleware.
- [ ] Role-based authorization middleware.
- [ ] Suspended/deleted account handling.
- [ ] Password change (verify current password).
- [ ] Password-reset OTP request, verification and completion with expiry/attempt limits.
- [ ] Email verification flow, if included in agreed Phase 3 scope.
- [ ] CSRF strategy appropriate to cookie-based authentication.
- [ ] Rate limits for login, registration, refresh and OTP endpoints.

### Verification
- [ ] Unit/integration tests for success and failure cases.
- [ ] Verify refresh rotation and revoked/reused token behavior.
- [ ] Verify cookie flags and CORS/credentials configuration.
- [ ] Verify role and resource authorization behavior.
- [ ] `npm run typecheck -w backend` passes.
- [ ] `npm run test -w backend` passes.
- [ ] `npm run build:backend` passes.
- [ ] API documentation and phase notes updated.

## Blockers and known cautions

- Never commit or share `.env`.
- Do not reset Docker volumes to fix credentials.
- Confirm actual package versions and Prisma schema before implementing against them.
- Do not assume email delivery provider configuration exists yet.
