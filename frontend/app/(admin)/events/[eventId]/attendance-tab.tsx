"use client";

import { useState } from "react";
import Link from "next/link";
import { liveAttendance } from "@/lib/api/attendance";
import type { AttendanceResponse } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const CARD = "rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]";

function when(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/**
 * Live attendance (docs/03 §4.10, docs/05 §6). Server-rendered first paint; a manual refresh re-reads
 * the feed. Confirming attendance happens on the scanner (linked below) — this view is read-only.
 */
export function AttendanceTab({ eventId, initial }: { eventId: string; initial: AttendanceResponse }) {
  const [data, setData] = useState<AttendanceResponse>(initial);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    setBusy(true);
    try {
      setData(await liveAttendance(eventId));
    } catch {
      /* keep the last snapshot */
    } finally {
      setBusy(false);
    }
  }

  const pct = data.registeredCount > 0 ? Math.round((data.checkedInCount / data.registeredCount) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-3">
          <div className={`${CARD} min-w-[120px]`}>
            <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--text-muted)]">Checked in</p>
            <p className="mt-1 text-[26px] font-extrabold text-[var(--text-strong)]">{data.checkedInCount}</p>
          </div>
          <div className={`${CARD} min-w-[120px]`}>
            <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--text-muted)]">Registered</p>
            <p className="mt-1 text-[26px] font-extrabold text-[var(--text-strong)]">{data.registeredCount}</p>
          </div>
          <div className={`${CARD} min-w-[120px]`}>
            <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--text-muted)]">Turnout</p>
            <p className="mt-1 text-[26px] font-extrabold text-[var(--primary)]">{pct}%</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" disabled={busy} onClick={refresh}>{busy ? "Refreshing…" : "Refresh"}</Button>
          <Link href={`/events/${eventId}/scan`}><Button size="sm">Open scanner</Button></Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)]">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[var(--border)] text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--text-muted)]">
              <th className="px-4 py-3">Guest</th><th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Time</th><th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Scanned by</th>
            </tr>
          </thead>
          <tbody>
            {data.records.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-[13px] text-[var(--text-muted)]">No check-ins yet.</td></tr>
            )}
            {data.records.map((r) => (
              <tr key={r.checkinId} className="border-b border-[var(--border)] last:border-0">
                <td className="px-4 py-3 text-[13px] font-semibold text-[var(--text)]">{r.guestName ?? "—"}</td>
                <td className="px-4 py-3 text-[13px] text-[var(--text-muted)]">{r.guestPhone}</td>
                <td className="px-4 py-3 text-[13px] text-[var(--text-muted)]">{when(r.checkedInAt)}</td>
                <td className="px-4 py-3">
                  <Badge variant={r.source === "MANUAL" ? "orange" : "green"} dot={false}>
                    {r.source === "MANUAL" ? "Manual" : "QR scan"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-[13px] text-[var(--text-muted)]">{r.scannedByName ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
