/**
 * Guests & attendance surface — wraps the backend `AttendanceController`:
 *   GET  /events/{eventId}/submissions                 list guest registrations (paged)
 *   GET  /events/{eventId}/attendance                  live counts + confirmed check-ins
 *   POST /events/{eventId}/attendance/scan             organizer QR scan
 *   POST /events/{eventId}/attendance/manual           staff manual check-in
 *   POST /events/{eventId}/tickets/{submissionId}/revoke   invalidate a ticket
 *
 * Listing follows event view rights; check-in/revoke need handle/manage rights. Attendance
 * scan is idempotent server-side — a re-scan throws `ApiError` 409 `ALREADY_CHECKED_IN`.
 */
import { apiFetch } from './client'

/** Lifecycle of a guest's QR ticket — mirrors backend `TicketStatus`. */
export type TicketStatus = 'PENDING' | 'DELIVERED' | 'CHECKED_IN' | 'REVOKED'

/** How a check-in was recorded — mirrors backend `CheckinSource`. */
export type CheckinSource = 'QR_SCAN' | 'MANUAL'

/** One row of an event's guest list — mirrors backend `SubmissionSummary`. */
export interface SubmissionSummary {
  id: string
  guestName: string | null
  guestEmail: string
  guestPhone: string
  qrStatus: TicketStatus
  submittedAt: string
}

/** Result of a check-in (scan or manual) — mirrors backend `CheckinResponse`. */
export interface CheckinResponse {
  checkinId: string
  submissionId: string
  guestName: string | null
  guestPhone: string
  scannedBy: string
  source: CheckinSource
  checkedInAt: string
}

/** Live attendance roll-up — mirrors backend `AttendanceSummary`. */
export interface AttendanceSummary {
  eventId: string
  totalRegistered: number
  totalCheckedIn: number
  checkins: CheckinResponse[]
}

/** Whitelisted sort keys for the guest list — mirrors backend submissions sort. */
export type SubmissionSort = 'DATE' | 'NAME' | 'EMAIL' | 'STATUS'

export interface ListSubmissionsParams {
  search?: string
  sort?: SubmissionSort
  direction?: 'ASC' | 'DESC'
  signal?: AbortSignal
}

/** Paginated, searchable guest list for an event. Returns a single page (size 100). */
export function listSubmissions(
  eventId: string,
  params: ListSubmissionsParams = {}
): Promise<SubmissionSummary[]> {
  const { search, sort, direction, signal } = params
  const qs = new URLSearchParams()
  if (search) qs.set('search', search)
  if (sort) qs.set('sort', sort)
  if (direction) qs.set('direction', direction)
  qs.set('size', '100')
  return apiFetch<SubmissionSummary[]>(`/events/${eventId}/submissions?${qs.toString()}`, {
    signal,
  })
}

/** Live attendance counts and the list of confirmed check-ins for an event. */
export function getAttendance(eventId: string, signal?: AbortSignal): Promise<AttendanceSummary> {
  return apiFetch<AttendanceSummary>(`/events/${eventId}/attendance`, { signal })
}

/** Record a check-in by scanning a guest's QR `checkinToken`. 409 `ALREADY_CHECKED_IN` on re-scan. */
export function scanTicket(eventId: string, checkinToken: string): Promise<CheckinResponse> {
  return apiFetch<CheckinResponse>(`/events/${eventId}/attendance/scan`, {
    method: 'POST',
    body: { checkinToken },
  })
}

/** Staff manual check-in (no QR) by submission id. 409 `ALREADY_CHECKED_IN` if already in. */
export function manualCheckin(eventId: string, submissionId: string): Promise<CheckinResponse> {
  return apiFetch<CheckinResponse>(`/events/${eventId}/attendance/manual`, {
    method: 'POST',
    body: { submissionId },
  })
}

/** Invalidate a guest's ticket (Manager/Admin). The QR can no longer be scanned. */
export function revokeTicket(eventId: string, submissionId: string): Promise<void> {
  return apiFetch<void>(`/events/${eventId}/tickets/${submissionId}/revoke`, { method: 'POST' })
}

export const TICKET_STATUS_LABEL: Record<TicketStatus, string> = {
  PENDING: 'Pending',
  DELIVERED: 'Delivered',
  CHECKED_IN: 'Checked in',
  REVOKED: 'Revoked',
}
