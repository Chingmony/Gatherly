import { apiFetch } from './client'
import { featured as mockFeatured } from '@/lib/mock-data'
import { eventBySlugOrId as lookupBySlugOrId, eventAgenda } from '@/lib/event-data'
import type { EventRow, FeaturedEvent, AgendaItem } from './types'
import type { EventMember } from '@/lib/event-data'

// ---------------------------------------------------------------------------
// Mutation request types (verbatim field names from backend DTOs)
// ---------------------------------------------------------------------------

/**
 * Mirrors backend EventCreateRequest.
 * - title is the only @NotBlank field; all others are optional.
 * - Instant fields must be ISO-8601 strings (e.g. "2027-06-14T09:00:00Z").
 * - capacity is NOT a backend field — do not pass it here (see UI gap note).
 */
export interface EventCreatePayload {
  title: string
  description?: string | null
  venue?: string | null
  startsAt?: string | null
  endsAt?: string | null
  checkinOpensAt?: string | null
}

/**
 * Mirrors backend EventUpdateRequest.
 * All fields are nullable/optional — null means "leave unchanged".
 * Instant fields must be ISO-8601 strings.
 */
export interface EventUpdatePayload {
  title?: string | null
  description?: string | null
  venue?: string | null
  startsAt?: string | null
  endsAt?: string | null
  checkinOpensAt?: string | null
}

// ---------------------------------------------------------------------------
// Backend DTO types (verbatim field names from EventResponse / AssignmentResponse)
// ---------------------------------------------------------------------------

type BackendEventStatus = 'DRAFT' | 'PUBLIC' | 'ARCHIVED'
type BackendEventRole = 'MANAGER' | 'HANDLER'

/** Verbatim shape of the backend EventResponse record. */
interface BackendEventResponse {
  id: string // UUID serialised as string
  title: string
  slug: string
  description: string | null
  venue: string
  startsAt: string // Instant → ISO-8601 string
  endsAt: string // Instant → ISO-8601 string
  status: BackendEventStatus
  registrationQrToken: string | null
  checkinOpensAt: string | null // Instant → ISO-8601 string
  createdBy: string // UUID string
  createdAt: string // Instant → ISO-8601 string
  updatedAt: string // Instant → ISO-8601 string
}

/** Verbatim shape of the backend AssignmentResponse record. */
interface BackendAssignmentResponse {
  id: string // UUID string
  eventId: string
  userId: string
  userEmail: string
  userFullName: string
  eventRole: BackendEventRole
  assignedBy: string
  createdAt: string
}

// ---------------------------------------------------------------------------
// Paginated list envelope — backend wraps list responses with a 'pagination'
// sibling at the ApiResponse level (not inside data). The client.ts apiFetch
// returns data (the content array) directly; pagination is discarded for now.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Mappers — backend DTO → frontend shape
// ---------------------------------------------------------------------------

/** Map UPPERCASE backend EventStatus → Title-case frontend EventStatus. */
function mapStatus(s: BackendEventStatus): EventRow['status'] {
  switch (s) {
    case 'PUBLIC':
      return 'Public'
    case 'ARCHIVED':
      return 'Archived'
    case 'DRAFT':
    default:
      return 'Draft'
  }
}

/**
 * Map a BackendEventResponse to the frontend EventRow shape.
 *
 * Stubbed fields (not provided by EventResponse):
 *   - sa: ''         — backend has no sub-admin name in EventResponse
 *   - guests: 0      — registration count not in EventResponse
 *   - cap: 0         — capacity not in EventResponse
 * TODO(backend): add registrationCount, capacity, and managerName to EventResponse
 * so these can be populated without extra round-trips.
 */
function mapEventResponse(dto: BackendEventResponse): EventRow {
  // Use the date portion of startsAt as the display date.
  const date = dto.startsAt ? dto.startsAt.split('T')[0] ?? dto.startsAt : ''

  return {
    id: dto.id,
    name: dto.title,
    date,
    venue: dto.venue,
    status: mapStatus(dto.status),
    // TODO(backend): sa, guests, cap are not provided by EventResponse — stubbed
    sa: '',
    guests: 0,
    cap: 0,
  }
}

/** Map UPPERCASE backend EventRole → Title-case EventMember.role. */
function mapRole(r: BackendEventRole): EventMember['role'] {
  return r === 'MANAGER' ? 'Manager' : 'Handler'
}

/**
 * Derive avatar initials from a full name (first + last initial, uppercased).
 * Falls back to first two characters of the name.
 */
function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

/** Deterministic avatar colour from a string — cycles through a fixed palette. */
const AVATAR_PALETTE = ['#7C3AED', '#C026D3', '#2B2A3F', '#6D28D9', '#A855F7']
function avatarColor(seed: string): string {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length]!
}

/**
 * Map a BackendAssignmentResponse to the frontend EventMember shape.
 *
 * assignedMaterials is not provided by the assignments endpoint — stubbed to 0.
 * TODO(backend): expose material assignment counts per assignee in AssignmentResponse.
 */
function mapAssignmentResponse(dto: BackendAssignmentResponse): EventMember {
  return {
    id: dto.id,
    name: dto.userFullName,
    ini: initialsFrom(dto.userFullName),
    col: avatarColor(dto.userId),
    role: mapRole(dto.eventRole),
    email: dto.userEmail,
    // TODO(backend): assignedMaterials not in AssignmentResponse — stubbed
    assignedMaterials: 0,
  }
}

// ---------------------------------------------------------------------------
// Public accessors
// ---------------------------------------------------------------------------

/**
 * All events (admin Event Monitoring + dashboard table).
 * Calls GET /events?page=0&size=100.
 * Spring Pageable resolves `page` (0-based) and `size` from query params.
 */
export async function listEvents(): Promise<EventRow[]> {
  const dtos = await apiFetch<BackendEventResponse[]>('/events?page=0&size=100')
  return dtos.map(mapEventResponse)
}

/**
 * A single event by UUID string id.
 * Calls GET /events/{id}.
 */
export async function getEvent(id: string): Promise<EventRow | undefined> {
  try {
    const dto = await apiFetch<BackendEventResponse>(`/events/${id}`)
    return mapEventResponse(dto)
  } catch {
    // 404 → return undefined so callers can call notFound()
    return undefined
  }
}

/**
 * Members assigned to a single event (managers + handlers).
 * Calls GET /events/{eventId}/assignments.
 * Note: this is served by EventAssignmentController, not EventController, but
 * the path is nested under /events/{eventId} so it is co-located here.
 */
export async function listEventMembers(eventId: string): Promise<EventMember[]> {
  const dtos = await apiFetch<BackendAssignmentResponse[]>(`/events/${eventId}/assignments`)
  return dtos.map(mapAssignmentResponse)
}

// ---------------------------------------------------------------------------
// Mutation accessors — invoked from client components
// ---------------------------------------------------------------------------

/**
 * Create a new event.
 * POST /events — returns the newly created event mapped to EventRow.
 * The backend auto-generates the slug and sets status to DRAFT.
 *
 * UI form gaps in create-event-dialog.tsx (reported — do not silently default):
 *   - endsAt: no end date/time field in the dialog — add one.
 *   - checkinOpensAt: no check-in opens field — add one.
 *   - startsAt: dialog has a date-only <Input type="date">; caller must
 *     convert to a full ISO-8601 Instant string (e.g. append "T00:00:00Z").
 *   - capacity: dialog collects a number input but EventCreateRequest has no
 *     capacity field — remove that input or defer to a future DTO update.
 */
export async function createEvent(payload: EventCreatePayload): Promise<EventRow> {
  const dto = await apiFetch<BackendEventResponse>('/events', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return mapEventResponse(dto)
}

/**
 * Update an existing event's details.
 * PUT /events/{eventId} — null fields are left unchanged by the backend.
 * Returns the updated event mapped to EventRow.
 */
export async function updateEvent(eventId: string, payload: EventUpdatePayload): Promise<EventRow> {
  const dto = await apiFetch<BackendEventResponse>(`/events/${eventId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
  return mapEventResponse(dto)
}

/**
 * Transition a DRAFT event to PUBLIC status.
 * POST /events/{eventId}/publish — no request body.
 * Returns the updated event mapped to EventRow.
 */
export async function publishEvent(eventId: string): Promise<EventRow> {
  const dto = await apiFetch<BackendEventResponse>(`/events/${eventId}/publish`, {
    method: 'POST',
  })
  return mapEventResponse(dto)
}

/**
 * Transition a PUBLIC event to ARCHIVED status.
 * POST /events/{eventId}/archive — no request body.
 * Returns the updated event mapped to EventRow.
 */
export async function archiveEvent(eventId: string): Promise<EventRow> {
  const dto = await apiFetch<BackendEventResponse>(`/events/${eventId}/archive`, {
    method: 'POST',
  })
  return mapEventResponse(dto)
}

/**
 * Permanently delete an event (ADMIN only; sub-admins cannot delete — hard RBAC gate).
 * DELETE /events/{eventId} — backend returns ApiResponse<Void> with no data payload.
 * Returns void; callers should remove the row from local state on success.
 */
export async function deleteEvent(eventId: string): Promise<void> {
  // Backend returns ApiResponse<Void>; apiFetch unwraps data which will be null/undefined.
  await apiFetch<null>(`/events/${eventId}`, { method: 'DELETE' })
}

/**
 * Rotate the registration QR token for an event.
 * POST /events/{eventId}/registration-qr/rotate — no request body.
 * Returns the updated event (with the new registrationQrToken) mapped to EventRow.
 * Note: EventRow does not surface registrationQrToken; callers that need the new
 * token should call apiFetch<BackendEventResponse> directly or extend EventRow.
 */
export async function rotateRegistrationQr(eventId: string): Promise<EventRow> {
  const dto = await apiFetch<BackendEventResponse>(`/events/${eventId}/registration-qr/rotate`, {
    method: 'POST',
  })
  return mapEventResponse(dto)
}

// ---------------------------------------------------------------------------
// Accessors not yet wired to the real API (mock-backed, kept for compatibility)
// ---------------------------------------------------------------------------

/**
 * Resolve a public registration param that may be a slug or an id.
 * The backend provides GET /events/{eventId} by UUID only; slug resolution
 * is not yet exposed by an API endpoint. Kept mock-backed for this pass.
 * TODO(backend): expose GET /events/by-slug/{slug} or include slug lookup in listEvents.
 */
export function eventBySlugOrId(value: string): EventRow | undefined {
  return lookupBySlugOrId(value)
}

/** Featured photo-card events for the dashboard. Mock-backed (no backend endpoint). */
export function listFeaturedEvents(): FeaturedEvent[] {
  return mockFeatured
}

/**
 * Day-of agenda for an event. Mock-backed — the backend has no agenda endpoint yet.
 * TODO(backend): implement GET /events/{eventId}/agenda when agenda is in scope.
 */
export function getAgenda(_eventId?: string): AgendaItem[] {
  return eventAgenda
}
