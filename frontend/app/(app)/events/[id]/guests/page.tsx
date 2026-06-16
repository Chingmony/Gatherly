"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Search, Download, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { AvatarUser } from "@/components/ui/avatar-user";
import { Segmented } from "@/components/ui/segmented";
import { ApiError } from "@/lib/api/client";
import {
  listSubmissions, getAttendance, TICKET_STATUS_LABEL,
  type SubmissionSummary, type AttendanceSummary, type TicketStatus,
} from "@/lib/api/attendance";

const STATUS_VARIANT: Record<TicketStatus, "green" | "gray" | "danger" | "blue"> = {
  CHECKED_IN: "green",
  DELIVERED:  "blue",
  PENDING:    "gray",
  REVOKED:    "danger",
};

const FILTER_OPTIONS = [
  { id: "all",        label: "All" },
  { id: "checked-in", label: "Checked in" },
  { id: "active",     label: "Active" },
  { id: "revoked",    label: "Revoked" },
];

/** One roster row: a submission joined with its check-in time (if any). */
interface GuestRow {
  id: string;
  name: string;
  email: string;
  registered: string;
  status: TicketStatus;
  checkinAt: string | null;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function GuestsPage() {
  const params = useParams();
  const eventId = String(params.id);

  const [rows, setRows]       = useState<GuestRow[]>([]);
  const [totals, setTotals]   = useState<{ registered: number; checkedIn: number }>({ registered: 0, checkedIn: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [search, setSearch]   = useState("");
  const [filter, setFilter]   = useState("all");

  const load = useCallback((signal?: AbortSignal) =>
    Promise.all([listSubmissions(eventId, { signal }), getAttendance(eventId, signal)])
      .then(([subs, att]: [SubmissionSummary[], AttendanceSummary]) => {
        const checkinAt = new Map(att.checkins.map((c) => [c.submissionId, c.checkedInAt]));
        setRows(subs.map((s) => ({
          id: s.id,
          name: s.guestName || s.guestEmail,
          email: s.guestEmail,
          registered: s.submittedAt,
          status: s.qrStatus,
          checkinAt: checkinAt.get(s.id) ?? null,
        })));
        setTotals({ registered: att.totalRegistered, checkedIn: att.totalCheckedIn });
      })
      .catch((e) => { if (!signal?.aborted) setError(e instanceof ApiError ? e.message : "Failed to load guests."); }),
  [eventId]);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    load(ctrl.signal).finally(() => { if (!ctrl.signal.aborted) setLoading(false); });
    return () => ctrl.abort();
  }, [load]);

  const filtered = useMemo(() => rows.filter((g) => {
    const q = search.toLowerCase();
    const matchSearch = g.name.toLowerCase().includes(q) || g.email.toLowerCase().includes(q);
    const matchFilter =
      filter === "all" ||
      (filter === "checked-in" && g.status === "CHECKED_IN") ||
      (filter === "active" && (g.status === "PENDING" || g.status === "DELIVERED")) ||
      (filter === "revoked" && g.status === "REVOKED");
    return matchSearch && matchFilter;
  }), [rows, search, filter]);

  const revokedCount = rows.filter((g) => g.status === "REVOKED").length;

  function exportCsv() {
    const header = ["Name", "Email", "Registered", "Status", "Checked in"];
    const lines = filtered.map((g) => [
      g.name, g.email, fmtDate(g.registered), TICKET_STATUS_LABEL[g.status],
      g.checkinAt ? fmtDateTime(g.checkinAt) : "",
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","));
    const csv = [header.join(","), ...lines].join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `guests-${eventId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-6 view-anim">
      <PageHeader title="Guests" sub="Registration list and attendance">
        <Button variant="ghost" size="sm" onClick={exportCsv} disabled={loading || rows.length === 0}>
          <Download size={13} /> Export CSV
        </Button>
      </PageHeader>

      {error ? (
        <Card><CardContent className="p-10 text-center text-sm font-semibold" style={{ color: "var(--danger)" }}>{error}</CardContent></Card>
      ) : (
        <>
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Total registered", value: totals.registered, color: "var(--text-strong)" },
              { label: "Checked in",       value: totals.checkedIn,   color: "var(--green-600)" },
              { label: "Revoked",          value: revokedCount,       color: "var(--danger)" },
            ].map(({ label, value, color }) => (
              <Card key={label}>
                <CardContent className="px-5 py-4">
                  <div className="text-xl font-extrabold" style={{ color }}>{loading ? "—" : value}</div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Filter + search */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <Segmented options={FILTER_OPTIONS} value={filter} onChange={setFilter} />
            <div className="relative sm:ml-auto">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-faint)" }} />
              <input
                type="search"
                placeholder="Search guests…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full sm:w-64 h-[38px] pl-9 pr-3.5 rounded-[var(--radius-md)] border text-sm font-semibold transition-all focus:outline-none focus:border-[var(--primary-hex,#6366f1)] focus:shadow-[0_0_0_4px_var(--primary-ring)]"
                style={{ background: "var(--surface)", borderColor: "var(--border-hex,#ecedf4)", color: "var(--text)" }}
              />
            </div>
          </div>

          {/* Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border-hex,#ecedf4)" }}>
                      {["Guest", "Registered", "Status", "Checked in"].map((h) => (
                        <th key={h} className="text-left text-xs font-bold uppercase tracking-wider px-5 py-3.5" style={{ color: "var(--text-muted)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={4} className="px-5 py-12 text-center" style={{ color: "var(--text-muted)" }}><Loader2 size={20} className="animate-spin inline" /></td></tr>
                    ) : filtered.length === 0 ? (
                      <tr><td colSpan={4} className="px-5 py-10 text-center text-sm" style={{ color: "var(--text-muted)" }}>{rows.length === 0 ? "No guests have registered yet." : "No guests match your filters."}</td></tr>
                    ) : (
                      filtered.map((g, i) => (
                        <tr key={g.id} className="transition-colors hover:bg-[var(--surface-2)]" style={{ borderBottom: i === filtered.length - 1 ? "none" : "1px solid var(--border-hex,#ecedf4)" }}>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <AvatarUser name={g.name} size={34} />
                              <div className="flex flex-col gap-0.5 min-w-0">
                                <span className="font-bold" style={{ color: "var(--text-strong)" }}>{g.name}</span>
                                <span className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{g.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-xs" style={{ color: "var(--text-muted)" }}>{fmtDate(g.registered)}</td>
                          <td className="px-5 py-3.5">
                            <StatusBadge variant={STATUS_VARIANT[g.status]}>{TICKET_STATUS_LABEL[g.status]}</StatusBadge>
                          </td>
                          <td className="px-5 py-3.5">
                            {g.checkinAt ? (
                              <span className="text-xs font-semibold" style={{ color: "var(--green-600)" }}>{fmtDateTime(g.checkinAt)}</span>
                            ) : g.status === "CHECKED_IN" ? (
                              <span className="text-xs font-semibold" style={{ color: "var(--green-600)" }}>Checked in</span>
                            ) : (
                              <span className="text-xs" style={{ color: "var(--text-faint)" }}>—</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
