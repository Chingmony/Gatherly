"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { mediaUrl } from "@/lib/media";
import {
  Calendar,
  MapPin,
  ChevronLeft,
  Users,
  Ticket,
  Search,
  CalendarX2,
  AlertCircle,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listPublicEvents, type PublicEvent } from "@/lib/api/events";

const ALL = "all";

/** Cover preset id (from the Create Event form) → card gradient + category-pill accent. */
const COVER_THEMES: Record<string, { from: string; to: string; accent: string }> = {
  violet: { from: "#6366f1", to: "#8b5cf6", accent: "var(--violet)" },
  blue: { from: "#3b82f6", to: "#6366f1", accent: "var(--blue)" },
  teal: { from: "#14b8a6", to: "#06b6d4", accent: "var(--teal)" },
  green: { from: "#22c55e", to: "#16a34a", accent: "var(--green-600)" },
  orange: { from: "#f59e0b", to: "#f97316", accent: "var(--orange)" },
  amber: { from: "#f97316", to: "#ec4899", accent: "var(--pink)" },
  pink: { from: "#f43f5e", to: "#f59e0b", accent: "var(--pink)" },
};
const DEFAULT_THEME = { from: "#6366f1", to: "#8b5cf6", accent: "var(--violet)" };

function coverTheme(coverColor: string | null) {
  if (!coverColor) return DEFAULT_THEME;
  if (coverColor.startsWith("#")) {
    return { from: coverColor, to: coverColor, accent: "var(--primary-hex,#6366f1)" };
  }
  return COVER_THEMES[coverColor] ?? DEFAULT_THEME;
}

function fmtDate(iso: string | null) {
  if (!iso) return "Date TBA";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Date TBA";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function ExploreView() {
  const [events, setEvents] = useState<PublicEvent[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(ALL);
  const [location, setLocation] = useState(ALL);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setStatus("loading");
    listPublicEvents({ signal: controller.signal })
      .then((data) => {
        setEvents(data);
        setStatus("ready");
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        console.error("Failed to load public events", err);
        setStatus("error");
      });
    return () => controller.abort();
  }, [reloadKey]);

  const categories = useMemo(
    () => Array.from(new Set(events.map((e) => e.category).filter(Boolean) as string[])).sort(),
    [events]
  );
  const locations = useMemo(
    () => Array.from(new Set(events.map((e) => e.venue).filter(Boolean) as string[])).sort(),
    [events]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return events.filter((e) => {
      const matchesName = !q || e.title.toLowerCase().includes(q);
      const matchesCategory = category === ALL || e.category === category;
      const matchesLocation = location === ALL || e.venue === location;
      return matchesName && matchesCategory && matchesLocation;
    });
  }, [events, query, category, location]);

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      {/* Public topbar */}
      <header className="flex items-center px-6 md:px-10 h-[68px] gap-4">
        <Logo size={28} />
        <div className="flex-1" />
        <ThemeToggle />
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard"><ChevronLeft size={15} /> Back to app</Link>
        </Button>
      </header>

      <div className="max-w-[1000px] mx-auto px-6 pb-16 flex flex-col gap-8">
        {/* Hero banner */}
        <div
          className="relative overflow-hidden rounded-[var(--radius-xl)] px-8 py-10 md:px-12 md:py-12"
          style={{
            background: "linear-gradient(115deg, #6366f1 0%, #7c5cf0 42%, #9b6df0 70%, #6f8bf5 100%)",
            boxShadow: "var(--shadow-glow)",
          }}
        >
          <div className="relative flex flex-col gap-3 max-w-xl">
            <span
              className="inline-flex items-center gap-1.5 self-start text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm"
              style={{ background: "rgba(255,255,255,0.18)", color: "#fff" }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#fff" }} />
              Gatherly · Discover
            </span>
            <h1 className="text-[34px] md:text-[40px] font-extrabold leading-[1.05] m-0" style={{ color: "#fff" }}>
              Find your next event
            </h1>
            <p className="text-[15px] leading-relaxed m-0 max-w-lg" style={{ color: "rgba(255,255,255,0.86)" }}>
              Browse upcoming gatherings — conferences, festivals, workshops and more. Register in under a minute and get
              your QR ticket instantly.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-faint)" }} />
            <input
              type="search"
              placeholder="Search events by name…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={status !== "ready"}
              className="w-full h-[44px] pl-10 pr-3.5 rounded-[var(--radius-md)] border text-sm font-semibold transition-all focus:outline-none focus:border-[var(--primary-hex,#6366f1)] focus:shadow-[0_0_0_4px_var(--primary-ring)] disabled:opacity-60"
              style={{ background: "var(--surface)", borderColor: "var(--border-hex,#ecedf4)", color: "var(--text)" }}
            />
          </div>

          <Select value={category} onValueChange={setCategory} disabled={status !== "ready"}>
            <SelectTrigger className="h-[44px] md:w-48" style={{ background: "var(--surface)" }} aria-label="Filter by category">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={location} onValueChange={setLocation} disabled={status !== "ready"}>
            <SelectTrigger className="h-[44px] md:w-52" style={{ background: "var(--surface)" }} aria-label="Filter by location">
              <SelectValue placeholder="Location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All locations</SelectItem>
              {locations.map((l) => (
                <SelectItem key={l} value={l}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Section heading */}
        <div className="flex items-end justify-between">
          <h2 className="text-[22px] font-extrabold tracking-tight m-0" style={{ color: "var(--text-strong)" }}>
            Upcoming events
          </h2>
          {status === "ready" && (
            <span className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>
              {filtered.length} {filtered.length === 1 ? "event" : "events"}
            </span>
          )}
        </div>

        {/* Body: loading / error / empty / grid */}
        {status === "loading" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : status === "error" ? (
          <div
            className="flex flex-col items-center justify-center gap-3 py-16 text-center rounded-[var(--radius-xl)] border"
            style={{ background: "var(--surface)", borderColor: "var(--border-hex,#ecedf4)" }}
          >
            <AlertCircle size={30} style={{ color: "var(--danger)" }} />
            <div className="flex flex-col gap-1">
              <p className="text-sm font-bold m-0" style={{ color: "var(--text)" }}>Couldn&apos;t load events</p>
              <p className="text-xs m-0" style={{ color: "var(--text-muted)" }}>Please check your connection and try again.</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setReloadKey((k) => k + 1)}>Retry</Button>
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center gap-3 py-16 text-center rounded-[var(--radius-xl)] border"
            style={{ background: "var(--surface)", borderColor: "var(--border-hex,#ecedf4)" }}
          >
            <CalendarX2 size={30} style={{ color: "var(--text-faint)" }} />
            <div className="flex flex-col gap-1">
              <p className="text-sm font-bold m-0" style={{ color: "var(--text)" }}>
                {events.length === 0 ? "No public events yet" : "No events match your filters"}
              </p>
              <p className="text-xs m-0" style={{ color: "var(--text-muted)" }}>
                {events.length === 0 ? "Check back soon for upcoming gatherings." : "Try a different search, category, or location."}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((ev) => (
              <EventCard key={ev.id} ev={ev} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EventCard({ ev }: { ev: PublicEvent }) {
  const theme = coverTheme(ev.coverColor);
  const coverStyle: React.CSSProperties = ev.coverImageUrl
    ? { backgroundImage: `url(${mediaUrl(ev.coverImageUrl)})`, backgroundSize: "cover", backgroundPosition: "center" }
    : { background: `linear-gradient(135deg, ${theme.from}, ${theme.to})` };

  const remaining = ev.capacity != null ? ev.capacity - ev.registeredCount : null;

  return (
    <div
      className="rounded-[var(--radius-xl)] overflow-hidden border flex flex-col transition-all hover:-translate-y-1"
      style={{ background: "var(--surface)", borderColor: "var(--border-hex,#ecedf4)", boxShadow: "var(--shadow-card)" }}
    >
      {/* Cover */}
      <div className="relative h-28 p-4 flex items-start justify-between" style={coverStyle}>
        {ev.category && (
          <span
            className="text-xs font-bold px-2.5 py-1 rounded-full"
            style={{ background: "var(--surface)", color: theme.accent }}
          >
            {ev.category}
          </span>
        )}
        {remaining != null && (
          <span
            className="text-xs font-bold px-2.5 py-1 rounded-full ml-auto"
            style={{
              background: "var(--surface)",
              color: remaining > 0 ? "var(--green-600)" : "var(--orange)",
            }}
          >
            {remaining > 0 ? `${remaining.toLocaleString()} left` : "Full"}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col gap-2.5 flex-1">
        <h3 className="text-base font-extrabold leading-snug m-0" style={{ color: "var(--text-strong)" }}>
          {ev.title}
        </h3>

        <div className="flex items-center gap-2 text-[13px]" style={{ color: "var(--text-muted)" }}>
          <span className="inline-flex items-center gap-1.5">
            <Calendar size={13} /> {fmtDate(ev.startsAt)}
          </span>
          <span style={{ color: "var(--text-faint)" }}>·</span>
          <span className="inline-flex items-center gap-1.5 min-w-0">
            <MapPin size={13} className="flex-shrink-0" />
            <span className="truncate">{ev.venue ?? "Venue TBA"}</span>
          </span>
        </div>

        <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold" style={{ color: "var(--text-muted)" }}>
          <Users size={13} /> {ev.registeredCount.toLocaleString()} registered
        </span>

        <Button asChild size="block" className="mt-2">
          <Link href={`/events/${ev.slug}/register`}><Ticket size={16} /> Register</Link>
        </Button>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div
      className="rounded-[var(--radius-xl)] overflow-hidden border flex flex-col animate-pulse"
      style={{ background: "var(--surface)", borderColor: "var(--border-hex,#ecedf4)" }}
    >
      <div className="h-28" style={{ background: "var(--surface-3)" }} />
      <div className="p-5 flex flex-col gap-3 flex-1">
        <div className="h-4 w-3/4 rounded" style={{ background: "var(--surface-3)" }} />
        <div className="h-3 w-1/2 rounded" style={{ background: "var(--surface-3)" }} />
        <div className="h-3 w-1/3 rounded" style={{ background: "var(--surface-3)" }} />
        <div className="h-[42px] w-full rounded-[var(--radius-md)] mt-2" style={{ background: "var(--surface-3)" }} />
      </div>
    </div>
  );
}
