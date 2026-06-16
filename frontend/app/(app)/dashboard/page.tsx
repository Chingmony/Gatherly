"use client";

import { useState, useEffect } from "react";
import { Users, Calendar, Clock, TrendingUp, Zap, ArrowRight, Eye } from "lucide-react";
import Link from "next/link";
import { StatTile } from "@/components/ui/stat-tile";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChipIco } from "@/components/ui/chip-ico";
import type { Role } from "@/lib/roles";
import { HandlerDashboard } from "./_components/handler-dashboard";
import { listEvents, type AdminEvent } from "@/lib/api/events";
import { ApiError } from "@/lib/api/client";

// Everything on this dashboard is derived from a single `listEvents()` call — the only authenticated
// aggregate the backend exposes. Metrics that would require per-event fan-out (check-ins, tasks, a
// live activity feed) are intentionally omitted; we only show what the events list can back honestly.

// ── Shared helpers ────────────────────────────────────────────────────────────

const EVENT_STATUS_VARIANTS: Record<string, { label: string; variant: "green" | "blue" | "gray" | "orange" | "primary" }> = {
  PUBLIC:   { label: "Public",   variant: "green" },
  DRAFT:    { label: "Draft",    variant: "gray" },
  ARCHIVED: { label: "Archived", variant: "orange" },
};

function formatEventDate(iso: string | null): string {
  if (!iso) return "Date TBD";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/** Fill rate as a 0–100 int, or null when the event is uncapped. */
function fillPctOf(ev: AdminEvent): number | null {
  const cap = ev.capacity ?? 0;
  if (cap <= 0) return null;
  return Math.min(100, Math.round(((ev.registeredCount ?? 0) / cap) * 100));
}

/** Indicator color for a fill-rate bar — green healthy, orange filling, danger at/near capacity. */
function fillColor(pct: number): string {
  if (pct >= 100) return "var(--danger)";
  if (pct >= 80) return "var(--orange)";
  return "var(--green-600)";
}

function isUpcoming(ev: AdminEvent): boolean {
  return !!ev.startsAt && new Date(ev.startsAt).getTime() > Date.now();
}

// ── Reusable event table (Admin + Manager share it) ───────────────────────────

function EventsTable({ events, loading, emptyMsg }: { events: AdminEvent[]; loading: boolean; emptyMsg: React.ReactNode }) {
  if (loading) {
    return (
      <div className="flex flex-col gap-2.5 px-6 py-5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-14 rounded-[var(--radius-md)] animate-pulse" style={{ background: "var(--surface-2)" }} />
        ))}
      </div>
    );
  }
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
        <ChipIco size={52} radius={16} variant="gray">
          <Calendar size={24} />
        </ChipIco>
        <div className="text-sm" style={{ color: "var(--text-muted)" }}>{emptyMsg}</div>
      </div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-separate" style={{ borderSpacing: 0 }}>
        <thead>
          <tr>
            {["Event", "Status", "Fill rate", "Date", ""].map((h) => (
              <th
                key={h || "actions"}
                className="text-left text-[11px] font-bold uppercase tracking-widest px-6 py-3"
                style={{ color: "var(--text-faint)", background: "var(--surface-2)", borderBottom: "1px solid var(--border-hex,#ecedf4)" }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {events.map((ev, i) => {
            const st = EVENT_STATUS_VARIANTS[ev.status] ?? { label: ev.status, variant: "gray" as const };
            const pct = fillPctOf(ev);
            const reg = ev.registeredCount ?? 0;
            const last = i === events.length - 1;
            return (
              <tr key={ev.id} className="group transition-colors hover:bg-[var(--surface-2)]">
                <td className="px-6 py-4" style={{ borderBottom: last ? "none" : "1px solid var(--border-hex,#ecedf4)" }}>
                  <Link
                    href={`/events/${ev.id}/workspace`}
                    className="font-bold text-sm transition-colors group-hover:text-[var(--primary-hex,#6366f1)]"
                    style={{ color: "var(--text-strong)" }}
                  >
                    {ev.title}
                  </Link>
                </td>
                <td className="px-6 py-4" style={{ borderBottom: last ? "none" : "1px solid var(--border-hex,#ecedf4)" }}>
                  <StatusBadge variant={st.variant} dot>{st.label}</StatusBadge>
                </td>
                <td className="px-6 py-4 min-w-[170px]" style={{ borderBottom: last ? "none" : "1px solid var(--border-hex,#ecedf4)" }}>
                  {pct !== null ? (
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span style={{ color: "var(--text-muted)" }}>{reg.toLocaleString()} / {(ev.capacity ?? 0).toLocaleString()}</span>
                        <span className="font-bold tabular-nums" style={{ color: fillColor(pct) }}>{pct}%</span>
                      </div>
                      <Progress value={pct} indicatorColor={fillColor(pct)} />
                    </div>
                  ) : (
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>{reg.toLocaleString()} · uncapped</span>
                  )}
                </td>
                <td
                  className="px-6 py-4 text-sm whitespace-nowrap"
                  style={{ color: "var(--text-muted)", borderBottom: last ? "none" : "1px solid var(--border-hex,#ecedf4)" }}
                >
                  {formatEventDate(ev.startsAt)}
                </td>
                <td className="px-6 py-4 text-right" style={{ borderBottom: last ? "none" : "1px solid var(--border-hex,#ecedf4)" }}>
                  <Button asChild variant="ghost" size="icon-sm" className="opacity-60 transition-opacity group-hover:opacity-100" title="Open workspace">
                    <Link href={`/events/${ev.id}/workspace`}><Eye size={15} /></Link>
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Admin: Command Center ─────────────────────────────────────────────────────

function AdminDashboard() {
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    listEvents({ size: 200, signal: controller.signal })
      .then((ev) => { if (!cancelled) setEvents(ev ?? []); })
      .catch((e) => { if (!cancelled) setError(e instanceof ApiError ? e.message : "Failed to load dashboard data."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; controller.abort(); };
  }, []);

  // Derived metrics — all from the single events list.
  const totalRegistrations = events.reduce((sum, e) => sum + (e.registeredCount ?? 0), 0);
  const activeEvents = events.filter((e) => e.status === "PUBLIC").length;
  const draftEvents = events.filter((e) => e.status === "DRAFT").length;
  const archivedEvents = events.filter((e) => e.status === "ARCHIVED").length;
  const upcoming = events.filter(isUpcoming).length;
  const totalCapacity = events.reduce((sum, e) => sum + (e.capacity ?? 0), 0);
  const overallFill = totalCapacity > 0 ? Math.min(100, Math.round((totalRegistrations / totalCapacity) * 100)) : 0;

  const dash = (v: string) => (loading ? "—" : v);
  const STATS = [
    {
      label: "Total Registrations", value: dash(totalRegistrations.toLocaleString()),
      delta: loading ? "" : `across ${events.length} event${events.length !== 1 ? "s" : ""}`,
      trend: "neutral" as const, icon: Users, iconColor: "var(--primary-hex,#6366f1)", iconBg: "var(--primary-soft)",
    },
    {
      label: "Active Events", value: dash(String(activeEvents)),
      delta: loading ? "" : `${draftEvents} draft · ${archivedEvents} archived`,
      trend: "neutral" as const, icon: Calendar, iconColor: "var(--blue)", iconBg: "var(--blue-soft)",
    },
    {
      label: "Upcoming Events", value: dash(String(upcoming)),
      delta: loading ? "" : "scheduled ahead",
      trend: "neutral" as const, icon: Clock, iconColor: "var(--green-600)", iconBg: "var(--green-soft)",
    },
    {
      label: "Overall Fill Rate", value: dash(totalCapacity > 0 ? `${overallFill}%` : "—"),
      delta: loading ? "" : (totalCapacity > 0 ? `${totalRegistrations.toLocaleString()} / ${totalCapacity.toLocaleString()} seats` : "no capacities set"),
      trend: overallFill >= 80 ? ("up" as const) : ("neutral" as const), icon: TrendingUp, iconColor: "var(--orange)", iconBg: "var(--orange-soft)",
    },
  ];

  // Event table: 6 most-recently updated.
  const tableEvents = [...events]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 6);

  return (
    <div className="flex flex-col gap-7 view-anim">
      {error && (
        <div className="rounded-[var(--radius-md)] px-4 py-3 text-sm font-semibold" style={{ background: "var(--danger-soft)", color: "var(--danger)" }}>{error}</div>
      )}

      <PageHeader title="Command Center" sub="Real-time overview of all events and operations">
        <Button asChild variant="ghost" size="sm"><Link href="/events">View all</Link></Button>
        <Button asChild size="sm"><Link href="/events/new"><Zap size={15} /> New event</Link></Button>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">{STATS.map((s) => <StatTile key={s.label} {...s} />)}</div>

      <Card className="overflow-hidden mt-4">
        <CardHeader className="px-6 pt-6 pb-4" style={{ borderBottom: "1px solid var(--border-hex,#ecedf4)" }}>
          <div className="flex flex-col gap-0.5">
            <CardTitle>Event Control Center</CardTitle>
            <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>Most recently updated events</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <EventsTable
            events={tableEvents}
            loading={loading}
            emptyMsg={<>No events yet. <Link href="/events/new" className="underline font-semibold" style={{ color: "var(--primary-hex,#6366f1)" }}>Create one</Link>.</>}
          />
        </CardContent>
      </Card>
    </div>
  );
}

// ── Manager: Event Overview ───────────────────────────────────────────────────

function ManagerDashboard() {
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    listEvents({ size: 100, signal: controller.signal })
      .then((ev) => { if (!cancelled) setEvents(ev ?? []); })
      .catch(() => { /* non-blocking — show what we have */ })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; controller.abort(); };
  }, []);

  // listEvents is role-scoped server-side: a MANAGER only receives events they're assigned to.
  const myEvents = events.filter((e) => e.status === "PUBLIC" || e.status === "DRAFT");
  const totalRegistered = events.reduce((sum, e) => sum + (e.registeredCount ?? 0), 0);
  const upcoming = events.filter(isUpcoming).length;
  const nextPublicEvent = events
    .filter((e) => e.status === "PUBLIC" && e.startsAt)
    .sort((a, b) => new Date(a.startsAt!).getTime() - new Date(b.startsAt!).getTime())[0];

  const dash = (v: string) => (loading ? "—" : v);
  const STATS = [
    { label: "Assigned Events", value: dash(String(myEvents.length)), icon: Calendar, iconColor: "var(--blue)", iconBg: "var(--blue-soft)", delta: "Active", trend: "neutral" as const },
    { label: "Total Registered", value: dash(totalRegistered.toLocaleString()), icon: Users, iconColor: "var(--primary-hex)", iconBg: "var(--primary-soft)", delta: "Across your events", trend: "neutral" as const },
    { label: "Upcoming Events", value: dash(String(upcoming)), icon: Clock, iconColor: "var(--green-600)", iconBg: "var(--green-soft)", delta: "Scheduled ahead", trend: "neutral" as const },
    {
      label: "Next Event",
      value: nextPublicEvent ? new Date(nextPublicEvent.startsAt!).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—",
      icon: TrendingUp, iconColor: "var(--orange)", iconBg: "var(--orange-soft)",
      delta: nextPublicEvent?.title ?? "No upcoming events", trend: "neutral" as const,
    },
  ];

  return (
    <div className="flex flex-col gap-7 view-anim">
      <PageHeader title="My Events" sub="Overview of events you manage">
        <Button asChild size="sm">
          <Link href={events[0] ? `/events/${events[0].id}/workspace` : "/events"}>Open workspace <ArrowRight size={14} /></Link>
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">{STATS.map((s) => <StatTile key={s.label} {...s} />)}</div>

      <Card className="overflow-hidden mt-4">
        <CardHeader className="px-6 pt-6 pb-4" style={{ borderBottom: "1px solid var(--border-hex,#ecedf4)" }}>
          <div className="flex flex-col gap-0.5">
            <CardTitle>My Events</CardTitle>
            <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>Events assigned to you</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <EventsTable events={myEvents} loading={loading} emptyMsg="No active events assigned." />
        </CardContent>
      </Card>
    </div>
  );
}

// ── Root: selects view by role ────────────────────────────────────────────────

export default function DashboardPage() {
  const [role, setRole] = useState<Role>("handler");

  useEffect(() => {
    const stored = sessionStorage.getItem("gatherly_role") as Role | null;
    if (stored === "admin" || stored === "subadmin" || stored === "handler") setRole(stored);
  }, []);

  if (role === "admin")    return <AdminDashboard />;
  if (role === "subadmin") return <ManagerDashboard />;
  return <HandlerDashboard />;
}
