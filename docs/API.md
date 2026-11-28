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
- ADMIN/STAFF endpoints require authentication and role authorization.

## Response envelope

Successful responses follow the backend convention:

```json
{
  "success": true,
  "message": "Optional message",
  "data": {}
}
```

Errors are handled through centralized error middleware. Refer to each controller for the exact response payload.

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

| Method | Path | Purpose | Access |
|---|---|---|---|
| GET | `/categories/admin` | List all categories, including inactive categories | ADMIN, STAFF |
| POST | `/categories` | Create category | ADMIN, STAFF |
| PATCH | `/categories/:categoryId` | Update category | ADMIN, STAFF |
| DELETE | `/categories/:categoryId` | Delete category | ADMIN, STAFF |

Behavior:
- Slugs are unique and generated from names when omitted.
- Categories support parent-child relationships.
- Parent validation prevents self-parenting and circular hierarchies.
- Deletion is blocked if the category has products or child categories.
- Public listing and lookup expose active categories only.
- Public category responses include parent information and product counts. Slug lookup also includes active children.

## Artisans

All listed artisan endpoints require ADMIN or STAFF authorization.

| Method | Path | Purpose |
|---|---|---|
| GET | `/artisans` | List artisans |
| POST | `/artisans` | Create artisan |
| GET | `/artisans/:artisanId` | Get artisan by ID |
| PATCH | `/artisans/:artisanId` | Update artisan |
| DELETE | `/artisans/:artisanId` | Deactivate artisan |

Behavior:
- Slugs are generated from names when omitted and must be unique.
- Artisan listing is ordered by name.
- Listing and detail responses include product counts.
- DELETE is a soft deactivation (`isActive: false`), not a hard delete.

## Products and variants

### Public catalogue endpoints

| Method | Path | Purpose | Access |
|---|---|---|---|
| GET | `/products` | List, search, filter, sort and paginate active products | Public |
| GET | `/products/slug/:slug` | Get public product details by slug | Public |

Supported catalogue query parameters:

| Parameter | Purpose | Validation/default |
|---|---|---|
| `page` | Page number | Integer, minimum 1, default 1 |
| `limit` | Results per page | Integer, 1–50, default 12 |
| `search` | Product-name search | Trimmed string, max 120 |
| `categoryId` | Category filter | UUID |
| `artisanId` | Artisan filter | UUID |
| `material` | Material filter | Trimmed string, max 120 |
| `minPrice` | Minimum active-variant price | Integer, minimum 0 |
| `maxPrice` | Maximum active-variant price | Integer, minimum 0 |
| `sortBy` | Sort order | `newest`, `price_asc`, `price_desc`, `name_asc`, `name_desc`; default `newest` |

`minPrice` cannot exceed `maxPrice`.

Catalogue behavior:
- Only products with status `ACTIVE` are returned.
- Price filters operate against active variants.
- Product listing includes category, artisan, primary image, active variants and inventory information.
- Product detail lookup by slug includes category, artisan, images and active variants.
- Price sorting currently sorts matching products in application code before pagination; see `ARCHITECTURE.md` and `PROGRESS.md` for the optimization note.

### Product administration endpoints

All endpoints below require ADMIN or STAFF authorization.

| Method | Path | Purpose |
|---|---|---|
| POST | `/products` | Create product |
| GET | `/products/:productId` | Get product by ID |
| PATCH | `/products/:productId` | Update product |
| DELETE | `/products/:productId` | Archive product |

Behavior:
- Product slugs are generated from names when omitted and must be unique.
- Category references are validated.
- Optional artisan references are validated when supplied.
- DELETE archives the product by setting status to `ARCHIVED` and `isFeatured` to false. It does not hard-delete the product.

### Product variant administration

All endpoints require ADMIN or STAFF authorization.

| Method | Path | Purpose |
|---|---|---|
| GET | `/products/:productId/variants` | List product variants |
| POST | `/products/:productId/variants` | Create variant |
| GET | `/products/:productId/variants/:variantId` | Get variant |
| PATCH | `/products/:productId/variants/:variantId` | Update variant |
| DELETE | `/products/:productId/variants/:variantId` | Deactivate variant |

Behavior:
- SKU values are unique.
- Variant operations verify that the variant belongs to the supplied product.
- Creating a variant creates its inventory record with `quantity: 0` and `reserved: 0`.
- DELETE sets `isActive` to false; it does not delete the variant.

## Product images

All endpoints require ADMIN or STAFF authorization.

| Method | Path | Purpose |
|---|---|---|
| GET | `/products/:productId/images` | List product images |
| POST | `/products/:productId/images` | Upload product image |
| PATCH | `/products/:productId/images/:imageId` | Update image metadata |
| PATCH | `/products/:productId/images/:imageId/primary` | Set primary image |
| DELETE | `/products/:productId/images/:imageId` | Delete image |

Upload contract:
- Content type: `multipart/form-data`.
- File field: `image`.
- Optional text fields: `altText`, `sortOrder`, `isPrimary`.
- `isPrimary` is submitted as the string `true` or `false`.
- Do not manually set the multipart Content-Type in Postman; allow Postman to add the boundary.
- Maximum file size is 5 MB.
- Accepted MIME types: JPEG, PNG and WebP.
- Files are uploaded to Cloudinary under `himacraft/products`.

Image behavior:
- The first image becomes primary by default unless the request specifies otherwise.
- Setting an image as primary demotes other images for that product.
- Deleting the primary image promotes the next image ordered by `sortOrder`, then ID, if one exists.
- If a database write fails after upload, the service attempts to delete the uploaded Cloudinary asset.
- When deleting an image, the database record is deleted first; failed Cloudinary cleanup can leave an orphaned asset.

## Authorization notation

- `Public`: no authenticated user required.
- `Authenticated`: valid active user session required.
- `ADMIN, STAFF`: authenticated user must have one of these roles.
- Resource ownership checks apply where relevant.

## Documentation rule

Keep this file synchronized with actual route definitions and validation schemas. Inspect controllers and validation schemas before documenting new request or response fields. Do not infer undocumented payload details.
