# HimaCraft — API Contract

## Conventions

- Base path: `/api/v1`
- JSON request/response bodies unless an endpoint explicitly handles multipart uploads.
- Validate request bodies and params with Zod.
- Use standard HTTP status codes.
- Never expose password hashes, refresh-token hashes, OTP hashes or secrets.
- Protected browser requests use HTTP-only cookies.
- Authentication middleware supports Bearer-token fallback for API clients.
- Mutating cookie-authenticated requests use trusted-origin protection.

## Response envelope

Successful responses follow the backend convention:

```json
{
  "success": true,
  "message": "Optional message",
  "data": {}
}
```

Errors are handled through centralized error middleware.

## Authentication

| Method | Path | Purpose | Access |
|---|---|---|---|
| POST | `/auth/register` | Register customer | Public |
| POST | `/auth/login` | Login and create session | Public |
| POST | `/auth/refresh` | Rotate refresh session | Refresh cookie |
| POST | `/auth/logout` | Revoke current session | Session |
| POST | `/auth/logout-all` | Revoke all sessions | Authenticated |
| GET | `/auth/me` | Get authenticated user | Authenticated |
| POST | `/auth/forgot-password` | Request password-reset OTP | Public |
| POST | `/auth/verify-reset-otp` | Verify reset OTP | Public |
| POST | `/auth/reset-password` | Complete password reset | Public |
| POST | `/auth/change-password` | Change current password | Authenticated |

Refer to the corresponding route validation schemas and controllers for exact request payloads and response details.

### Authentication behavior

- Access cookie: `hc_access`.
- Refresh cookie: `hc_refresh`.
- Both cookies are HTTP-only.
- Browser clients should send requests with credentials enabled.
- Login and registration do not return a Bearer access token in the response body.
- Bearer-token authentication is supported as middleware fallback for API clients.
- Public registration creates a `CUSTOMER` account.
- ADMIN and STAFF assignment is currently performed manually through trusted database administration/Prisma Studio.

## Customer profile and addresses

All endpoints require authentication.

| Method | Path | Purpose |
|---|---|---|
| GET | `/customers/me` | Get current customer profile |
| PATCH | `/customers/me` | Update current customer profile |
| GET | `/customers/addresses` | List customer addresses |
| POST | `/customers/addresses` | Create address |
| PATCH | `/customers/addresses/:addressId` | Update owned address |
| DELETE | `/customers/addresses/:addressId` | Delete owned address |

Address operations enforce resource ownership. Default-address behavior is handled by the customer module.

## Categories

### Public endpoints

| Method | Path | Purpose | Access |
|---|---|---|---|
| GET | `/categories` | List active categories | Public |
| GET | `/categories/:slug` | Get active category by slug | Public |

### Administration endpoints

These endpoints require authentication and the `ADMIN` or `STAFF` role.

| Method | Path | Purpose | Access |
|---|---|---|---|
| GET | `/categories/admin` | List all categories, including inactive categories | ADMIN, STAFF |
| POST | `/categories` | Create category | ADMIN, STAFF |
| PATCH | `/categories/:categoryId` | Update category | ADMIN, STAFF |
| DELETE | `/categories/:categoryId` | Delete category | ADMIN, STAFF |

### Category behavior

- Slugs are unique.
- Slugs can be generated from category names.
- Categories can have parent and child categories.
- Parent validation prevents self-parenting and circular hierarchies.
- A category cannot be deleted while it has products or child categories.
- Public listing and lookup expose active categories.

## Authorization notation

- `Public`: no authenticated user required.
- `Authenticated`: valid active user session required.
- `ADMIN, STAFF`: authenticated user must have one of these roles.
- Resource ownership checks apply where relevant.

## Documentation rule

Keep this file synchronized with actual route definitions and validation schemas. Add exact request/response examples when the relevant endpoint payloads have been inspected.
