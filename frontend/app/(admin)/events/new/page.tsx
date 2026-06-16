import Link from "next/link";
import { CreateEventForm } from "./create-event-form";

/**
 * Admin "Create Event" page — full-page split layout (left inputs, right live preview).
 * Gated to ADMIN role; POST /events and the EVENT_COVER presign both enforce hasRole('ADMIN').
 */
export default function NewEventPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <Link
            href="/events"
            className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--text-muted)] transition-colors hover:text-[var(--primary)]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to Events
          </Link>
          <h1 className="text-[22px] font-bold tracking-[-0.02em] text-[var(--text-strong)]">
            Create Event
          </h1>
          <p className="text-[13px] text-[var(--text-muted)]">
            Saved as a draft — publish when you&apos;re ready.
          </p>
        </div>
      </div>

      <CreateEventForm />
    </div>
  );
}
