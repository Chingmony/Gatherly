import Link from "next/link";
import { serverFetch } from "@/lib/api/server";
import { ApiError } from "@/lib/api/client";
import type { PublicTicket } from "@/lib/api/types";
import { PublicTopbar } from "@/components/public-topbar";
import { QrTicket } from "@/components/qr-ticket";
import { ResendButton } from "./resend-button";
import { Badge } from "@/components/ui/badge";

/**
 * Guest ticket portal (docs/03 §4.9): the personal QR ticket + live status. The token is a bearer
 * secret — anyone with the link can present it; confirmation still requires an organizer scan (M7).
 */
export default async function TicketPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  let ticket: PublicTicket | null = null;
  try {
    ticket = await serverFetch<PublicTicket>(`/public/tickets/${token}`);
  } catch (e) {
    if (!(e instanceof ApiError && e.status === 404)) throw e;
  }

  return (
    <div className="min-h-screen">
      <PublicTopbar />
      <main className="mx-auto max-w-[560px] px-5 pb-20">
        {!ticket ? (
          <div className="mt-10 rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-8 text-center shadow-[var(--shadow-card)]">
            <h1 className="text-[16px] font-bold text-[var(--text-strong)]">Ticket not found</h1>
            <p className="mt-1 text-[13px] text-[var(--text-muted)]">This ticket link is invalid.</p>
            <Link href="/" className="mt-4 inline-block text-[13px] font-bold text-[var(--primary)] hover:underline">
              Browse events →
            </Link>
          </div>
        ) : (
          <div className="mt-10 rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-8 text-center shadow-[var(--shadow-card)]">
            <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-[var(--text-faint)]">Your ticket</p>
            <h1 className="mt-1 text-[20px] font-extrabold tracking-[-0.01em] text-[var(--text-strong)]">
              {ticket.eventTitle}
            </h1>
            {(ticket.guestName || ticket.venue) && (
              <p className="mt-1 text-[13px] text-[var(--text-muted)]">
                {[ticket.guestName, formatDate(ticket.startsAt), ticket.venue].filter(Boolean).join(" · ")}
              </p>
            )}
            <div className="mt-6 flex justify-center">
              <QrTicket token={ticket.checkinToken} />
            </div>
            <div className="mt-6">
              <Badge variant={statusVariant(ticket.qrStatus)}>{statusLabel(ticket.qrStatus)}</Badge>
            </div>
            <p className="mx-auto mt-4 max-w-xs text-[12px] text-[var(--text-faint)]">
              Show this QR at the entrance — an organizer will scan it to confirm your attendance.
              We’ve also emailed it to you.
            </p>
            {ticket.qrStatus !== "CHECKED_IN" && ticket.qrStatus !== "REVOKED" && (
              <ResendButton token={ticket.checkinToken} />
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function statusLabel(s: string): string {
  return { PENDING: "Valid · not yet sent", DELIVERED: "Valid", CHECKED_IN: "Checked in", REVOKED: "Cancelled" }[s] ?? s;
}
function statusVariant(s: string): "green" | "neutral" | "danger" {
  if (s === "CHECKED_IN" || s === "DELIVERED") return "green";
  if (s === "REVOKED") return "danger";
  return "neutral";
}
function formatDate(iso?: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
