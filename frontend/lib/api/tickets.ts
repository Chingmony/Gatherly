/**
 * Public (guest) ticket portal — wraps the unauthenticated
 * `GET /api/v1/public/tickets/{checkinToken}` lookup and the resend endpoint.
 */

import { apiFetch } from "./client";

/** Lifecycle states mirrored from the backend `TicketStatus` enum. */
export type TicketStatus = "PENDING" | "DELIVERED" | "CHECKED_IN" | "REVOKED";

/** Guest-safe ticket projection returned by the public ticket lookup. */
export interface Ticket {
  checkinToken: string;
  ticketStatus: TicketStatus;
  guestName: string;
  eventTitle: string;
  venue: string | null;
  /** ISO-8601 instant when the event begins. */
  startsAt: string | null;
  /** Server-rendered QR as a `data:image/png;base64,…` data URL. */
  qrImageDataUrl: string;
}

/** Look up a ticket by its opaque check-in token. 404 → unknown token. */
export async function getTicket(checkinToken: string, signal?: AbortSignal): Promise<Ticket> {
  return apiFetch<Ticket>(`/public/tickets/${encodeURIComponent(checkinToken)}`, { signal });
}

/** Re-send the ticket email to the registered guest. Rate-limited server-side. */
export async function resendTicket(checkinToken: string, signal?: AbortSignal): Promise<void> {
  return apiFetch<void>(`/public/tickets/${encodeURIComponent(checkinToken)}/resend`, {
    method: "POST",
    signal,
  });
}
