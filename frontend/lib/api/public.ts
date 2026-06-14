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

export type { PublicEventCard, PublicFormResponse, PublicTicket };
