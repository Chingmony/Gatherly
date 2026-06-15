"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createEvent, publishEvent, archiveEvent, deleteEvent } from "@/lib/api/events";
import { ApiError } from "@/lib/api/client";
import type { EventResponse, EventStatus } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { DateField } from "@/components/ui/date-field";
import { coverGradient, COVER_KEYS } from "@/lib/covers";

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

export function EventsManager({ initialEvents }: { initialEvents: EventResponse[] }) {
  const router = useRouter();
  const [view, setView] = useState<ViewMode>("grid");
  const [modalOpen, setModalOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

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
      <div className="flex items-center justify-between gap-3">
        <ViewToggle view={view} onChange={pickView} />
        <Button onClick={() => setModalOpen(true)}>Create Event</Button>
      </div>

      {initialEvents.length === 0 ? (
        <div className="rounded-[var(--r)] border border-[var(--bo)] bg-[var(--ca)] px-4 py-12 text-center text-[13px] text-[var(--t3)] shadow-[var(--sh)]">
          No events yet.
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {initialEvents.map((ev) => (
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
              {initialEvents.map((ev) => (
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

      {modalOpen && (
        <CreateEventDialog
          onClose={() => setModalOpen(false)}
          onCreated={() => { setModalOpen(false); router.refresh(); }}
        />
      )}
    </div>
  );
}

/**
 * Create-event modal. Holds ALL form state locally so a keystroke re-renders only this small
 * component — never the parent EventsManager (and its event list). Re-rendering the parent on every
 * keystroke is what stole focus back to the first field; isolating state here fixes it for good.
 * Mounted only while open, so it resets cleanly on each open.
 */
function CreateEventDialog({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [title, setTitle] = useState("");
  const [venue, setVenue] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [capacity, setCapacity] = useState("");
  const [cover, setCover] = useState("a");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await createEvent({
        title,
        venue: venue || undefined,
        description: description || undefined,
        category: category || undefined,
        capacity: capacity ? Number(capacity) : undefined,
        coverGradient: cover,
        startsAt: startsAt ? new Date(startsAt).toISOString() : undefined,
        endsAt: endsAt ? new Date(endsAt).toISOString() : undefined,
      });
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create event.");
      setPending(false);
    }
  }

  return (
    <Dialog open onClose={onClose} titleId="create-event-title">
      <h2 id="create-event-title" className="text-[15px] font-bold tracking-[-0.01em] text-[var(--t1)]">
        Create Event
      </h2>
      <p className="mt-1 text-[13px] text-[var(--t2)]">It starts as a draft — publish it when ready.</p>
      <form onSubmit={onCreate} className="mt-4 space-y-4">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input id="title" required value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="venue">Venue</Label>
            <Input id="venue" value={venue} onChange={(e) => setVenue(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="category">Category</Label>
            <Input id="category" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Conference" />
          </div>
        </div>
        <div>
          <Label htmlFor="capacity">Capacity</Label>
          <Input id="capacity" type="number" min={0} value={capacity}
                 onChange={(e) => setCapacity(e.target.value)} placeholder="Unlimited" />
        </div>
        <div>
          <Label>Cover</Label>
          <div className="flex gap-2">
            {COVER_KEYS.map((k) => (
              <button type="button" key={k} aria-label={`Cover ${k}`} onClick={() => setCover(k)}
                      className="h-8 w-12 rounded-[8px] transition-transform"
                      style={{
                        background: coverGradient(k),
                        outline: cover === k ? "2px solid var(--primary)" : "none",
                        outlineOffset: 2,
                      }} />
            ))}
          </div>
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-[var(--rs)] border border-[var(--bo)] bg-[var(--ca)] px-3.5 py-2.5 text-[14px] text-[var(--t1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ac)] focus-visible:border-[var(--ac)]"
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="startsAt">Starts</Label>
            <DateField id="startsAt" value={startsAt} onChange={setStartsAt} />
          </div>
          <div>
            <Label htmlFor="endsAt">Ends</Label>
            <DateField id="endsAt" value={endsAt} onChange={setEndsAt} />
          </div>
        </div>
        {error && <p className="text-[13px] font-medium text-[var(--ac-2)]" role="alert">{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Creating…" : "Create Event"}
          </Button>
        </div>
      </form>
    </Dialog>
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
