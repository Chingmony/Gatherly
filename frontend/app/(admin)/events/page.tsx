import { serverFetch } from "@/lib/api/server";
import { ApiError } from "@/lib/api/client";
import type { EventResponse, PageResponse, UserResponse } from "@/lib/api/types";
import { EventsManager } from "./events-manager";

/**
 * Events console (docs/03 §4.4, docs/05 §7). Server Component: fetches the event list and the
 * current user in parallel (cookie-forwarding, never cached). Admins see all events with full
 * lifecycle actions; Sub-admins and Handlers see only their assigned events with read-only access.
 */
export default async function EventsPage() {
  let page: PageResponse<EventResponse> | null = null;
  let me: UserResponse | null = null;
  let denied = false;

  try {
    [page, me] = await Promise.all([
      serverFetch<PageResponse<EventResponse>>("/events?size=50&sort=createdAt,desc"),
      serverFetch<UserResponse>("/me"),
    ]);
  } catch (e) {
    if (e instanceof ApiError && (e.status === 403 || e.status === 401)) {
      denied = true;
    } else {
      throw e;
    }
  }

  if (denied) {
    return (
      <div className="mx-auto max-w-md rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)]">
        <h1 className="text-[15px] font-bold text-[var(--text-strong)]">Not authorized</h1>
        <p className="mt-1 text-[13px] text-[var(--text-muted)]">You don&apos;t have access to events.</p>
      </div>
    );
  }

  const isAdmin = me?.globalRole === "ADMIN";
  const count = page?.totalElements ?? 0;

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div>
        <h1 className="text-[20px] font-bold tracking-[-0.01em] text-[var(--text-strong)]">
          {isAdmin ? "Events" : "My Assigned Events"}
        </h1>
        <p className="text-[12px] font-medium text-[var(--text-muted)]">
          {isAdmin
            ? `${count} total`
            : count === 0
            ? "No events assigned to you yet"
            : `${count} event${count === 1 ? "" : "s"} assigned to you`}
        </p>
      </div>
      <EventsManager initialEvents={page?.content ?? []} isAdmin={isAdmin} />
    </div>
  );
}
