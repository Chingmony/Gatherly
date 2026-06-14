import { apiFetch } from "./client";
import type { PublicEventCard, PublicFormResponse, PublicTicket, RegisterResponse } from "./types";

/**
 * Public guest endpoints (docs/03 §4.9) — unauthenticated. Server Components use {@link serverFetch}
 * for reads (see server.ts); the register mutation runs client-side via {@link apiFetch}.
 */

export function registerForEvent(
  eventId: string,
  answers: Record<string, unknown>,
): Promise<RegisterResponse> {
  return apiFetch<RegisterResponse>(`/public/events/${eventId}/register`, {
    method: "POST",
    body: JSON.stringify({ answers }),
  });
}

/** Re-send the QR-ticket email (docs/03 §4.9). 202 Accepted; delivery internals aren't surfaced. */
export function resendTicket(checkinToken: string): Promise<void> {
  return apiFetch<void>(`/public/tickets/${checkinToken}/resend`, { method: "POST" });
}

export type { PublicEventCard, PublicFormResponse, PublicTicket };
