/**
 * Public guest surface — unauthenticated accessors for /api/v1/public/**.
 *
 * All five backend endpoints in PublicController are implemented here.
 * No auth cookie is required (Spring Security: permitAll on /public/**),
 * but apiFetch works fine — credentials:'include' is harmless and the
 * server-side cookie-forwarding path simply finds nothing to forward.
 *
 * Contract source: docs/03 §4.9 + backend PublicController + DTOs:
 *   PublicFormResponse, RegistrationRequest, RegistrationResponse, TicketResponse
 */

import { apiFetch, type FetchOptions } from './client'
import type { FormField as FrontendFormField, FieldType } from '@/lib/validation/form-schema'

// ---------------------------------------------------------------------------
// Backend DTO types — verbatim field names from the backend records
// ---------------------------------------------------------------------------

/**
 * FormFieldType enum values as serialized by @JsonValue (lowercase).
 * Matches FormFieldType.java exactly.
 */
type BackendFieldType =
  | 'text'
  | 'email'
  | 'phone'
  | 'number'
  | 'date'
  | 'select'
  | 'multiselect'
  | 'checkbox'
  | 'textarea'

/**
 * Verbatim shape of FormField.java (dto/form/FormField.java).
 * @JsonInclude(NON_NULL) means validation and options are absent (not null)
 * when they have no value.
 */
interface BackendFormField {
  key: string
  label: string
  type: BackendFieldType
  required: boolean
  order: number
  options?: string[] | null
  validation?: {
    minLength?: number | null
    maxLength?: number | null
    min?: number | null
    max?: number | null
    pattern?: string | null
  } | null
}

/**
 * Verbatim shape of PublicFormResponse.java.
 * eventId is a UUID serialized as a string by Spring's default Jackson config.
 */
interface BackendPublicFormResponse {
  eventId: string
  slug: string
  eventTitle: string
  formTitle: string
  fields: BackendFormField[]
}

/**
 * Verbatim shape of RegistrationResponse.java.
 * submissionId is a UUID serialized as a string.
 */
interface BackendRegistrationResponse {
  submissionId: string
  ticketStatus: BackendTicketStatus
  ticketUrl: string
  message: string
}

/**
 * TicketStatus enum values (TicketStatus.java).
 * These are UPPERCASE strings on the wire (no @JsonValue override).
 */
type BackendTicketStatus = 'PENDING' | 'DELIVERED' | 'CHECKED_IN' | 'REVOKED'

/**
 * Verbatim shape of TicketResponse.java.
 * startsAt is a java.time.Instant → ISO-8601 string on the wire.
 * qrImageDataUrl is a base64 data: URL for the on-screen QR fallback.
 */
interface BackendTicketResponse {
  checkinToken: string
  ticketStatus: BackendTicketStatus
  guestName: string
  eventTitle: string
  venue: string
  startsAt: string
  qrImageDataUrl: string
}

// ---------------------------------------------------------------------------
// Frontend shapes for public/guest flows
// (public.ts owns these — distinct from the admin Guest shape in mock-data.ts)
// ---------------------------------------------------------------------------

/** Public form metadata + field list, ready for the FormRenderer. */
export interface PublicForm {
  /** UUID string of the event this form belongs to. */
  eventId: string
  /** URL slug for the event (used for navigation). */
  slug: string
  /** Display title of the event. */
  eventTitle: string
  /** Display title of the form itself. */
  formTitle: string
  /**
   * Field definitions in the FormField shape expected by FormRenderer /
   * buildZodSchema (lib/validation/form-schema.ts).
   *
   * Key mapping: backend `key` → frontend `id`
   * (FormField.id is the field key used as the answers map key on submission).
   */
  fields: FrontendFormField[]
}

/** Ticket status lifecycle (mirrors TicketStatus.java). */
export type TicketStatus = 'PENDING' | 'DELIVERED' | 'CHECKED_IN' | 'REVOKED'

/**
 * Guest-facing registration result.
 * Returned by submitRegistration and resendTicket.
 */
export interface RegistrationResult {
  /** UUID string of the newly created submission. */
  submissionId: string
  ticketStatus: TicketStatus
  /**
   * Full URL to the ticket view page (e.g. https://…/tickets/<checkinToken>).
   * Display this as a fallback link when the email hasn't arrived yet.
   */
  ticketUrl: string
  /** Human-readable confirmation message from the backend. */
  message: string
}

/**
 * Guest-facing ticket view.
 * Returned by getPublicTicket; drives the /tickets/[token] page.
 *
 * NOTE: This is intentionally distinct from the admin Guest shape in mock-data.ts.
 * The TicketView component currently accepts the admin Guest shape — when the parent
 * wires this, TicketView and TicketPage will need to be updated to accept PublicTicket.
 */
export interface PublicTicket {
  /** The CSPRNG checkin token that identifies this ticket. */
  checkinToken: string
  ticketStatus: TicketStatus
  /** Guest's full name as submitted at registration. */
  guestName: string
  eventTitle: string
  venue: string
  /** ISO-8601 string (Instant) — use for display formatting. */
  startsAt: string
  /**
   * Base64 data: URL for the on-screen QR code (PNG).
   * Render directly in an <img> tag as the on-screen ticket fallback.
   */
  qrImageDataUrl: string
}

// ---------------------------------------------------------------------------
// Mappers — backend DTO → frontend shape
// ---------------------------------------------------------------------------

/**
 * Map a BackendFormField to the frontend FormField shape.
 *
 * Key decision: backend uses `key` as the field identifier;
 * frontend FormField (and buildZodSchema) use `id`. We set id = key so that
 * the answers map submitted to POST /public/events/{eventId}/register uses
 * the backend's canonical field keys verbatim.
 *
 * The backend `textarea` type maps directly — FieldType includes 'textarea'.
 * `placeholder` is not in the backend DTO; omitted (optional in FrontendFormField).
 */
function mapFormField(dto: BackendFormField): FrontendFormField {
  return {
    id: dto.key,
    label: dto.label,
    // BackendFieldType values are a subset/superset of FieldType — they are
    // identical string literals, so this cast is safe. If the backend adds a
    // new type, TypeScript will surface the mismatch here at compile time.
    type: dto.type as FieldType,
    required: dto.required,
    order: dto.order,
    ...(dto.options != null ? { options: dto.options } : {}),
  }
}

/**
 * Map a BackendPublicFormResponse to the PublicForm frontend shape.
 * Fields are sorted by `order` so the renderer receives them pre-sorted
 * (matches the backend's defined render order).
 */
function mapPublicFormResponse(dto: BackendPublicFormResponse): PublicForm {
  return {
    eventId: dto.eventId,
    slug: dto.slug,
    eventTitle: dto.eventTitle,
    formTitle: dto.formTitle,
    fields: [...dto.fields].sort((a, b) => a.order - b.order).map(mapFormField),
  }
}

function mapRegistrationResponse(dto: BackendRegistrationResponse): RegistrationResult {
  return {
    submissionId: dto.submissionId,
    ticketStatus: dto.ticketStatus,
    ticketUrl: dto.ticketUrl,
    message: dto.message,
  }
}

function mapTicketResponse(dto: BackendTicketResponse): PublicTicket {
  return {
    checkinToken: dto.checkinToken,
    ticketStatus: dto.ticketStatus,
    guestName: dto.guestName,
    eventTitle: dto.eventTitle,
    venue: dto.venue,
    startsAt: dto.startsAt,
    qrImageDataUrl: dto.qrImageDataUrl,
  }
}

// ---------------------------------------------------------------------------
// Public accessors (all unauthenticated — no Authorization header needed)
// ---------------------------------------------------------------------------

/**
 * Resolve a registration poster QR token to event + active form schema.
 *
 * Endpoint: GET /public/r/resolve?token={registrationQrToken}
 *
 * Used when a guest scans the event's physical/digital registration poster QR code.
 * The backend validates: event must be PUBLIC, form must be ACTIVE.
 * On failure the backend returns 403/404 which apiFetch throws as ApiError.
 *
 * Usage: app/(public)/events/[eventId]/register/page.tsx (poster QR scan flow)
 */
export async function resolveRegistrationPoster(
  registrationQrToken: string,
  opts?: FetchOptions
): Promise<PublicForm> {
  const dto = await apiFetch<BackendPublicFormResponse>(
    `/public/r/resolve?token=${encodeURIComponent(registrationQrToken)}`,
    opts
  )
  return mapPublicFormResponse(dto)
}

/**
 * Fetch the active registration form for an event by its URL slug.
 *
 * Endpoint: GET /public/events/{slug}/form
 *
 * The backend validates: event must be PUBLIC, form must be ACTIVE; otherwise 403/404.
 *
 * Usage: app/(public)/events/[eventId]/register/page.tsx (direct URL flow)
 *   — replace the current mock-backed getRegistrationForm(eventId) call.
 *   The page param is named [eventId] but the slug is what identifies the event
 *   publicly; pass the slug here, not the UUID.
 */
export async function getPublicForm(slug: string, opts?: FetchOptions): Promise<PublicForm> {
  const dto = await apiFetch<BackendPublicFormResponse>(`/public/events/${slug}/form`, opts)
  return mapPublicFormResponse(dto)
}

/**
 * Submit a guest registration for an event.
 *
 * Endpoint: POST /public/events/{eventId}/register
 * Status: 201 on success.
 *
 * `answers` must be keyed by the backend field `key` values (= frontend FormField.id
 * after mapping). `email` and `phone` fields are always required server-side
 * regardless of the form schema (docs/07 + CLAUDE.md critical gotchas).
 *
 * On success, the backend mints a CSPRNG checkin_token, creates the submission,
 * and emails the QR ticket to the guest's email address.
 *
 * Usage: components/public/register-client.tsx
 *   — replace the mock genToken() + setDone() call with this accessor.
 *   The component is 'use client'; call this in the FormRenderer onSubmit handler.
 */
export async function submitRegistration(
  eventId: string,
  answers: Record<string, unknown>,
  opts?: FetchOptions
): Promise<RegistrationResult> {
  const dto = await apiFetch<BackendRegistrationResponse>(
    `/public/events/${eventId}/register`,
    {
      method: 'POST',
      body: JSON.stringify({ answers }),
      ...opts,
    }
  )
  return mapRegistrationResponse(dto)
}

/**
 * Fetch a guest's ticket by its checkin token.
 *
 * Endpoint: GET /public/tickets/{checkinToken}
 *
 * The checkin token acts as the bearer secret — no auth cookie required.
 * Returns null when the token is not found (404) rather than throwing,
 * so the ticket page can render the "not found" state gracefully.
 *
 * Usage: app/(public)/tickets/[token]/page.tsx
 *   — replace the mock getTicket(token) call (which returns Guest | undefined).
 *   The page and TicketView component will need to accept PublicTicket instead
 *   of Guest (see NOTE on PublicTicket type above).
 */
export async function getPublicTicket(
  checkinToken: string,
  opts?: FetchOptions
): Promise<PublicTicket | null> {
  try {
    const dto = await apiFetch<BackendTicketResponse>(
      `/public/tickets/${encodeURIComponent(checkinToken)}`,
      opts
    )
    return mapTicketResponse(dto)
  } catch {
    // 404 (token not found) → return null so the ticket page renders "not found".
    return null
  }
}

/**
 * Re-send a guest's QR ticket email.
 *
 * Endpoint: POST /public/tickets/{checkinToken}/resend
 * Rate-limited by the backend (docs/03 §7).
 *
 * On success returns the same RegistrationResult shape as submitRegistration
 * (the backend re-uses RegistrationResponse for both).
 *
 * Usage: components/public/ticket-view.tsx
 *   — replace the mock setResent(true) call. The component is 'use client';
 *   call this in the "Resend ticket email" button onClick handler.
 *   Handle ApiError with code 429 to surface a rate-limit message.
 */
export async function resendTicket(
  checkinToken: string,
  opts?: FetchOptions
): Promise<RegistrationResult> {
  const dto = await apiFetch<BackendRegistrationResponse>(
    `/public/tickets/${encodeURIComponent(checkinToken)}/resend`,
    {
      method: 'POST',
      ...opts,
    }
  )
  return mapRegistrationResponse(dto)
}
