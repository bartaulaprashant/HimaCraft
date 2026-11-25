# Phase 3 — Authentication and Authorization

## Goal
Implement secure identity, session lifecycle and access control as reusable backend infrastructure.

## Existing schema observed during planning
The user shared these Prisma model fields:
- `User`: `id`, `email` (unique), `passwordHash`, `firstName`, `lastName`, optional `phone`, `role`, `status`, optional `emailVerifiedAt`, timestamps; relations include `refreshTokens` and `passwordResetOtps`.
- `RefreshToken`: `id`, `userId`, unique `tokenHash`, `expiresAt`, optional `revokedAt`, `createdAt`, user relation, index `[userId, expiresAt]`.
- `PasswordResetOtp`: `id`, `userId`, `otpHash`, `expiresAt`, `attempts` default 0, optional `usedAt`, `createdAt`, user relation, index `[userId, expiresAt]`.

Always re-inspect the current schema before implementing.

## Planned technology
- Argon2id password hashing (`argon2` package).
- JWT signing/verification using `jose`.
- Short-lived access token.
- Cryptographically random opaque refresh token; store only its hash.
- Refresh-token rotation and revocation.
- HTTP-only cookies; production Secure flag; explicit SameSite and CSRF strategy.
- Zod request validation.
- Express middleware for authentication and RBAC.
- Winston logs without credentials/tokens/OTP values.

## Proposed module structure
Adapt to current conventions after inspecting the repository:

```text
src/modules/auth/
├── auth.routes.ts
├── auth.controller.ts
├── auth.service.ts
├── auth.validation.ts
├── auth.middleware.ts
├── auth.types.ts
└── auth.utils.ts
```

Shared middleware may live in `src/middleware/` if that is the existing convention.

## Planned endpoint set
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/logout-all`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/verify-reset-otp`
- `POST /api/v1/auth/reset-password`
- `POST /api/v1/auth/change-password`
- Email verification endpoint(s), if included in agreed scope.

Confirm final route design before documenting as implemented.

## Implementation batches

### Batch A — Authentication foundation
- [ ] Verify `argon2` and `jose` installation and package scripts.
- [ ] Verify JWT environment variables exist (never print secret values).
- [ ] Implement token/password utilities.
- [ ] Implement register and login.
- [ ] Implement cookie helpers.
- [ ] Implement refresh-token rotation and logout/revocation.
- [ ] Implement authentication and RBAC middleware.
- [ ] Mount routes and add integration tests.

### Batch B — Account security
- [ ] Change password.
- [ ] Password reset OTP creation, hashing, expiry, attempt limits and one-time use.
- [ ] Email delivery integration and generic responses to avoid account enumeration.
- [ ] Email verification.
- [ ] Rate limits and CSRF protection appropriate to cookie auth.

### Batch C — Hardening and verification
- [ ] Refresh-token replay/reuse handling.
- [ ] Concurrent refresh behavior considered and tested.
- [ ] Suspended/deleted account behavior.
- [ ] Cookie flags and CORS credential behavior verified.
- [ ] Authentication and authorization integration tests.
- [ ] Typecheck, test and production build pass.
- [ ] Update `API.md`, `DATABASE.md` if schema changes, `PROGRESS.md` and development log.

## Security requirements
- Never store raw refresh tokens.
- Never store or log plaintext passwords or OTPs.
- Compare password hashes with Argon2 verification.
- Use generic public responses where needed to prevent account enumeration.
- Rate-limit registration, login, refresh and OTP endpoints.
- Enforce active account status on authenticated requests.
- Never trust a role supplied by the client.
- Verify token issuer, audience, algorithm and expiry; use distinct token purposes/claims.
- Plan CSRF protection for cookie-authenticated state-changing requests.
- Do not expose secrets or token hashes in API responses.

## Current status
In progress. Dependency installation was instructed but not yet confirmed in the recorded conversation. Verify actual `package.json`/lockfile and `npm ls` before implementation.
