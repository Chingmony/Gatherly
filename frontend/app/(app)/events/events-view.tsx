"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Plus,
  Eye,
  Trash2,
  Search,
  Calendar,
  MapPin,
  Users,
  Radio,
  PencilLine,
  CalendarX2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ApiError } from "@/lib/api/client";
import {
  listEvents,
  deleteEvent,
  publishEvent,
  archiveEvent,
  type AdminEvent,
  type EventStatus,
} from "@/lib/api/events";
import { getUser } from "@/lib/auth/session";

/* ─────────────────────────── cover gradients ─────────────────────────── */
const COVER_THEMES: Record<string, { from: string; to: string }> = {
  violet: { from: "#6366f1", to: "#8b5cf6" },
  blue: { from: "#3b82f6", to: "#6366f1" },
  teal: { from: "#14b8a6", to: "#06b6d4" },
  green: { from: "#22c55e", to: "#16a34a" },
  orange: { from: "#f59e0b", to: "#f97316" },
  amber: { from: "#f97316", to: "#ec4899" },
  pink: { from: "#f43f5e", to: "#f59e0b" },
};

// Deterministic fallback gradient per event id so cards without a coverColor still look distinct.
const FALLBACK_THEMES = Object.values(COVER_THEMES);

function coverGradientFor(ev: AdminEvent): string {
  if (ev.coverColor?.startsWith("#")) {
    return `linear-gradient(135deg, ${ev.coverColor}, ${ev.coverColor})`;
  }
  const theme =
    (ev.coverColor && COVER_THEMES[ev.coverColor]) ||
    FALLBACK_THEMES[hashId(ev.id) % FALLBACK_THEMES.length];
  return `linear-gradient(135deg, ${theme.from}, ${theme.to})`;
}

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

function fmtDate(iso: string | null) {
  if (!iso) return "Date TBA";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Date TBA";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/* ─────────────────────────── status meta ─────────────────────────── */
const STATUS_META: Record<EventStatus, { label: string; dot: string }> = {
  PUBLIC: { label: "Public", dot: "var(--green)" },
  DRAFT: { label: "Draft", dot: "#9aa3b5" },
  ARCHIVED: { label: "Archived", dot: "var(--orange)" },
};

type TabId = "all" | "PUBLIC" | "DRAFT" | "ARCHIVED";

export function EventsView() {
  const [tab, setTab] = useState<TabId>("all");
  const [query, setQuery] = useState("");

  const [events, setEvents] = useState<AdminEvent[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // sessionStorage is browser-only — read it after mount so SSR prerender doesn't crash.
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    setIsAdmin(getUser()?.globalRole === "ADMIN");
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setEvents(null);
    setLoadError(null);
    listEvents({ size: 100, signal: controller.signal })
      .then(setEvents)
      .catch((err) => {
        if (controller.signal.aborted) return;
        setLoadError(
          err instanceof ApiError ? err.message : "Couldn't load events. Please try again."
        );
        setEvents([]);
      });
    return () => controller.abort();
  }, []);

  const counts = useMemo(() => {
    const list = events ?? [];
    return {
      all: list.length,
      PUBLIC: list.filter((e) => e.status === "PUBLIC").length,
      DRAFT: list.filter((e) => e.status === "DRAFT").length,
      ARCHIVED: list.filter((e) => e.status === "ARCHIVED").length,
    };
  }, [events]);

  const filtered = useMemo(() => {
    const list = events ?? [];
    const q = query.trim().toLowerCase();
    return list.filter((e) => {
      const matchesTab = tab === "all" || e.status === tab;
      const matchesQuery =
        !q ||
        e.title.toLowerCase().includes(q) ||
        (e.venue ?? "").toLowerCase().includes(q) ||
        (e.category ?? "").toLowerCase().includes(q);
      return matchesTab && matchesQuery;
    });
  }, [events, tab, query]);

  const TABS: { id: TabId; label: string; count: number }[] = [
    { id: "all", label: "All", count: counts.all },
    { id: "PUBLIC", label: "Public", count: counts.PUBLIC },
    { id: "DRAFT", label: "Draft", count: counts.DRAFT },
    { id: "ARCHIVED", label: "Archived", count: counts.ARCHIVED },
  ];

  async function handleDelete(ev: AdminEvent) {
    if (!window.confirm(`Delete “${ev.title}”? This permanently removes it and all its data.`)) {
      return;
    }
    setActionError(null);
    setBusyId(ev.id);
    try {
      await deleteEvent(ev.id);
      setEvents((prev) => (prev ?? []).filter((e) => e.id !== ev.id));
    } catch (err) {
      setActionError(
        err instanceof ApiError ? err.message : "Couldn't delete this event. Please try again."
      );
    } finally {
      setBusyId(null);
    }
  }

  async function handleTransition(ev: AdminEvent, to: "publish" | "archive") {
    setActionError(null);
    setBusyId(ev.id);
    try {
      const updated = to === "publish" ? await publishEvent(ev.id) : await archiveEvent(ev.id);
      setEvents((prev) => (prev ?? []).map((e) => (e.id === ev.id ? updated : e)));
    } catch (err) {
      setActionError(
        err instanceof ApiError ? err.message : `Couldn't ${to} this event. Please try again.`
      );
    } finally {
      setBusyId(null);
    }
  }

  const loading = events === null;

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

          {isAdmin && (
            <Button asChild>
              <Link href="/events/new"><Plus size={16} /> Create Event</Link>
            </Button>
          )}
        </div>
      </div>

      {/* ── Action error banner ── */}
      {actionError && (
        <div
          className="flex items-center gap-2 rounded-[var(--radius-md)] border px-3.5 py-3 text-sm font-bold"
          style={{ background: "var(--danger-soft)", borderColor: "var(--danger)", color: "var(--danger)" }}
          role="alert"
        >
          <AlertCircle size={15} /> {actionError}
        </div>
      )}

      {/* ── Body ── */}
      {loading ? (
        <Card className="flex flex-col items-center justify-center gap-3 py-20 text-center" style={{ color: "var(--text-muted)" }}>
          <Loader2 size={26} className="animate-spin" />
          <p className="text-sm font-semibold m-0">Loading events…</p>
        </Card>
      ) : loadError ? (
        <Card className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <AlertCircle size={30} style={{ color: "var(--danger)" }} />
          <div className="flex flex-col gap-1">
            <p className="text-sm font-bold m-0" style={{ color: "var(--text)" }}>Couldn&apos;t load events</p>
            <p className="text-xs m-0" style={{ color: "var(--text-muted)" }}>{loadError}</p>
          </div>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <CalendarX2 size={30} style={{ color: "var(--text-faint)" }} />
          <div className="flex flex-col gap-1">
            <p className="text-sm font-bold m-0" style={{ color: "var(--text)" }}>
              {counts.all === 0 ? "No events yet" : "No events match your filters"}
            </p>
            <p className="text-xs m-0" style={{ color: "var(--text-muted)" }}>
              {counts.all === 0
                ? isAdmin
                  ? "Create your first event to get started."
                  : "You haven't been assigned to any events yet."
                : "Try a different search or tab."}
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
          {filtered.map((ev) => (
            <EventCard
              key={ev.id}
              ev={ev}
              isAdmin={isAdmin}
              busy={busyId === ev.id}
              onDelete={() => handleDelete(ev)}
              onPublish={() => handleTransition(ev, "publish")}
              onArchive={() => handleTransition(ev, "archive")}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function EventCard({
  ev,
  isAdmin,
  busy,
  onDelete,
  onPublish,
  onArchive,
}: {
  ev: AdminEvent;
  isAdmin: boolean;
  busy: boolean;
  onDelete: () => void;
  onPublish: () => void;
  onArchive: () => void;
}) {
  const capacity = ev.capacity ?? 0;
  const fillPct = capacity > 0 ? Math.min(100, Math.round((ev.registeredCount / capacity) * 100)) : 0;
  const st = STATUS_META[ev.status];

  return (
    <Card className="overflow-hidden flex flex-col">
      {/* Cover */}
      <div className="relative h-44 p-4" style={{ background: coverGradientFor(ev) }}>
        <div className="flex items-start justify-between">
          <span
            className="text-xs font-bold px-2.5 py-1 rounded-full backdrop-blur-sm"
            style={{ background: "rgba(17,20,42,0.25)", color: "#fff" }}
          >
            {ev.category || "Event"}
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
          {ev.title}
        </h3>

        <div className="flex items-center gap-2 text-[13px]" style={{ color: "var(--text-muted)" }}>
          <span className="inline-flex items-center gap-1.5">
            <Calendar size={13} /> {fmtDate(ev.startsAt)}
          </span>
          <span style={{ color: "var(--text-faint)" }}>·</span>
          <span className="inline-flex items-center gap-1.5 min-w-0">
            <MapPin size={13} className="flex-shrink-0" />
            <span className="truncate">{ev.venue || "Venue TBD"}</span>
          </span>
        </div>

        {/* Registration */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold" style={{ color: "var(--text-muted)" }}>Registration</span>
            <span className="text-[13px] font-extrabold" style={{ color: "var(--text-strong)" }}>
              {ev.registeredCount.toLocaleString()} / {ev.capacity != null ? ev.capacity.toLocaleString() : "∞"}
            </span>
          </div>
          <Progress value={fillPct} />
        </div>

        {/* Meta */}
        <div className="flex items-center gap-4 text-[13px] font-semibold" style={{ color: "var(--text-muted)" }}>
          <span className="inline-flex items-center gap-1.5">
            <Users size={14} /> {ev.registeredCount.toLocaleString()} registered
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
          {isAdmin && ev.status === "DRAFT" && (
            <Button variant="ghost" size="icon" title="Publish event" onClick={onPublish} disabled={busy}>
              {busy ? <Loader2 size={15} className="animate-spin" /> : <Radio size={16} />}
            </Button>
          )}
          {isAdmin && ev.status === "PUBLIC" && (
            <Button variant="ghost" size="icon" title="Archive event" onClick={onArchive} disabled={busy}>
              {busy ? <Loader2 size={15} className="animate-spin" /> : <CalendarX2 size={16} />}
            </Button>
          )}
          {isAdmin && (
            <Button variant="danger" size="icon" title="Delete event" onClick={onDelete} disabled={busy}>
              {busy ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={16} />}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
