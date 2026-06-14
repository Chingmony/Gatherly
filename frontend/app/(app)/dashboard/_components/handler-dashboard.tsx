"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, Zap, Eye, ListChecks, CheckCircle2, QrCode, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import type { ApiResponse, EventResponse, MaterialResponse, UserResponse } from "@/lib/types";

const EVENT_COLORS = [
  "#7c3aed",
  "linear-gradient(135deg, #f97316 0%, #ef4444 100%)",
  "#2563eb",
  "linear-gradient(135deg, #06b6d4 0%, #6366f1 100%)",
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

interface DashboardState {
  me: UserResponse | null;
  events: EventResponse[];
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
          apiFetch<ApiResponse<UserResponse>>("/me"),
          apiFetch<ApiResponse<EventResponse[]>>("/events?size=100"),
        ]);

        const evs = eventsRes.data ?? [];

        const materialResults = await Promise.all(
          evs.map((e) =>
            apiFetch<ApiResponse<MaterialResponse[]>>(`/events/${e.id}/materials?size=100`)
          )
        );

        setState({
          me: meRes.data,
          events: evs,
          materials: materialResults.flatMap((r) => r.data ?? []),
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

  const firstName = me?.fullName?.split(" ")[0] ?? "there";
  const myMaterials = materials.filter((m) => m.assignedTo === me?.id);
  const openTasks = myMaterials.filter((m) => m.status !== "DONE" && m.status !== "ISSUE").length;

  const TASK_STATS = [
    { label: "Assigned",     value: loading ? "—" : String(myMaterials.length),                                                        Icon: ListChecks,   iconBg: "var(--blue-soft)",    iconColor: "var(--blue)" },
    { label: "In Progress",  value: loading ? "—" : String(myMaterials.filter((m) => m.status === "IN_PROGRESS").length),              Icon: Zap,          iconBg: "var(--primary-soft)", iconColor: "var(--primary-hex,#6366f1)" },
    { label: "Needs Review", value: loading ? "—" : String(myMaterials.filter((m) => m.status === "NEEDS_REVIEW").length),             Icon: Eye,          iconBg: "var(--orange-soft)",  iconColor: "var(--orange)" },
    { label: "Done",         value: loading ? "—" : String(myMaterials.filter((m) => m.status === "DONE").length),                     Icon: CheckCircle2, iconBg: "var(--green-soft)",   iconColor: "var(--green-600)" },
  ];

  const eventsWithTasks = events.map((e, i) => ({
    ...e,
    openTasks: myMaterials.filter((m) => m.eventId === e.id && m.status !== "DONE" && m.status !== "ISSUE").length,
    iconBg: EVENT_COLORS[i % EVENT_COLORS.length],
  }));

  return (
    <div className="flex flex-col gap-4 view-anim">

      {/* Error banner */}
      {error && (
        <div className="rounded-xl px-4 py-3 text-sm" style={{ background: "var(--danger-soft)", color: "var(--danger)" }}>
          {error}
        </div>
      )}

      {/* Focused task info bar */}
      <div className="rounded-xl px-4 py-3 flex items-start gap-2.5 text-sm leading-relaxed" style={{ background: "#e8faf2", color: "#15803d" }}>
        <ShieldCheck size={16} className="mt-0.5 flex-shrink-0" />
        <span>
          <strong>Focused task view.</strong> You&apos;re a Handler on{" "}
          <strong>{loading ? "…" : events.length} events</strong> — only materials assigned to you are shown.
        </span>
      </div>

      {/* Hero + KPI — 5-col desktop / 2-col mobile via .kpi-grid */}
      <div className="kpi-grid">
        {/* Hero gradient card — full width on mobile (col-span-2), 2fr on desktop */}
        <div
          className="col-span-2 md:col-span-1 rounded-2xl px-5 py-5 md:px-7 md:py-5 flex flex-col justify-center"
          style={{ background: "linear-gradient(135deg, #0d9488 0%, #2563eb 100%)", color: "#fff" }}
        >
          <p className="text-sm font-medium" style={{ opacity: 0.85 }}>
            Hi {firstName}, you have
          </p>
          <p className="text-2xl md:text-3xl font-black mt-1 leading-tight tracking-tight">
            {loading ? "…" : `${openTasks} open task${openTasks !== 1 ? "s" : ""}`}
          </p>
          <p className="text-sm mt-1" style={{ opacity: 0.75 }}>
            across {loading ? "…" : events.length} event{events.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* KPI stat tiles — 2 per row on mobile, 1 per column on desktop */}
        {TASK_STATS.map(({ label, value, Icon, iconBg, iconColor }) => (
          <div
            key={label}
            className="rounded-2xl px-4 py-3 flex items-center gap-3"
            style={{ background: "#fff", boxShadow: "var(--shadow-sm,0 1px 4px rgba(0,0,0,.06))" }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: iconBg }}
            >
              <Icon size={16} style={{ color: iconColor }} />
            </div>
            <div>
              <p className="text-xl md:text-2xl font-black leading-none" style={{ color: "var(--text-strong)" }}>{value}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-faint)" }}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Your events */}
      <Card>
        <CardHeader className="px-5 pt-5 pb-3 flex-row items-center">
          <CardTitle className="text-base font-bold">Your events</CardTitle>
          <span className="ml-auto text-xs" style={{ color: "var(--text-faint)" }}>
            {loading ? "…" : events.length} assigned
          </span>
        </CardHeader>
        <CardContent className="px-4 pb-4 flex flex-col gap-3">
          {loading ? (
            <div className="h-14 rounded-xl animate-pulse" style={{ background: "var(--surface-2)" }} />
          ) : eventsWithTasks.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--text-faint)" }}>No events assigned.</p>
          ) : (
            eventsWithTasks.map((e) => (
              <div
                key={e.id}
                className="flex items-center gap-3 p-3 rounded-xl border"
                style={{ borderColor: "var(--border-hex,#ecedf4)" }}
              >
                <div className="w-10 h-10 rounded-xl flex-shrink-0" style={{ background: e.iconBg }} />
                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                  <span className="text-sm font-bold truncate" style={{ color: "var(--text-strong)" }}>{e.title}</span>
                  <span className="text-xs" style={{ color: "var(--text-faint)" }}>{formatDate(e.startsAt)}</span>
                </div>
                <span
                  className="text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0"
                  style={{ background: "#fff7ed", color: "#ea580c" }}
                >
                  {e.openTasks} open
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Quick action cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link
          href={events[0] ? `/events/${events[0].id}/scanner` : "/events"}
          className="rounded-2xl p-4 flex items-center gap-4 min-h-[56px] transition-shadow hover:shadow-md active:opacity-80"
          style={{ background: "#fff", boxShadow: "var(--shadow-sm,0 1px 4px rgba(0,0,0,.06))" }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--blue-soft)" }}
          >
            <QrCode size={18} style={{ color: "var(--blue)" }} />
          </div>
          <div className="flex flex-col gap-0.5 flex-1 min-w-0">
            <span className="text-sm font-bold" style={{ color: "var(--text-strong)" }}>Check-in Scanner</span>
            <span className="text-xs" style={{ color: "var(--text-faint)" }}>Scan guest tickets at the door</span>
          </div>
          <ChevronRight size={16} style={{ color: "var(--text-faint)" }} />
        </Link>

        <Link
          href="/tasks"
          className="rounded-2xl p-4 flex items-center gap-4 min-h-[56px] transition-shadow hover:shadow-md active:opacity-80"
          style={{ background: "#fff", boxShadow: "var(--shadow-sm,0 1px 4px rgba(0,0,0,.06))" }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--green-soft)" }}
          >
            <ListChecks size={18} style={{ color: "var(--green-600)" }} />
          </div>
          <div className="flex flex-col gap-0.5 flex-1 min-w-0">
            <span className="text-sm font-bold" style={{ color: "var(--text-strong)" }}>My Task List</span>
            <span className="text-xs" style={{ color: "var(--text-faint)" }}>Update status &amp; flag issues</span>
          </div>
          <ChevronRight size={16} style={{ color: "var(--text-faint)" }} />
        </Link>
      </div>

    </div>
  );
}
