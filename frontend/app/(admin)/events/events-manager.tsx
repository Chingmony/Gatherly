"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { publishEvent, archiveEvent, deleteEvent } from "@/lib/api/events";
import type { EventResponse, EventStatus } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { SearchInput } from "@/components/ui/search-input";
import { coverGradient } from "@/lib/covers";

type EventSort = "soonest" | "latest" | "title" | "created";
const EVENT_SORTS: { value: EventSort; label: string }[] = [
  { value: "soonest", label: "Date: soonest" },
  { value: "latest", label: "Date: latest" },
  { value: "title", label: "Title: A–Z" },
  { value: "created", label: "Recently created" },
];

const STATUS_LABEL: Record<EventStatus, string> = {
  DRAFT: "Draft",
  PUBLIC: "Public",
  ARCHIVED: "Archived",
};

const STATUS_VARIANT: Record<EventStatus, "green" | "neutral" | "gray"> = {
  PUBLIC: "green",
  DRAFT: "neutral",
  ARCHIVED: "gray",
};

type ViewMode = "grid" | "list";
const VIEW_KEY = "gatherly:events-view";

function formatDate(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function EventsManager({ initialEvents, isAdmin }: { initialEvents: EventResponse[]; isAdmin: boolean }) {
  const router = useRouter();
  const [view, setView] = useState<ViewMode>("grid");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<EventStatus | "ALL">("ALL");
  const [sort, setSort] = useState<EventSort>("soonest");

  const events = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = initialEvents.filter((e) => {
      if (statusFilter !== "ALL" && e.status !== statusFilter) return false;
      if (!q) return true;
      return `${e.title} ${e.venue ?? ""} ${e.category ?? ""}`.toLowerCase().includes(q);
    });
    const ts = (s?: string) => (s ? new Date(s).getTime() : null);
    return [...filtered].sort((a, b) => {
      switch (sort) {
        case "title": return a.title.localeCompare(b.title);
        case "created": return (ts(b.createdAt) ?? 0) - (ts(a.createdAt) ?? 0);
        case "latest": return (ts(b.startsAt) ?? -Infinity) - (ts(a.startsAt) ?? -Infinity);
        case "soonest":
        default: return (ts(a.startsAt) ?? Infinity) - (ts(b.startsAt) ?? Infinity);
      }
    });
  }, [initialEvents, query, statusFilter, sort]);

  // Restore the last-used view after mount (avoids SSR/client hydration mismatch).
  useEffect(() => {
    const saved = window.localStorage.getItem(VIEW_KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- restoring the persisted view on mount
    if (saved === "grid" || saved === "list") setView(saved);
  }, []);

  function pickView(mode: ViewMode) {
    setView(mode);
    window.localStorage.setItem(VIEW_KEY, mode);
  }

  async function run(id: string, action: () => Promise<unknown>) {
    setBusyId(id);
    try {
      await action();
      router.refresh();
    } catch {
      // list reflects actual state on refresh
    } finally {
      setBusyId(null);
    }
  }

  function actions(ev: EventResponse) {
    // Publish / Archive / Delete are Admin-only (docs/00 §5, docs/03 §4.4).
    // Sub-admins and Handlers navigate into the event workspace via the card link — no lifecycle buttons.
    if (!isAdmin) return null;
    return (
      <>
        {ev.status === "DRAFT" && (
          <Button variant="ghost" disabled={busyId === ev.id}
                  onClick={() => run(ev.id, () => publishEvent(ev.id))}>
            Publish
          </Button>
        )}
        {ev.status !== "ARCHIVED" && (
          <Button variant="ghost" disabled={busyId === ev.id}
                  onClick={() => run(ev.id, () => archiveEvent(ev.id))}>
            Archive
          </Button>
        )}
        <Button variant="ghost" disabled={busyId === ev.id}
                onClick={() => run(ev.id, () => deleteEvent(ev.id))}>
          Delete
        </Button>
      </>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput value={query} onChange={setQuery} placeholder="Search events…" className="min-w-[200px] flex-1" />
        <Select
          value={statusFilter}
          onChange={(v) => setStatusFilter(v as EventStatus | "ALL")}
          aria-label="Filter by status"
          className="w-auto min-w-[8.5rem]"
          options={[
            { value: "ALL", label: "All statuses" },
            { value: "DRAFT", label: "Draft" },
            { value: "PUBLIC", label: "Public" },
            { value: "ARCHIVED", label: "Archived" },
          ]}
        />
        <Select
          value={sort}
          onChange={(v) => setSort(v as EventSort)}
          aria-label="Sort events"
          className="w-auto min-w-[10rem]"
          options={EVENT_SORTS}
        />
        <ViewToggle view={view} onChange={pickView} />
        {isAdmin && <Button onClick={() => router.push("/events/new")}>Create Event</Button>}
      </div>

      {initialEvents.length === 0 ? (
        <div className="rounded-[var(--r)] border border-[var(--bo)] bg-[var(--ca)] px-4 py-12 text-center shadow-[var(--sh)]">
          <p className="text-[13px] font-semibold text-[var(--t2)]">
            {isAdmin ? "No events yet." : "No events assigned to you yet."}
          </p>
          {!isAdmin && (
            <p className="mt-1 text-[12px] text-[var(--t3)]">
              Ask an admin to assign you to an event.
            </p>
          )}
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-[var(--r)] border border-[var(--bo)] bg-[var(--ca)] px-4 py-12 text-center text-[13px] text-[var(--t3)] shadow-[var(--sh)]">
          No events match your search.
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((ev) => (
            <EventCard key={ev.id} ev={ev} actions={actions(ev)} />
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-[var(--r)] border border-[var(--bo)] bg-[var(--ca)] shadow-[var(--sh)]">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[var(--bo)] text-[10.5px] font-semibold uppercase tracking-[0.06em] text-[var(--t3)]">
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Venue</th>
                <th className="px-4 py-3">Starts</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {events.map((ev) => (
                <tr key={ev.id} className="border-b border-[var(--bo)] last:border-0 transition-colors hover:bg-[var(--sidebar-hover)]">
                  <td className="px-4 py-3 text-[13px] font-medium">
                    <Link href={`/events/${ev.id}`} className="flex items-center gap-2.5">
                      <span aria-hidden className="h-7 w-7 shrink-0 rounded-[8px]"
                            style={{ background: coverGradient(ev.coverGradient) }} />
                      <span className="text-[var(--ac)] hover:underline">{ev.title}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[13px] text-[var(--t2)]">{ev.venue || "—"}</td>
                  <td className="px-4 py-3 text-[13px] text-[var(--t2)]">{formatDate(ev.startsAt)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_VARIANT[ev.status]}>
                      {STATUS_LABEL[ev.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">{actions(ev)}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/** Segmented Grid/List switch — the active view is filled, the other is a quiet ghost. */
function ViewToggle({ view, onChange }: { view: ViewMode; onChange: (v: ViewMode) => void }) {
  return (
    <div role="group" aria-label="Choose layout"
         className="inline-flex items-center gap-0.5 rounded-[var(--rs)] border border-[var(--bo)] bg-[var(--ca)] p-0.5 shadow-[var(--sh)]">
      <ViewButton active={view === "grid"} label="Grid view" onClick={() => onChange("grid")}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
        </svg>
        Grid
      </ViewButton>
      <ViewButton active={view === "list"} label="List view" onClick={() => onChange("list")}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        List
      </ViewButton>
    </div>
  );
}

function ViewButton({
  active, label, onClick, children,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      className={`inline-flex items-center gap-1.5 rounded-[calc(var(--rs)-3px)] px-2.5 py-1.5 text-[12.5px] font-semibold transition-colors ${
        active
          ? "bg-[var(--ac)] text-white shadow-[var(--sh)]"
          : "text-[var(--t2)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--t1)]"
      }`}
    >
      {children}
    </button>
  );
}

/** Event tile for the grid view — gradient cover with status + category overlays, then meta and actions. */
function EventCard({ ev, actions }: { ev: EventResponse; actions: React.ReactNode }) {
  return (
    <div className="group flex flex-col overflow-hidden rounded-[var(--r)] border border-[var(--bo)] bg-[var(--ca)] shadow-[var(--sh)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--ac)] hover:shadow-[var(--sh2)]">
      <Link href={`/events/${ev.id}`} className="relative block overflow-hidden" style={{ height: 116 }}>
        <div
          aria-hidden
          className="absolute inset-0 transition-transform duration-500 group-hover:scale-[1.06]"
          style={{ background: coverGradient(ev.coverGradient) }}
        />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{ background: "linear-gradient(180deg, transparent 45%, rgba(13,10,40,.34) 100%)" }}
        />
        <span className="absolute left-3 top-3">
          <Badge variant={STATUS_VARIANT[ev.status]}>{STATUS_LABEL[ev.status]}</Badge>
        </span>
        {ev.category && (
          <span className="absolute right-3 top-3 rounded-full bg-black/30 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur">
            {ev.category}
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <Link href={`/events/${ev.id}`}
              className="truncate text-[14px] font-bold text-[var(--t1)] transition-colors hover:text-[var(--ac)]">
          {ev.title}
        </Link>
        <p className="mt-1 truncate text-[12.5px] font-medium text-[var(--t2)]">
          {formatDate(ev.startsAt)}{ev.venue ? ` · ${ev.venue}` : ""}
        </p>
        <div className="mt-3 flex flex-1 items-end justify-start gap-1 border-t border-[var(--bo)] pt-2">
          {actions}
        </div>
      </div>
    </div>
  );
}
