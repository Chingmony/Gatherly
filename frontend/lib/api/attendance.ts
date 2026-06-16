/**
 * Attendance & registration reads for the organizer/handler event views. Wraps
 * `GET /events/{id}/attendance` and `GET /events/{id}/submissions` (backend
 * `AttendanceController`), both gated by `@eventSecurity.canView` — so an ADMIN or
 * any assigned MANAGER/HANDLER may read them. These are read-only; manual check-in
 * and revoke are `canManage` and intentionally not wrapped here.
 */
import { apiFetch } from "./client";

/** A confirmed attendance record — mirrors backend `CheckinResponse`. */
export interface CheckinResponse {
  checkinId: string;
  submissionId: string;
  guestName: string;
  guestPhone: string | null;
  scannedBy: string | null;
  /** `SCAN` | `MANUAL` (backend `CheckinSource`). */
  source: string;
  checkedInAt: string;
}

/** Live attendance view — mirrors backend `AttendanceSummary`. */
export interface AttendanceSummary {
  eventId: string;
  totalRegistered: number;
  totalCheckedIn: number;
  /** Confirmed check-ins, most recent first. */
  checkins: CheckinResponse[];
}

/** Guest registration summary — mirrors backend `SubmissionSummary`. */
export interface SubmissionSummary {
  id: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  /** Ticket status (backend `TicketStatus`, e.g. `VALID` / `CHECKED_IN` / `REVOKED`). */
  qrStatus: string;
  submittedAt: string;
}

export interface ListSubmissionsParams {
  search?: string;
  page?: number;
  size?: number;
  signal?: AbortSignal;
}

/** Counts + confirmed check-ins for an event. Assigned handlers may read this. */
export async function getAttendance(eventId: string, signal?: AbortSignal): Promise<AttendanceSummary> {
  return apiFetch<AttendanceSummary>(`/events/${encodeURIComponent(eventId)}/attendance`, { signal });
}

/** Registrant list for an event (single page, default size 100). Optional name/email search. */
export async function listSubmissions(
  eventId: string,
  params: ListSubmissionsParams = {}
): Promise<SubmissionSummary[]> {
  const { search, page, size = 100, signal } = params;
  const qs = new URLSearchParams();
  if (search) qs.set("search", search);
  if (page != null) qs.set("page", String(page));
  qs.set("size", String(size));
  return apiFetch<SubmissionSummary[]>(
    `/events/${encodeURIComponent(eventId)}/submissions?${qs.toString()}`,
    { signal }
  );
}

/**
 * Mask a guest email for handler views (least-privilege read of "summaries") —
 * keeps the first character and the domain: `kimhout@gmail.com` → `k••••@gmail.com`.
 */
export function maskEmail(email: string | null): string {
  if (!email) return "—";
  const at = email.indexOf("@");
  if (at <= 0) return "•••";
  const head = email.slice(0, 1);
  const domain = email.slice(at);
  return `${head}${"•".repeat(Math.max(2, at - 1))}${domain}`;
}

/** Mask a guest phone, surfacing only the last two digits: `+855 12 345 678` → `•••• 78`. */
export function maskPhone(phone: string | null): string {
  if (!phone) return "—";
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 2) return "••••";
  return `•••• ${digits.slice(-2)}`;
}
