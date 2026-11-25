# HimaCraft — API Contract

## Conventions

- Base path: `/api/v1`
- JSON request/response bodies unless an endpoint explicitly handles multipart uploads.
- Validate params, query strings and bodies with Zod.
- Use standard HTTP status codes.
- Paginate collection endpoints.
- Never expose password hashes, refresh-token hashes, OTP hashes or internal secrets.
- Authentication and authorization requirements must be documented per endpoint.

## Response envelope

The exact response envelope must follow the existing backend implementation. If no convention exists yet, establish one consistently before adding many endpoints. A possible convention is:

```json
{
  "success": true,
  "message": "Human-readable message",
  "data": {}
}
```

Errors should use one central format and must not leak stack traces or internal details in production.

## Authentication endpoints — planned

These are target endpoints, not claims that they are implemented. Confirm and document final paths and payloads when the auth module is built.

| Method | Path | Purpose | Access |
|---|---|---|---|
| POST | `/auth/register` | Create customer account | Public |
| POST | `/auth/login` | Authenticate and create session | Public, rate-limited |
| POST | `/auth/refresh` | Rotate refresh token | Refresh cookie |
| POST | `/auth/logout` | Revoke current session | Authenticated/session |
| POST | `/auth/logout-all` | Revoke all user sessions | Authenticated |
| GET | `/auth/me` | Current user profile | Authenticated |
| POST | `/auth/forgot-password` | Request reset OTP | Public, rate-limited |
| POST | `/auth/verify-reset-otp` | Verify reset OTP | Public, rate-limited |
| POST | `/auth/reset-password` | Complete password reset | Public, rate-limited |
| POST | `/auth/change-password` | Change current password | Authenticated |
| POST | `/auth/verify-email` | Verify email address | Token/OTP as designed |

## Authorization notation

- `Public`: no authenticated user required.
- `Authenticated`: valid active user session required.
- `CUSTOMER`, `STAFF`, `ADMIN`: role requirement; resource ownership checks may also apply.

## Endpoint documentation rule

For each implemented endpoint record:
- method and path
- purpose
- authentication and role requirements
- request schema/example
- success status and response shape
- possible error statuses
- side effects, cookies and rate limits

Keep this file synchronized with route definitions and tests.
