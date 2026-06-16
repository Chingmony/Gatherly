"use client";

import { useEffect, useState } from "react";
import { ChevronRight, Calendar, ListChecks, Zap, Eye, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { listEvents, type AdminEvent } from "@/lib/api/events";
import { apiFetch } from "@/lib/api/client";
import { coverGradient } from "@/lib/events/cover";
import type { MaterialResponse, UserResponse } from "@/lib/types";

function formatDate(iso: string | null) {
  if (!iso) return "Date TBA";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Date TBA";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/**
 * Derive "check-in is open right now" purely from the timestamps the API gives us — there is
 * no `isCheckinOpen` boolean. Conservative: only true when `checkinOpensAt` is set and now is
 * within `checkinOpensAt … endsAt` (a null `endsAt` is treated as still open). Returns false on
 * any missing/ambiguous data so we never show a misleading badge.
 */
function isCheckinOpen(e: AdminEvent, now: number): boolean {
  if (e.status === "ARCHIVED" || !e.checkinOpensAt) return false;
  const opens = new Date(e.checkinOpensAt).getTime();
  if (Number.isNaN(opens) || now < opens) return false;
  if (!e.endsAt) return true;
  const ends = new Date(e.endsAt).getTime();
  return Number.isNaN(ends) || now <= ends;
}

interface DashboardState {
  me: UserResponse | null;
  events: AdminEvent[];
  materials: MaterialResponse[];
  loading: boolean;
  error: string | null;
}

export function HandlerDashboard() {
  const [state, setState] = useState<DashboardState>({
    me: null,
    events: [],
    materials: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    async function load() {
      try {
        const [meRes, eventsRes] = await Promise.all([
          apiFetch<UserResponse>("/me"),
          listEvents({ size: 100 }),
        ]);

        const evs = eventsRes ?? [];

        const materialResults = await Promise.all(
          evs.map((e) =>
            apiFetch<MaterialResponse[]>(`/events/${e.id}/materials?size=100`)
          )
        );

        setState({
          me: meRes,
          events: evs,
          materials: materialResults.flatMap((r) => r ?? []),
          loading: false,
          error: null,
        });
      } catch (err) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err.message : "Failed to load dashboard",
        }));
      }
    }

    load();
  }, []);

  const { me, events, materials, loading, error } = state;

  const myMaterials = materials.filter((m) => m.assignedTo === me?.id);
  const isOpen = (m: MaterialResponse) => m.status !== "DONE" && m.status !== "ISSUE";
  const openTasks = myMaterials.filter(isOpen).length;

  // KPI tiles — 2×2 on mobile, a single row on desktop.
  const KPIS = [
    { label: "Assigned",     value: loading ? "—" : String(myMaterials.length),                                            icon: ListChecks,   iconBg: "var(--blue-soft)",    iconColor: "var(--blue)" },
    { label: "In Progress",  value: loading ? "—" : String(myMaterials.filter((m) => m.status === "IN_PROGRESS").length),  icon: Zap,          iconBg: "var(--primary-soft)", iconColor: "var(--primary-hex,#6366f1)" },
    { label: "Needs Review", value: loading ? "—" : String(myMaterials.filter((m) => m.status === "NEEDS_REVIEW").length), icon: Eye,          iconBg: "var(--orange-soft)",  iconColor: "var(--orange)" },
    { label: "Done",         value: loading ? "—" : String(myMaterials.filter((m) => m.status === "DONE").length),         icon: CheckCircle2, iconBg: "var(--green-soft)",   iconColor: "var(--green-600)" },
  ];

  const now = Date.now();
  const visibleEvents = events
    .filter((e) => e.status !== "ARCHIVED")
    .map((e) => ({
      event: e,
      openTasks: myMaterials.filter((m) => m.eventId === e.id && isOpen(m)).length,
      checkinOpen: isCheckinOpen(e, now),
    }))
    .sort((a, b) => {
      // Check-in-open events first, then soonest start (nulls last).
      if (a.checkinOpen !== b.checkinOpen) return a.checkinOpen ? -1 : 1;
      const at = a.event.startsAt ? new Date(a.event.startsAt).getTime() : Infinity;
      const bt = b.event.startsAt ? new Date(b.event.startsAt).getTime() : Infinity;
      return at - bt;
    });

  return (
    <div className="flex flex-col gap-5 view-anim">

      {/* Error banner */}
      {error && (
        <div className="rounded-xl px-4 py-3 text-sm" style={{ background: "var(--danger-soft)", color: "var(--danger)" }}>
          {error}
        </div>
      )}

      {/* Greeting + open-task summary */}
      <PageHeader
        title="Welcome back"
        sub={
          loading
            ? "Loading your assigned work…"
            : `You're a handler on ${events.length} event${events.length !== 1 ? "s" : ""} — only materials assigned to you are shown.`
        }
      >
        <StatusBadge dot variant={openTasks ? "orange" : "green"}>
          {loading ? "…" : `${openTasks} open task${openTasks !== 1 ? "s" : ""}`}
        </StatusBadge>
      </PageHeader>

      {/* KPI tiles — 2×2 on mobile, one row on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-5">
        {KPIS.map(({ label, value, icon: Icon, iconBg, iconColor }) => (
          <div
            key={label}
            className="rounded-[var(--radius-xl)] border border-[var(--border-hex,#ecedf4)] bg-[var(--surface)] p-4 flex items-center gap-3 shadow-[var(--shadow-card)]"
          >
            <div
              className="flex items-center justify-center flex-shrink-0 rounded-[12px] w-10 h-10"
              style={{ background: iconBg, color: iconColor }}
            >
              <Icon size={18} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[22px] font-extrabold leading-none tabular-nums" style={{ color: "var(--text-strong)" }}>
                {value}
              </span>
              <span className="text-[11px] font-semibold leading-tight" style={{ color: "var(--text-muted)" }}>
                {label}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Your events — primary tap-through */}
      <Card>
        <CardHeader className="px-5 pt-5 pb-3 flex-row items-center">
          <CardTitle className="text-base font-bold">Your events</CardTitle>
          <span className="ml-auto text-xs" style={{ color: "var(--text-faint)" }}>
            {loading ? "…" : `${visibleEvents.length} active`}
          </span>
        </CardHeader>
        <CardContent className="px-4 pb-4 flex flex-col gap-3">
          {loading ? (
            <div className="h-16 rounded-xl animate-pulse" style={{ background: "var(--surface-2)" }} />
          ) : visibleEvents.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--text-faint)" }}>No active events assigned.</p>
          ) : (
            visibleEvents.map(({ event: e, openTasks: open, checkinOpen }) => (
              <Link
                key={e.id}
                href={`/tasks?event=${e.id}`}
                className="flex items-center gap-3 p-3 rounded-xl border transition-colors cursor-pointer hover:bg-[var(--surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-hex,#6366f1)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]"
                style={{ borderColor: "var(--border-hex,#ecedf4)" }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white"
                  style={e.coverImageUrl
                    ? { backgroundImage: `url(${e.coverImageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
                    : { background: coverGradient(e.coverColor) }}
                >
                  {!e.coverImageUrl && <Calendar size={18} />}
                </div>
                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                  <span className="text-sm font-bold truncate" style={{ color: "var(--text-strong)" }}>{e.title}</span>
                  <span className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-faint)" }}>
                    {checkinOpen ? (
                      <span className="inline-flex items-center gap-1 font-bold" style={{ color: "var(--green-600)" }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" aria-hidden="true" />
                        Check-in open
                      </span>
                    ) : (
                      formatDate(e.startsAt)
                    )}
                  </span>
                </div>
                {open > 0 && (
                  <StatusBadge variant="orange">{open} open</StatusBadge>
                )}
                <ChevronRight size={16} className="flex-shrink-0" style={{ color: "var(--text-faint)" }} />
              </Link>
            ))
          )}
        </CardContent>
      </Card>

    </div>
  );
}
