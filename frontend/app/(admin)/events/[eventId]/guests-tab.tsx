"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { revokeTicket } from "@/lib/api/attendance";
import { ApiError } from "@/lib/api/client";
import type { SubmissionResponse, TicketStatus } from "@/lib/api/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const STATUS: Record<TicketStatus, { label: string; variant: "neutral" | "green" | "danger" }> = {
  PENDING: { label: "Registered", variant: "neutral" },
  DELIVERED: { label: "Ticket sent", variant: "green" },
  CHECKED_IN: { label: "Checked in", variant: "green" },
  REVOKED: { label: "Cancelled", variant: "danger" },
};

/**
 * Manage Guests (docs/03 §4.8). Lists registrants; a manager can revoke a still-valid ticket
 * (PENDING/DELIVERED) so later scans are rejected (docs/03 §4.10). A checked-in or already-revoked
 * ticket can't be revoked.
 */
export function GuestsTab({
  eventId,
  submissions,
  canManage,
}: {
  eventId: string;
  submissions: SubmissionResponse[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function revoke(submissionId: string) {
    setError(null);
    setBusy(submissionId);
    try {
      await revokeTicket(eventId, submissionId);
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not revoke ticket.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-[13px] font-semibold text-[var(--text-muted)]">{submissions.length} registered</p>
      {error && <p role="alert" className="text-[13px] font-semibold text-[var(--danger)]">{error}</p>}
      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)]">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[var(--border)] text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--text-muted)]">
              <th className="px-4 py-3">Guest</th><th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Phone</th><th className="px-4 py-3">Status</th>
              {canManage && <th className="px-4 py-3" />}
            </tr>
          </thead>
          <tbody>
            {submissions.length === 0 && (
              <tr><td colSpan={canManage ? 5 : 4} className="px-4 py-8 text-center text-[13px] text-[var(--text-muted)]">No registrations yet.</td></tr>
            )}
            {submissions.map((s) => {
              const st = STATUS[s.qrStatus];
              const revocable = s.qrStatus === "PENDING" || s.qrStatus === "DELIVERED";
              return (
                <tr key={s.id} className="border-b border-[var(--border)] last:border-0">
                  <td className="px-4 py-3 text-[13px] font-semibold text-[var(--text)]">{s.guestName ?? "—"}</td>
                  <td className="px-4 py-3 text-[13px] text-[var(--text-muted)]">{s.guestEmail}</td>
                  <td className="px-4 py-3 text-[13px] text-[var(--text-muted)]">{s.guestPhone}</td>
                  <td className="px-4 py-3"><Badge variant={st.variant} dot={false}>{st.label}</Badge></td>
                  {canManage && (
                    <td className="px-4 py-3 text-right">
                      {revocable && (
                        <Button variant="ghost" size="sm" disabled={busy === s.id} onClick={() => revoke(s.id)}>
                          {busy === s.id ? "Revoking…" : "Revoke"}
                        </Button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
