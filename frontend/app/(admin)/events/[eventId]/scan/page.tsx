import Link from "next/link";
import { serverFetch } from "@/lib/api/server";
import { ApiError } from "@/lib/api/client";
import type { EventResponse } from "@/lib/api/types";
import { QrScanner } from "@/components/qr-scanner";

/**
 * Organizer QR scanner route (docs/05 §6). Available to any assigned staff (Admin/Manager/Handler)
 * — the server fetch enforces {@code canView}; a 403/404 renders an explicit not-authorized state.
 * The scan POST itself is re-gated server-side, so this guard is UX-only (docs/05 §2).
 */
export default async function ScanPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;

  let event: EventResponse | null = null;
  let denied = false;
  try {
    event = await serverFetch<EventResponse>(`/events/${eventId}`);
  } catch (e) {
    if (e instanceof ApiError && (e.status === 403 || e.status === 401 || e.status === 404)) denied = true;
    else throw e;
  }

  if (denied || !event) {
    return (
      <div className="mx-auto max-w-md space-y-3 rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)]">
        <h1 className="text-[15px] font-bold text-[var(--text-strong)]">Not authorized</h1>
        <p className="text-[13px] text-[var(--text-muted)]">You don’t have access to scan for this event.</p>
        <Link href="/events" className="inline-block text-[13px] font-bold text-[var(--primary)]">← Back to events</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <div>
        <Link href={`/events/${eventId}`} className="inline-block text-[12px] font-semibold text-[var(--text-faint)] hover:text-[var(--text)]">← {event.title}</Link>
        <h1 className="mt-1 text-[22px] font-extrabold tracking-[-0.01em] text-[var(--text-strong)]">Check-in scanner</h1>
        <p className="text-[13px] text-[var(--text-muted)]">Scan each guest’s QR ticket to confirm attendance.</p>
      </div>
      <QrScanner eventId={eventId} />
    </div>
  );
}
