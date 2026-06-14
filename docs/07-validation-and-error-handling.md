# 07 — Validation & Error Handling

> **Status:** Draft · **Depends on:** [`03`](03-api-routes-security.md) (status taxonomy), [`02`](02-database-schema.md) (JSONB schema), [`06`](06-backend-services-spec.md)
> The uniform error contract, validation layers, and the domain error-code catalog shared by backend and frontend.

---

## 1. Validation layers

Defense in depth — three layers, each with a distinct job:

| Layer | Where | Catches |
|-------|-------|---------|
| **Transport/DTO** | Controller, Bean Validation (`@Valid`, `@NotNull`, `@Email`, `@Size`, …) | malformed/missing fields, wrong types, format |
| **Dynamic form** | `RegistrationService` against `registration_form.schema` | guest answers vs the admin-defined field rules (§3) |
| **Domain invariants** | Service layer | state-machine legality, uniqueness, lifecycle gates, authorization |

The frontend mirrors layers 1–2 with Zod (derived from the same JSONB schema, [`05` §5.2](05-frontend-spec.md)) for instant feedback — but the server is authoritative.

## 2. Uniform response envelope

**Every** API response — success or failure — is wrapped in a single envelope. `success` (boolean) and `timestamp` (ISO-8601 UTC) are **always** present. Success bodies are assembled via a shared `ApiResponse<T>` wrapper; error bodies are produced by a single `@RestControllerAdvice`. This is the one response contract the frontend types against ([`05` §3](05-frontend-spec.md)).

### 2.1 Success envelope (`2xx`)

**Single resource** — `data` is the object:

```json
{
  "success": true,
  "message": "User retrieved successfully",
  "data": {
    "id": 1,
    "name": "Hongmeng",
    "email": "hongmeng@example.com"
  },
  "timestamp": "2026-08-01T10:30:00Z"
}
```

**Collection (paginated)** — `data` is the array and a sibling `pagination` block is added:

```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": [
    { "id": 1, "name": "John" },
    { "id": 2, "name": "Jane" }
  ],
  "pagination": {
    "page": 1,
    "size": 10,
    "totalElements": 50,
    "totalPages": 5
  },
  "timestamp": "2026-08-01T10:30:00Z"
}
```

- `data` carries the resource (object) or collection (array); `null` for no-content successes (e.g. `204`/delete).
- `pagination` is present **only** for paginated collections. `page` is **1-based**; `size` is the page size; `totalElements`/`totalPages` describe the full result set. Backed directly by Spring Data `Page<T>` ([`06` §8](06-backend-services-spec.md)).
- `message` is a short human-readable summary (i18n-able); never put error detail here.

### 2.2 Error envelope (non-2xx)

Every non-2xx response (except opaque infra errors) returns `success: false` with the same always-on `timestamp`, plus the error detail below, produced by a single `@RestControllerAdvice`:

```json
{
  "success": false,
  "timestamp": "2026-06-13T09:02:11Z",
  "status": 400,
  "error": "VALIDATION_ERROR",
  "message": "One or more fields are invalid.",
  "path": "/api/v1/public/events/{id}/register",
  "traceId": "b8f1c2…",
  "fieldErrors": [
    { "field": "email", "code": "REQUIRED", "message": "Email is required." },
    { "field": "phone", "code": "PATTERN", "message": "Enter a valid phone number." }
  ]
}
```

- `error` is a **stable machine code** (catalog §4); `message` is human-readable (i18n-able).
- `traceId` ties the response to logs/traces ([`08`](08-observability-and-operations.md)).
- `fieldErrors` present only for field-level validation failures; each carries a stable `code`.
- **Never** leak stack traces, SQL, or internal class names to clients.

## 3. Dynamic form validation (JSONB)

`validateAnswers(answers, schema)` — server-side, authoritative:

| Check | Rule |
|-------|------|
| Required | every field with `required:true` must be present and non-empty |
| Unknown keys | reject answers whose key isn't in the schema |
| Type | value conforms to field `type` (`email`, `phone`, `number`, `date`, …) |
| Constraints | `validation.{minLength,maxLength,min,max,pattern}` enforced |
| Options | `select`/`multiselect` values ⊂ `options` |
| Mandatory fields | active form must define required `email` + `phone` (enforced at form activation and re-checked here) |

Failures aggregate into `fieldErrors` (no partial writes). New fields never require a migration — validation is data-driven off the schema ([`02` §6](02-database-schema.md)).

## 4. Domain error-code catalog

Stable codes (consumed by FE for messaging/branching). Grouped by HTTP status:

| HTTP | `error` code | Meaning |
|------|-------------|---------|
| 400 | `MALFORMED_REQUEST` | unparseable body / wrong types |
| 401 | `UNAUTHENTICATED` | missing/expired/invalid access token |
| 401 | `INVALID_CREDENTIALS` | bad email/password on login |
| 401 | `OTP_INVALID` / `OTP_EXPIRED` | reset code wrong/expired/over-attempts |
| 403 | `FORBIDDEN` | authenticated but gate denied (incl. cross-event) |
| 404 | `NOT_FOUND` | unknown id / unresolvable QR token |
| 409 | `CONFLICT` | generic uniqueness conflict (slug, assignment, duplicate registration) |
| 409 | `ALREADY_CHECKED_IN` | re-scan of a used ticket |
| 409 | `TICKET_INVALID` | revoked ticket / check-in window closed |
| 409 | `ILLEGAL_TRANSITION` | disallowed material status change |
| 409 | `NO_ACTIVE_FORM` | registration attempted with no active form |
| 400 | `VALIDATION_ERROR` | field-level validation failures (`fieldErrors`) |
| 429 | `RATE_LIMITED` | throttled (login/OTP/registration/resend) |
| 500 | `INTERNAL_ERROR` | unexpected; logged with `traceId`, generic message to client |

> **Status convention:** `400` for all validation failures — both malformed requests and field-level validation errors. `VALIDATION_ERROR` with `fieldErrors` distinguishes field failures from `MALFORMED_REQUEST`.

## 5. Exception → response mapping

`@RestControllerAdvice` handlers:

| Exception | → |
|-----------|---|
| `MethodArgumentNotValidException` / `ConstraintViolationException` | `400 VALIDATION_ERROR` + `fieldErrors` |
| `FormValidationException` (custom) | `400 VALIDATION_ERROR` + `fieldErrors` |
| `AccessDeniedException` | `403 FORBIDDEN` |
| `AuthenticationException` | `401 UNAUTHENTICATED` |
| `EntityNotFoundException` / custom `NotFoundException` | `404 NOT_FOUND` |
| `DataIntegrityViolationException` | `409 CONFLICT` (or specific code by constraint name) |
| custom `DomainConflictException(code)` | `409 <code>` (e.g. `ALREADY_CHECKED_IN`) |
| `RateLimitExceededException` | `429 RATE_LIMITED` (+ `Retry-After`) |
| anything else | `500 INTERNAL_ERROR` (logged, generic message) |

## 6. Frontend handling (contract with [`05`](05-frontend-spec.md))

- `ApiError` wraps the body; the typed client throws it.
- `fieldErrors` are mapped onto React Hook Form fields by `field` name.
- `401` → silent refresh-and-retry once, then redirect to login.
- `403` on an event page → render an "not authorized for this event" state (don't crash).
- `409 ALREADY_CHECKED_IN` / `TICKET_INVALID` → specific scanner result banners.
- `429` → show cooldown using `Retry-After`.

## 7. Principles

- **Fail fast, aggregate fully:** collect all field errors in one response, not one-at-a-time.
- **Stable codes, translatable messages:** branch on `error`/`code`, display `message`.
- **No information leakage:** cross-event denials return `403`/`404`, never "exists but forbidden" detail; errors carry no internals.
- **Every 5xx is traceable:** `traceId` correlates client report ↔ server logs.
