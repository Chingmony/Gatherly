import { apiFetch } from "./client";

/** Mirrors the backend `PingResponse` (M0 walking skeleton). */
export interface PingResponse {
  status: string;
  service: string;
  timestamp: string;
}

/** Calls the public `/ping` endpoint. Uncached so the demo reflects live backend state. */
export function getPing(): Promise<PingResponse> {
  return apiFetch<PingResponse>("/ping", { cache: "no-store" });
}
