"use client";

import { useState, useEffect } from "react";
import { Users, Calendar, Clock, TrendingUp, Zap, ArrowRight, Eye, MapPin, ArrowUpRight, Sparkles, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { StatTile } from "@/components/ui/stat-tile";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChipIco, type ChipIcoProps } from "@/components/ui/chip-ico";
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

/** "Sat 3:00 PM" style time, or a TBD fallback. */
function formatTime(iso: string | null): string {
  if (!iso) return "Time TBD";
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

// ── Ventixe-style dashboard widgets (Admin) ───────────────────────────────────

/** Compact KPI card: soft-tinted icon + label + value. */
function VentixeStat({ label, value, icon: Icon, variant, loading }: {
  label: string; value: string; icon: LucideIcon; variant: ChipIcoProps["variant"]; loading: boolean;
}) {
  return (
    <div className="rounded-[var(--radius-xl)] border border-[var(--border-hex,#ecedf4)] bg-[var(--surface)] shadow-[var(--shadow-card)] p-5 flex items-center gap-3.5">
      <ChipIco variant={variant} size={44} radius={12}><Icon size={20} /></ChipIco>
      <div className="flex flex-col min-w-0">
        <span className="text-[12px] font-semibold truncate" style={{ color: "var(--text-muted)" }}>{label}</span>
        <span className="text-[24px] font-extrabold leading-tight tabular-nums" style={{ color: "var(--text-strong)" }}>{loading ? "—" : value}</span>
      </div>
    </div>
  );
}

/** SVG donut ring. Segments are drawn clockwise from 12 o'clock using a normalized pathLength. */
function DonutRing({ segments, size = 184, stroke = 24 }: {
  segments: { label: string; value: number; color: string }[]; size?: number; stroke?: number;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const r = (size - stroke) / 2;
  const c = size / 2;
  let acc = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle cx={c} cy={c} r={r} fill="none" stroke="var(--surface-3)" strokeWidth={stroke} />
      {segments.map((seg) => {
        const pct = (seg.value / total) * 100;
        const node = (
          <circle
            key={seg.label}
            cx={c}
            cy={c}
            r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth={stroke}
            pathLength={100}
            strokeDasharray={`${pct} ${100 - pct}`}
            strokeDashoffset={-acc}
            strokeLinecap="butt"
          />
        );
        acc += pct;
        return node;
      })}
    </svg>
  );
}

/** CSS column-bar chart — bars grow from the baseline; the tallest fills the full height. */
function BarsChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-2.5 h-[240px] pt-5">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center min-w-0 h-full">
          <div className="relative flex-1 w-full flex items-end justify-center">
            <div
              className="relative w-full max-w-[30px] rounded-t-[6px] transition-all duration-500"
              style={{ height: `${Math.max((d.value / max) * 100, 2)}%`, background: "var(--primary-hex,#6366f1)" }}
            >
              <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[11px] font-bold tabular-nums" style={{ color: "var(--text-muted)" }}>{d.value.toLocaleString()}</span>
            </div>
          </div>
          <span className="text-[11px] font-semibold truncate w-full text-center mt-2" style={{ color: "var(--text-faint)" }} title={d.label}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

/** Featured "Next Event" card with cover, meta, and a pink CTA. */
function FeaturedEvent({ ev }: { ev: AdminEvent | undefined }) {
  if (!ev) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
          <ChipIco size={52} radius={16} variant="pink"><Sparkles size={24} /></ChipIco>
          <div className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>No upcoming public events</div>
        </CardContent>
      </Card>
    );
  }
  const cover = ev.coverImageUrl
    ? `url(${ev.coverImageUrl}) center/cover no-repeat`
    : ev.coverColor || "var(--surface-3)";
  return (
    <Card className="overflow-hidden">
      <div className="relative h-[136px] border-b" style={{ background: cover, borderColor: "var(--border-hex,#ecedf4)" }}>
        {ev.category && (
          <span className="absolute top-3 left-3 text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.92)", color: "var(--text-strong)" }}>
            {ev.category}
          </span>
        )}
      </div>
      <CardContent className="flex flex-col gap-2.5 pt-4">
        <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>Next Event</span>
        <h3 className="text-[16px] font-extrabold leading-snug" style={{ color: "var(--text-strong)", margin: 0 }}>{ev.title}</h3>
        {ev.venue && (
          <div className="flex items-center gap-1.5 text-[13px]" style={{ color: "var(--text-muted)" }}>
            <MapPin size={14} className="flex-shrink-0" /> <span className="truncate">{ev.venue}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5 text-[13px]" style={{ color: "var(--text-muted)" }}>
          <Calendar size={14} className="flex-shrink-0" />
          <span>{formatEventDate(ev.startsAt)}{ev.startsAt ? ` · ${formatTime(ev.startsAt)}` : ""}</span>
        </div>
        <Button asChild variant="ghost" size="block" className="mt-1.5">
          <Link href={`/events/${ev.id}/workspace`}>View details <ArrowUpRight size={15} /></Link>
        </Button>
      </CardContent>
    </Card>
  );
}

/** Right-rail list of the next upcoming events with a colored date chip. */
function UpcomingEvents({ events, loading }: { events: AdminEvent[]; loading: boolean }) {
  const upcoming = events
    .filter(isUpcoming)
    .sort((a, b) => new Date(a.startsAt!).getTime() - new Date(b.startsAt!).getTime())
    .slice(0, 5);
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex flex-col gap-0.5">
          <CardTitle>Upcoming Schedule</CardTitle>
          <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>Next events on the calendar</span>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-1 pt-4">
        {loading ? (
          [1, 2, 3].map((i) => <div key={i} className="h-14 rounded-[var(--radius-md)] animate-pulse" style={{ background: "var(--surface-2)" }} />)
        ) : upcoming.length === 0 ? (
          <div className="text-sm py-6 text-center" style={{ color: "var(--text-muted)" }}>No upcoming events scheduled.</div>
        ) : (
          upcoming.map((ev) => {
            const d = new Date(ev.startsAt!);
            return (
              <Link
                key={ev.id}
                href={`/events/${ev.id}/workspace`}
                className="flex items-center gap-3 p-2 rounded-[var(--radius-md)] hover:bg-[var(--surface-2)] transition-colors"
              >
                <div
                  className="flex flex-col items-center justify-center w-[46px] h-[46px] rounded-[12px] border flex-shrink-0"
                  style={{ borderColor: "var(--border-hex,#ecedf4)", background: "var(--surface-2)" }}
                >
                  <span className="text-[15px] font-extrabold leading-none" style={{ color: "var(--text-strong)" }}>{d.getDate()}</span>
                  <span className="text-[10px] font-bold uppercase mt-0.5" style={{ color: "var(--text-muted)" }}>{d.toLocaleDateString("en-US", { month: "short" })}</span>
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-sm font-bold truncate" style={{ color: "var(--text-strong)" }}>{ev.title}</span>
                  <span className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{ev.venue || "Venue TBD"} · {formatTime(ev.startsAt)}</span>
                </div>
              </Link>
            );
          })
        )}
      </CardContent>
    </Card>
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

  // Earliest upcoming PUBLIC event → featured card in the right rail.
  const nextPublicEvent = events
    .filter((e) => e.status === "PUBLIC" && e.startsAt && new Date(e.startsAt).getTime() > Date.now())
    .sort((a, b) => new Date(a.startsAt!).getTime() - new Date(b.startsAt!).getTime())[0];

  const totalEvents = events.length;

  // Donut: event-status split. Bars: top events by registrations. Leaderboard: capped events by fill %.
  const statusSegments = [
    { label: "Public",   value: activeEvents,   color: "var(--green-600)" },
    { label: "Draft",    value: draftEvents,    color: "var(--text-faint)" },
    { label: "Archived", value: archivedEvents, color: "var(--orange)" },
  ];

  const barData = [...events]
    .sort((a, b) => (b.registeredCount ?? 0) - (a.registeredCount ?? 0))
    .slice(0, 6)
    .map((e) => ({ label: e.title, value: e.registeredCount ?? 0 }));

  const fillLeaders = events
    .map((e) => ({ ev: e, pct: fillPctOf(e), reg: e.registeredCount ?? 0, cap: e.capacity ?? 0 }))
    .filter((x): x is { ev: AdminEvent; pct: number; reg: number; cap: number } => x.pct !== null)
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 5);

  // Event table: 6 most-recently updated.
  const tableEvents = [...events]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 6);

  return (
    <div className="flex flex-col gap-6 view-anim">
      {error && (
        <div className="rounded-[var(--radius-md)] px-4 py-3 text-sm font-semibold" style={{ background: "var(--danger-soft)", color: "var(--danger)" }}>{error}</div>
      )}

      <PageHeader title="Command Center" sub="Real-time overview of all events and operations">
        <Button asChild variant="ghost" size="sm"><Link href="/events">View all</Link></Button>
        <Button asChild size="sm"><Link href="/events/new"><Zap size={15} /> New event</Link></Button>
      </PageHeader>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_350px] gap-6 items-start">
        {/* ── Main column ── */}
        <div className="flex flex-col gap-6 min-w-0">
          {/* KPI row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <VentixeStat label="Registrations" value={totalRegistrations.toLocaleString()} icon={Users} variant="primary" loading={loading} />
            <VentixeStat label="Active Events" value={String(activeEvents)} icon={Calendar} variant="green" loading={loading} />
            <VentixeStat label="Upcoming" value={String(upcoming)} icon={Clock} variant="blue" loading={loading} />
            <VentixeStat label="Fill Rate" value={totalCapacity > 0 ? `${overallFill}%` : "—"} icon={TrendingUp} variant="orange" loading={loading} />
          </div>

          {/* Donut + bar chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-0.5">
                  <CardTitle>Event Status</CardTitle>
                  <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>Distribution across your portfolio</span>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-5 pt-5">
                <div className="relative flex items-center justify-center">
                  <DonutRing segments={statusSegments} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>Total</span>
                    <span className="text-[28px] font-extrabold tabular-nums leading-tight" style={{ color: "var(--text-strong)" }}>{loading ? "—" : totalEvents}</span>
                    <span className="text-[11px] font-semibold" style={{ color: "var(--text-muted)" }}>events</span>
                  </div>
                </div>
                <div className="w-full flex flex-col gap-2.5">
                  {statusSegments.map((s) => {
                    const pct = totalEvents > 0 ? Math.round((s.value / totalEvents) * 100) : 0;
                    return (
                      <div key={s.label} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                          <span className="text-[13px] font-semibold" style={{ color: "var(--text-muted)" }}>{s.label}</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <span className="text-[13px] font-bold tabular-nums" style={{ color: "var(--text-strong)" }}>{s.value}</span>
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full tabular-nums" style={{ background: "var(--surface-3)", color: "var(--text-muted)" }}>{pct}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex flex-col gap-0.5">
                  <CardTitle>Registrations by Event</CardTitle>
                  <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>Top events by sign-ups</span>
                </div>
              </CardHeader>
              <CardContent className="pt-3">
                {loading ? (
                  <div className="h-[240px] rounded-[var(--radius-md)] animate-pulse" style={{ background: "var(--surface-2)" }} />
                ) : barData.every((d) => d.value === 0) ? (
                  <div className="h-[240px] flex items-center justify-center text-sm" style={{ color: "var(--text-muted)" }}>No registrations yet.</div>
                ) : (
                  <BarsChart data={barData} />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Fill-rate leaderboard */}
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-0.5">
                <CardTitle>Top Events by Fill Rate</CardTitle>
                <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>How close capped events are to capacity</span>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 pt-5">
              {loading ? (
                [1, 2, 3].map((i) => <div key={i} className="h-12 rounded-[var(--radius-md)] animate-pulse" style={{ background: "var(--surface-2)" }} />)
              ) : fillLeaders.length === 0 ? (
                <div className="text-sm py-2" style={{ color: "var(--text-muted)" }}>No events with a set capacity yet.</div>
              ) : (
                fillLeaders.map(({ ev, pct, reg, cap }) => (
                  <div key={ev.id} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between gap-3">
                      <Link href={`/events/${ev.id}/workspace`} className="text-sm font-bold truncate hover:underline" style={{ color: "var(--text-strong)" }}>{ev.title}</Link>
                      <span className="text-xs font-bold tabular-nums flex-shrink-0" style={{ color: fillColor(pct) }}>{pct}%</span>
                    </div>
                    <Progress value={pct} indicatorColor={fillColor(pct)} />
                    <span className="text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>{reg.toLocaleString()} / {cap.toLocaleString()} registered</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Recent events table */}
          <Card className="overflow-hidden">
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

        {/* ── Right rail ── */}
        <div className="flex flex-col gap-6">
          <FeaturedEvent ev={nextPublicEvent} />
          <UpcomingEvents events={events} loading={loading} />
        </div>
      </div>
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
