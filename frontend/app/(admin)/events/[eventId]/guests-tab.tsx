"use client";

import type { SubmissionResponse, TicketStatus } from "@/lib/api/types";
import { Badge } from "@/components/ui/badge";

const STATUS: Record<TicketStatus, { label: string; variant: "neutral" | "green" | "danger" }> = {
  PENDING: { label: "Registered", variant: "neutral" },
  DELIVERED: { label: "Ticket sent", variant: "green" },
  CHECKED_IN: { label: "Checked in", variant: "green" },
  REVOKED: { label: "Cancelled", variant: "danger" },
};

/** Manage Guests (docs/03 §4.8): the registrant list for an event. */
export function GuestsTab({ submissions }: { submissions: SubmissionResponse[] }) {
  return (
    <div className="space-y-4">
      <p className="text-[13px] font-semibold text-[var(--text-muted)]">{submissions.length} registered</p>
      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)]">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[var(--border)] text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--text-muted)]">
              <th className="px-4 py-3">Guest</th><th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Phone</th><th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {submissions.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-[13px] text-[var(--text-muted)]">No registrations yet.</td></tr>
            )}
            {submissions.map((s) => {
              const st = STATUS[s.qrStatus];
              return (
                <tr key={s.id} className="border-b border-[var(--border)] last:border-0">
                  <td className="px-4 py-3 text-[13px] font-semibold text-[var(--text)]">{s.guestName ?? "—"}</td>
                  <td className="px-4 py-3 text-[13px] text-[var(--text-muted)]">{s.guestEmail}</td>
                  <td className="px-4 py-3 text-[13px] text-[var(--text-muted)]">{s.guestPhone}</td>
                  <td className="px-4 py-3"><Badge variant={st.variant} dot={false}>{st.label}</Badge></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
