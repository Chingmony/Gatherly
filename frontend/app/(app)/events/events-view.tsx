"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Eye, Trash2, Search, Calendar, MapPin, Pencil, Image as ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { listEvents, deleteEvent, type AdminEvent } from "@/lib/api/events";
import { ApiError } from "@/lib/api/client";
import { toast } from "@/components/ui/toast";
import { mediaUrl } from "@/lib/media";
import { getRole } from "@/lib/auth/session";

// Banner gradient per category (matched case-insensitively against the free-form category string).
const CATEGORY_GRADIENT: Record<string, string> = {
  conference: "linear-gradient(135deg, #8e7bf2, #7c5cf5)",
  festival:   "linear-gradient(135deg, #f2607e, #f59345)",
  networking: "linear-gradient(135deg, #28b7b0, #3b7fd4)",
  workshop:   "linear-gradient(135deg, #34c777, #1fa86a)",
  webinar:    "linear-gradient(135deg, #5b8df0, #4f63ef)",
  gala:       "linear-gradient(135deg, #f5a13d, #ec5c8a)",
  hackathon:  "linear-gradient(135deg, #5b8df0, #4f63ef)",
  other:      "linear-gradient(135deg, #6366f1, #8b5cf6)",
};
const DEFAULT_GRADIENT = "linear-gradient(135deg, #6366f1, #8b5cf6)";

function categoryLabel(c: string | null) {
  return c && c.trim() ? c : "Event";
}
function gradientFor(c: string | null) {
  const key = (c ?? "").trim().toLowerCase();
  return CATEGORY_GRADIENT[key] ?? DEFAULT_GRADIENT;
}
function formatDate(iso: string | null) {
  if (!iso) return "Date TBD";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}

type FilterId = "all" | "public" | "draft";

export function EventsView() {
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterId>("all");
  // Create/publish and delete are Admin-only (spec §5); Sub-admins manage assigned
  // events but can't create or delete. Resolved client-side to avoid a hydration flash.
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setIsAdmin(getRole() === "admin");
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    listEvents()
      .then((ev) => { if (!cancelled) setEvents(ev ?? []); })
      .catch((e) => { if (!cancelled) setLoadError(e instanceof ApiError ? e.message : "Failed to load events."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const counts = {
    all: events.length,
    public: events.filter((e) => e.status === "PUBLIC").length,
    draft: events.filter((e) => e.status === "DRAFT").length,
  };

  const visible = events.filter((e) => {
    const matchesFilter =
      filter === "all" || (filter === "public" && e.status === "PUBLIC") || (filter === "draft" && e.status === "DRAFT");
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q || e.title.toLowerCase().includes(q) || (e.venue ?? "").toLowerCase().includes(q) || categoryLabel(e.category).toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  const FILTERS: { id: FilterId; label: string; count: number }[] = [
    { id: "all", label: "All", count: counts.all },
    { id: "public", label: "Public", count: counts.public },
    { id: "draft", label: "Draft", count: counts.draft },
  ];

  async function handleDelete(ev: AdminEvent) {
    if (!window.confirm(`Delete "${ev.title}"? This cannot be undone.`)) return;
    try {
      await deleteEvent(ev.id);
      setEvents((prev) => prev.filter((e) => e.id !== ev.id));
      toast.success("Event deleted", `"${ev.title}" was removed.`);
    } catch (e) {
      toast.error("Couldn't delete event", e instanceof ApiError ? e.message : undefined);
    }
  }

  return (
    <div className="flex flex-col gap-6 view-anim">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-[26px] font-extrabold tracking-tight m-0" style={{ color: "var(--text-strong)" }}>All Events</h1>
          <p className="text-sm m-0" style={{ color: "var(--text-muted)" }}>Manage every event across your organization</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-faint)" }} />
            <input
              type="search"
              placeholder="Search events…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-[240px] h-[42px] pl-9 pr-3.5 rounded-[var(--radius-md)] border text-sm font-semibold transition-all focus:outline-none focus:border-[var(--primary-hex,#6366f1)] focus:shadow-[0_0_0_4px_var(--primary-ring)]"
              style={{ background: "var(--surface)", borderColor: "var(--border-hex,#ecedf4)", color: "var(--text)" }}
            />
          </div>
          <div className="flex items-center gap-1 p-1 rounded-[var(--radius-md)]" style={{ background: "var(--surface-3)" }} role="radiogroup">
            {FILTERS.map((f) => {
              const active = f.id === filter;
              return (
                <button
                  key={f.id}
                  role="radio"
                  aria-checked={active}
                  onClick={() => setFilter(f.id)}
                  className="flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-[var(--radius-sm)] transition-all whitespace-nowrap cursor-pointer"
                  style={{
                    background: active ? "var(--surface)" : "transparent",
                    boxShadow: active ? "var(--shadow-sm)" : "none",
                    color: active ? "var(--text-strong)" : "var(--text-muted)",
                    border: "none",
                  }}
                >
                  {f.label}
                  <span className="text-xs font-bold" style={{ color: active ? "var(--primary-hex,#6366f1)" : "var(--text-faint)" }}>{f.count}</span>
                </button>
              );
            })}
          </div>
          {isAdmin && (
            <Button asChild size="default">
              <Link href="/events/new"><Plus size={16} /> Create Event</Link>
            </Button>
          )}
        </div>
      </div>

      {/* Body states */}
      {loading ? (
        <div className="py-24 flex items-center justify-center gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
          <Loader2 size={18} className="animate-spin" /> Loading events…
        </div>
      ) : loadError ? (
        <div className="py-24 text-center text-sm" style={{ color: "var(--danger)" }}>{loadError}</div>
      ) : visible.length === 0 ? (
        <div className="py-24 text-center text-sm" style={{ color: "var(--text-muted)" }}>
          {events.length === 0 ? "No events yet. Create your first event." : "No events match your search."}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {visible.map((ev) => {
            const pct = ev.capacity ? Math.min(100, Math.round((ev.registeredCount / ev.capacity) * 100)) : 0;
            const isPublic = ev.status === "PUBLIC";
            const statusLabel = ev.status.charAt(0) + ev.status.slice(1).toLowerCase();
            return (
              <div
                key={ev.id}
                className="flex flex-col rounded-[var(--radius-xl)] overflow-hidden border transition-shadow hover:shadow-[var(--shadow-pop)]"
                style={{ background: "var(--surface)", borderColor: "var(--border-hex,#ecedf4)" }}
              >
                {/* Banner */}
                <div
                  className="relative h-[150px] p-4"
                  style={
                    ev.coverImageUrl
                      ? { backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.18), rgba(0,0,0,0.28)), url(${mediaUrl(ev.coverImageUrl)})`, backgroundSize: "cover", backgroundPosition: "center" }
                      : { background: gradientFor(ev.category) }
                  }
                >
                  {!ev.coverImageUrl && <ImageIcon size={56} strokeWidth={1.5} className="absolute bottom-4 right-4 opacity-25" style={{ color: "#fff" }} />}
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full text-white" style={{ background: "rgba(0,0,0,0.22)", backdropFilter: "blur(4px)" }}>
                      {categoryLabel(ev.category)}
                    </span>
                    {isPublic ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.92)", color: "var(--green-600)" }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--green-600)" }} /> Public
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full text-white" style={{ background: "rgba(0,0,0,0.28)", backdropFilter: "blur(4px)" }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-white/80" /> {statusLabel}
                      </span>
                    )}
                  </div>
                </div>

                {/* Body */}
                <div className="flex flex-col gap-3 p-5">
                  <div className="flex flex-col gap-1.5">
                    <h3 className="text-lg font-bold m-0 leading-tight" style={{ color: "var(--text-strong)" }}>{ev.title}</h3>
                    <div className="flex items-center gap-2 text-[13px] flex-wrap" style={{ color: "var(--text-muted)" }}>
                      <span className="inline-flex items-center gap-1.5"><Calendar size={13} /> {formatDate(ev.startsAt)}</span>
                      {ev.venue && <><span style={{ color: "var(--text-faint)" }}>·</span><span className="inline-flex items-center gap-1.5"><MapPin size={13} /> {ev.venue}</span></>}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-semibold" style={{ color: "var(--text-muted)" }}>Registration</span>
                      <span className="text-[13px] font-bold" style={{ color: "var(--text-strong)" }}>
                        {ev.registeredCount.toLocaleString()}{ev.capacity != null ? ` / ${ev.capacity.toLocaleString()}` : ""}
                      </span>
                    </div>
                    <Progress value={pct} />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <Button asChild variant="ghost" size="sm" className="flex-1">
                      <Link href={`/events/${ev.id}/workspace`}><Pencil size={14} /> Manage</Link>
                    </Button>
                    <Button asChild variant="ghost" size="icon-sm" title="Edit event">
                      <Link href={`/events/${ev.id}/edit`}><Eye size={15} /></Link>
                    </Button>
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        title="Delete event"
                        className="hover:bg-[var(--danger-soft)] hover:text-[var(--danger)]"
                        style={{ background: "var(--danger-soft)", color: "var(--danger)" }}
                        onClick={() => handleDelete(ev)}
                      >
                        <Trash2 size={15} />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
