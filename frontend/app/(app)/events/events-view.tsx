"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Plus,
  Eye,
  Trash2,
  Search,
  Calendar,
  MapPin,
  Users,
  ListChecks,
  PencilLine,
  CalendarX2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

type EventStatus = "public" | "draft";

interface EventItem {
  id: string;
  name: string;
  category: string;
  status: EventStatus;
  date: string;
  location: string;
  registered: number;
  capacity: number;
  crew: number;
  tasksDone: number;
  tasksTotal: number;
  from: string;
  to: string;
}

const EVENTS: EventItem[] = [
  { id: "ev1", name: "NorthStar Tech Summit", category: "Conference", status: "public", date: "Jun 24, 2026", location: "Pier 48",          registered: 1842, capacity: 2000, crew: 6,  tasksDone: 18, tasksTotal: 26, from: "#6366f1", to: "#8b5cf6" },
  { id: "ev2", name: "Lumen Music Festival",  category: "Festival",   status: "public", date: "Jul 12, 2026", location: "Golden Gate Park",  registered: 6320, capacity: 8000, crew: 11, tasksDone: 9,  tasksTotal: 31, from: "#f43f5e", to: "#f59e0b" },
  { id: "ev3", name: "Founders Brunch Q3",    category: "Networking", status: "draft",  date: "Aug 03, 2026", location: "The Battery",       registered: 0,    capacity: 120,  crew: 3,  tasksDone: 2,  tasksTotal: 14, from: "#14b8a6", to: "#3b82f6" },
  { id: "ev4", name: "DesignOps Workshop",    category: "Workshop",   status: "public", date: "Jun 30, 2026", location: "Online + Studio C", registered: 318,  capacity: 400,  crew: 4,  tasksDone: 11, tasksTotal: 15, from: "#22c55e", to: "#16a34a" },
  { id: "ev5", name: "Harvest Charity Gala",  category: "Gala",       status: "draft",  date: "Sep 20, 2026", location: "Fairmont Ballroom", registered: 0,    capacity: 500,  crew: 5,  tasksDone: 0,  tasksTotal: 19, from: "#f59e0b", to: "#ec4899" },
  { id: "ev6", name: "Frostbyte Hackathon",   category: "Hackathon",  status: "public", date: "Jul 28, 2026", location: "Innovation Hub",    registered: 540,  capacity: 600,  crew: 8,  tasksDone: 7,  tasksTotal: 22, from: "#3b82f6", to: "#6366f1" },
];

const STATUS_META: Record<EventStatus, { label: string; dot: string }> = {
  public: { label: "Public", dot: "var(--green)" },
  draft:  { label: "Draft",  dot: "#9aa3b5" },
};

type TabId = "all" | "public" | "draft";

export function EventsView() {
  const [tab, setTab] = useState<TabId>("all");
  const [query, setQuery] = useState("");

  const counts = useMemo(
    () => ({
      all: EVENTS.length,
      public: EVENTS.filter((e) => e.status === "public").length,
      draft: EVENTS.filter((e) => e.status === "draft").length,
    }),
    []
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return EVENTS.filter((e) => {
      const matchesTab = tab === "all" || e.status === tab;
      const matchesQuery =
        !q || e.name.toLowerCase().includes(q) || e.location.toLowerCase().includes(q) || e.category.toLowerCase().includes(q);
      return matchesTab && matchesQuery;
    });
  }, [tab, query]);

  const TABS: { id: TabId; label: string; count: number }[] = [
    { id: "all", label: "All", count: counts.all },
    { id: "public", label: "Public", count: counts.public },
    { id: "draft", label: "Draft", count: counts.draft },
  ];

  return (
    <div className="flex flex-col gap-6 view-anim">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-[25px] font-extrabold tracking-tight leading-tight m-0" style={{ color: "var(--text-strong)" }}>
            All Events
          </h1>
          <span className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>
            Manage every event across your organization
          </span>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px] sm:flex-none sm:w-64">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-faint)" }} />
            <input
              type="search"
              placeholder="Search events…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full h-[42px] pl-9 pr-3.5 rounded-[var(--radius-md)] border text-sm font-semibold transition-all focus:outline-none focus:border-[var(--primary-hex,#6366f1)] focus:shadow-[0_0_0_4px_var(--primary-ring)]"
              style={{ background: "var(--surface)", borderColor: "var(--border-hex,#ecedf4)", color: "var(--text)" }}
            />
          </div>

          {/* Tabs */}
          <div
            className="flex items-center gap-1 p-1 rounded-[var(--radius-md)] border"
            style={{ background: "var(--surface)", borderColor: "var(--border-hex,#ecedf4)" }}
          >
            {TABS.map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className="flex items-center gap-1.5 px-3 h-[32px] rounded-[var(--radius-sm)] text-sm font-bold transition-all cursor-pointer"
                  style={{
                    background: active ? "var(--primary-soft)" : "transparent",
                    color: active ? "var(--primary-hex,#6366f1)" : "var(--text-muted)",
                  }}
                >
                  {t.label}
                  <span
                    className="text-xs font-extrabold"
                    style={{ color: active ? "var(--primary-hex,#6366f1)" : "var(--text-faint)" }}
                  >
                    {t.count}
                  </span>
                </button>
              );
            })}
          </div>

          <Button asChild>
            <Link href="/events/new"><Plus size={16} /> Create Event</Link>
          </Button>
        </div>
      </div>

      {/* ── Grid ── */}
      {filtered.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <CalendarX2 size={30} style={{ color: "var(--text-faint)" }} />
          <div className="flex flex-col gap-1">
            <p className="text-sm font-bold m-0" style={{ color: "var(--text)" }}>No events match your filters</p>
            <p className="text-xs m-0" style={{ color: "var(--text-muted)" }}>Try a different search or tab.</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
          {filtered.map((ev) => (
            <EventCard key={ev.id} ev={ev} />
          ))}
        </div>
      )}
    </div>
  );
}

function EventCard({ ev }: { ev: EventItem }) {
  const fillPct = ev.capacity > 0 ? Math.round((ev.registered / ev.capacity) * 100) : 0;
  const st = STATUS_META[ev.status];

  return (
    <Card className="overflow-hidden flex flex-col">
      {/* Cover */}
      <div
        className="relative h-44 p-4"
        style={{ background: `linear-gradient(135deg, ${ev.from}, ${ev.to})` }}
      >
        <div className="flex items-start justify-between">
          <span
            className="text-xs font-bold px-2.5 py-1 rounded-full backdrop-blur-sm"
            style={{ background: "rgba(17,20,42,0.25)", color: "#fff" }}
          >
            {ev.category}
          </span>
          <span
            className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full backdrop-blur-sm"
            style={{ background: "rgba(255,255,255,0.92)", color: "var(--text-strong)" }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: st.dot }} />
            {st.label}
          </span>
        </div>
        <div
          className="absolute right-5 top-1/2 -translate-y-1/2 w-14 h-14 rounded-[var(--radius-md)] border-2"
          style={{ borderColor: "rgba(255,255,255,0.35)" }}
          aria-hidden="true"
        />
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col gap-3 flex-1">
        <h3 className="text-[17px] font-extrabold leading-tight m-0" style={{ color: "var(--text-strong)" }}>
          {ev.name}
        </h3>

        <div className="flex items-center gap-2 text-[13px]" style={{ color: "var(--text-muted)" }}>
          <span className="inline-flex items-center gap-1.5">
            <Calendar size={13} /> {ev.date}
          </span>
          <span style={{ color: "var(--text-faint)" }}>·</span>
          <span className="inline-flex items-center gap-1.5 min-w-0">
            <MapPin size={13} className="flex-shrink-0" />
            <span className="truncate">{ev.location}</span>
          </span>
        </div>

        {/* Registration */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold" style={{ color: "var(--text-muted)" }}>Registration</span>
            <span className="text-[13px] font-extrabold" style={{ color: "var(--text-strong)" }}>
              {ev.registered.toLocaleString()} / {ev.capacity.toLocaleString()}
            </span>
          </div>
          <Progress value={fillPct} />
        </div>

        {/* Meta */}
        <div className="flex items-center gap-4 text-[13px] font-semibold" style={{ color: "var(--text-muted)" }}>
          <span className="inline-flex items-center gap-1.5">
            <Users size={14} /> {ev.crew} crew
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ListChecks size={14} /> {ev.tasksDone}/{ev.tasksTotal} tasks
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1 mt-auto">
          <Button asChild variant="ghost" className="flex-1">
            <Link href={`/events/${ev.id}/workspace`}><PencilLine size={15} /> Manage</Link>
          </Button>
          <Button asChild variant="ghost" size="icon" title="Open workspace">
            <Link href={`/events/${ev.id}/workspace`}><Eye size={16} /></Link>
          </Button>
          <Button variant="danger" size="icon" title="Delete event">
            <Trash2 size={16} />
          </Button>
        </div>
      </div>
    </Card>
  );
}
