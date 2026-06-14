import { apiFetch } from "./client";
import type { AttendanceResponse, CheckinResult } from "./types";

/**
 * Attendance — organizer QR scan (docs/03 §4.10, docs/05 §6). The scanner and live attendance feed
 * are highly-interactive client islands, so these call the API directly from the browser. Server
 * Components read the live feed via `serverFetch` for first paint.
 */

/** Confirm attendance by scanning a guest's QR (checkinToken). `canView` (assigned staff). */
export function scan(eventId: string, checkinToken: string): Promise<CheckinResult> {
  return apiFetch<CheckinResult>(`/events/${eventId}/attendance/scan`, {
    method: "POST",
    body: JSON.stringify({ checkinToken }),
  });
}

/** Manual staff override without a QR. `canManage` (Admin / event MANAGER). */
export function manualCheckin(eventId: string, submissionId: string): Promise<CheckinResult> {
  return apiFetch<CheckinResult>(`/events/${eventId}/attendance/manual`, {
    method: "POST",
    body: JSON.stringify({ submissionId }),
  });
}

/** Invalidate a ticket so later scans are rejected. `canManage`. */
export function revokeTicket(eventId: string, submissionId: string): Promise<void> {
  return apiFetch<void>(`/events/${eventId}/tickets/${submissionId}/revoke`, { method: "POST" });
}

/** Live attendance list + counts. `canView`. */
export function liveAttendance(eventId: string): Promise<AttendanceResponse> {
  return apiFetch<AttendanceResponse>(`/events/${eventId}/attendance`);
}
