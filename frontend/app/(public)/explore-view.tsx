"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { mediaUrl } from "@/lib/media";
import {
  Calendar,
  MapPin,
  Users,
  Ticket,
  Search,
  CalendarX2,
  AlertCircle,
  Tag,
  ArrowDown,
  ArrowRight,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listPublicEvents, type PublicEvent } from "@/lib/api/events";
import { PublicShell } from "./public-chrome";

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

const DATE_FILTERS = [
  { value: ALL, label: "Any date" },
  { value: "today", label: "Today" },
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
];

function inDateRange(iso: string | null, filter: string) {
  if (filter === ALL) return true;
  if (!iso) return false;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const day = 24 * 60 * 60 * 1000;
  const spans: Record<string, number> = { today: 1, week: 7, month: 30 };
  const span = spans[filter];
  if (!span) return true;
  return d.getTime() >= startOfToday.getTime() && d.getTime() < startOfToday.getTime() + span * day;
}

export function ExploreView() {
  const [events, setEvents] = useState<PublicEvent[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(ALL);
  const [location, setLocation] = useState(ALL);
  const [dateFilter, setDateFilter] = useState(ALL);
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
      const matchesName =
        !q || e.title.toLowerCase().includes(q) || (e.category ?? "").toLowerCase().includes(q);
      const matchesCategory = category === ALL || e.category === category;
      const matchesLocation = location === ALL || e.venue === location;
      const matchesDate = inDateRange(e.startsAt, dateFilter);
      return matchesName && matchesCategory && matchesLocation && matchesDate;
    });
  }, [events, query, category, location, dateFilter]);

  const featured = events[0] ?? null;

  return (
    <PublicShell>
      <div className="mx-auto flex max-w-[1200px] flex-col gap-12 px-6 pb-20 pt-6 md:px-10">
          {/* Hero */}
          <section className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
            {/* Left column */}
            <div className="flex flex-col gap-6">
              <span
                className="inline-flex items-center gap-2 self-start rounded-full px-3.5 py-1.5 text-xs font-bold"
                style={{ background: "var(--surface)", color: "var(--text-muted)", boxShadow: "var(--shadow-card)" }}
              >
                <span className="h-2 w-2 rounded-full" style={{ background: "var(--green-600)" }} />
                Public events · register in seconds
              </span>

              <h1
                className="m-0 text-[44px] font-extrabold leading-[1.02] tracking-tight md:text-[56px]"
                style={{ color: "var(--text-strong)" }}
              >
                Find your next{" "}
                <span
                  style={{
                    background: "linear-gradient(100deg, #7c5cf0 0%, #9b6df0 45%, #ec4899 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  unforgettable
                </span>{" "}
                event.
              </h1>

              <p className="m-0 max-w-md text-[15px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
                Browse upcoming public events and register in moments — your unique QR ticket lands in your inbox the
                instant you join.
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <Button asChild size="lg">
                  <a href="#events">
                    Browse events <ArrowDown size={16} />
                  </a>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/login">Organizer sign in</Link>
                </Button>
              </div>

              {/* Stats */}
              <div className="mt-2 flex items-center gap-10">
                <Stat value={events.length} label="Live events" />
                <Stat value={categories.length} label="Categories" />
                <Stat value={locations.length} label="Venues" />
              </div>
            </div>

            {/* Right column — featured card */}
            <div className="lg:pl-6">
              {status === "ready" && featured ? (
                <FeaturedCard ev={featured} />
              ) : (
                <FeaturedSkeleton />
              )}
            </div>
          </section>

          {/* Search & filter bar */}
          <div
            className="flex flex-col gap-3 rounded-[var(--radius-xl)] p-3 md:flex-row md:items-stretch md:gap-0"
            style={{ background: "var(--surface)", boxShadow: "var(--shadow-card)" }}
          >
            <FilterField label="Search" className="flex-[1.4]">
              <div className="relative">
                <Search
                  size={15}
                  className="absolute left-0 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--text-faint)" }}
                />
                <input
                  type="search"
                  placeholder="Search by name or type"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  disabled={status !== "ready"}
                  className="w-full border-0 bg-transparent pl-6 text-sm font-semibold focus:outline-none disabled:opacity-60"
                  style={{ color: "var(--text)" }}
                />
              </div>
            </FilterField>

            <FieldDivider />

            <FilterField label="Date" icon={<Calendar size={14} />}>
              <BareSelect
                value={dateFilter}
                onValueChange={setDateFilter}
                disabled={status !== "ready"}
                ariaLabel="Filter by date"
              >
                {DATE_FILTERS.map((d) => (
                  <SelectItem key={d.value} value={d.value}>
                    {d.label}
                  </SelectItem>
                ))}
              </BareSelect>
            </FilterField>

            <FieldDivider />

            <FilterField label="Location" icon={<MapPin size={14} />}>
              <BareSelect
                value={location}
                onValueChange={setLocation}
                disabled={status !== "ready"}
                ariaLabel="Filter by location"
              >
                <SelectItem value={ALL}>Anywhere</SelectItem>
                {locations.map((l) => (
                  <SelectItem key={l} value={l}>
                    {l}
                  </SelectItem>
                ))}
              </BareSelect>
            </FilterField>

            <FieldDivider />

            <FilterField label="Type event" icon={<Tag size={14} />}>
              <BareSelect
                value={category}
                onValueChange={setCategory}
                disabled={status !== "ready"}
                ariaLabel="Filter by type"
              >
                <SelectItem value={ALL}>Any type</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </BareSelect>
            </FilterField>

            <div className="flex items-center md:pl-2">
              <Button size="icon" className="h-[52px] w-full md:w-[52px]" aria-label="Search events">
                <Search size={18} />
              </Button>
            </div>
          </div>

          {/* Category chips */}
          {categories.length > 0 && (
            <div className="-mt-6 flex flex-wrap gap-2">
              <Chip active={category === ALL} onClick={() => setCategory(ALL)}>
                All
              </Chip>
              {categories.map((c) => (
                <Chip key={c} active={category === c} onClick={() => setCategory(c)}>
                  {c}
                </Chip>
              ))}
            </div>
          )}

          {/* Listing */}
          <section id="events" className="flex flex-col gap-6 scroll-mt-24">
            <div className="flex items-end justify-between">
              <h2
                className="m-0 text-[24px] font-extrabold tracking-tight"
                style={{ color: "var(--text-strong)" }}
              >
                Upcoming events
              </h2>
              {status === "ready" && (
                <span className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>
                  {filtered.length} {filtered.length === 1 ? "event" : "events"}
                </span>
              )}
            </div>

            {status === "loading" ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : status === "error" ? (
              <div
                className="flex flex-col items-center justify-center gap-3 rounded-[var(--radius-xl)] border py-16 text-center"
                style={{ background: "var(--surface)", borderColor: "var(--border-hex,#ecedf4)" }}
              >
                <AlertCircle size={30} style={{ color: "var(--danger)" }} />
                <div className="flex flex-col gap-1">
                  <p className="m-0 text-sm font-bold" style={{ color: "var(--text)" }}>
                    Couldn&apos;t load events
                  </p>
                  <p className="m-0 text-xs" style={{ color: "var(--text-muted)" }}>
                    Please check your connection and try again.
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setReloadKey((k) => k + 1)}>
                  Retry
                </Button>
              </div>
            ) : filtered.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center gap-3 rounded-[var(--radius-xl)] border py-16 text-center"
                style={{ background: "var(--surface)", borderColor: "var(--border-hex,#ecedf4)" }}
              >
                <CalendarX2 size={30} style={{ color: "var(--text-faint)" }} />
                <div className="flex flex-col gap-1">
                  <p className="m-0 text-sm font-bold" style={{ color: "var(--text)" }}>
                    {events.length === 0 ? "No public events yet" : "No events match your filters"}
                  </p>
                  <p className="m-0 text-xs" style={{ color: "var(--text-muted)" }}>
                    {events.length === 0
                      ? "Check back soon for upcoming gatherings."
                      : "Try a different search, category, or location."}
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((ev) => (
                  <EventCard key={ev.id} ev={ev} />
                ))}
              </div>
            )}
          </section>
      </div>
    </PublicShell>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[26px] font-extrabold leading-none" style={{ color: "var(--text-strong)" }}>
        {value}
      </span>
      <span
        className="mt-1.5 text-[11px] font-bold uppercase tracking-wider"
        style={{ color: "var(--text-faint)" }}
      >
        {label}
      </span>
    </div>
  );
}

function FilterField({
  label,
  icon,
  className,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`flex flex-1 flex-col justify-center gap-0.5 px-3 py-1 ${className ?? ""}`}>
      <span
        className="text-[10px] font-bold uppercase tracking-wider"
        style={{ color: "var(--text-faint)" }}
      >
        {label}
      </span>
      <div className="flex items-center gap-1.5" style={{ color: "var(--text-faint)" }}>
        {icon}
        {children}
      </div>
    </div>
  );
}

function FieldDivider() {
  return (
    <div
      className="hidden w-px self-stretch md:block"
      style={{ background: "var(--border-hex,#ecedf4)" }}
    />
  );
}

/** A Select styled to sit borderless inside the search bar. */
function BareSelect({
  value,
  onValueChange,
  disabled,
  ariaLabel,
  children,
}: {
  value: string;
  onValueChange: (v: string) => void;
  disabled?: boolean;
  ariaLabel: string;
  children: React.ReactNode;
}) {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger
        aria-label={ariaLabel}
        className="h-auto w-full border-0 bg-transparent p-0 text-sm font-semibold shadow-none focus:ring-0 focus:shadow-none"
        style={{ color: "var(--text)" }}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>{children}</SelectContent>
    </Select>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full px-4 py-2 text-[13px] font-bold transition-all active:translate-y-px"
      style={
        active
          ? { background: "var(--primary-hex,#6366f1)", color: "#fff", boxShadow: "var(--shadow-glow)" }
          : { background: "var(--surface)", color: "var(--text-muted)", boxShadow: "var(--shadow-card)" }
      }
    >
      {children}
    </button>
  );
}

function FeaturedCard({ ev }: { ev: PublicEvent }) {
  const theme = coverTheme(ev.coverColor);
  const coverStyle: React.CSSProperties = ev.coverImageUrl
    ? { backgroundImage: `url(${mediaUrl(ev.coverImageUrl)})`, backgroundSize: "cover", backgroundPosition: "center" }
    : { background: `linear-gradient(135deg, ${theme.from}, ${theme.to})` };

  return (
    <div
      className="overflow-hidden rounded-[var(--radius-xl)]"
      style={{ background: "var(--surface)", boxShadow: "var(--shadow-glow)" }}
    >
      {/* Cover */}
      <div className="relative flex h-44 flex-col justify-between p-5" style={coverStyle}>
        <span
          className="inline-flex items-center gap-1.5 self-start rounded-full px-3 py-1 text-[11px] font-bold backdrop-blur-sm"
          style={{ background: "rgba(255,255,255,0.22)", color: "#fff" }}
        >
          <Star size={12} fill="currentColor" /> Featured
        </span>
        <div className="flex flex-col gap-1">
          {ev.category && (
            <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.85)" }}>
              {ev.category}
            </span>
          )}
          <h3 className="m-0 text-2xl font-extrabold leading-tight" style={{ color: "#fff" }}>
            {ev.title}
          </h3>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-4 p-5">
        <div className="flex min-w-0 flex-col gap-2">
          <span className="inline-flex items-center gap-1.5 text-[13px]" style={{ color: "var(--text-muted)" }}>
            <Calendar size={13} /> {fmtDate(ev.startsAt)}
            <span style={{ color: "var(--text-faint)" }}>·</span>
            <span className="truncate">{ev.venue ?? "Venue TBA"}</span>
          </span>
          <span
            className="inline-flex items-center gap-1.5 self-start rounded-full px-2.5 py-0.5 text-xs font-bold"
            style={{ background: "var(--green-soft, rgba(34,197,94,0.12))", color: "var(--green-600)" }}
          >
            <Users size={12} />
            {ev.registeredCount.toLocaleString()}
            {ev.capacity != null ? ` / ${ev.capacity.toLocaleString()}` : ""} registered
          </span>
        </div>
        <Button asChild variant="soft">
          <Link href={`/events/${ev.slug}/register`}>
            Register <ArrowRight size={15} />
          </Link>
        </Button>
      </div>
    </div>
  );
}

function FeaturedSkeleton() {
  return (
    <div
      className="overflow-hidden rounded-[var(--radius-xl)] animate-pulse"
      style={{ background: "var(--surface)", boxShadow: "var(--shadow-card)" }}
    >
      <div className="h-44" style={{ background: "var(--surface-3)" }} />
      <div className="flex items-center justify-between gap-4 p-5">
        <div className="flex flex-1 flex-col gap-2">
          <div className="h-3 w-2/3 rounded" style={{ background: "var(--surface-3)" }} />
          <div className="h-3 w-1/3 rounded" style={{ background: "var(--surface-3)" }} />
        </div>
        <div className="h-[42px] w-28 rounded-[var(--radius-md)]" style={{ background: "var(--surface-3)" }} />
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
      className="flex flex-col overflow-hidden rounded-[var(--radius-xl)] border transition-all hover:-translate-y-1"
      style={{ background: "var(--surface)", borderColor: "var(--border-hex,#ecedf4)", boxShadow: "var(--shadow-card)" }}
    >
      {/* Cover */}
      <div className="relative flex h-28 items-start justify-between p-4" style={coverStyle}>
        {ev.category && (
          <span
            className="rounded-full px-2.5 py-1 text-xs font-bold"
            style={{ background: "var(--surface)", color: theme.accent }}
          >
            {ev.category}
          </span>
        )}
        {remaining != null && (
          <span
            className="ml-auto rounded-full px-2.5 py-1 text-xs font-bold"
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
      <div className="flex flex-1 flex-col gap-2.5 p-5">
        <h3 className="m-0 text-base font-extrabold leading-snug" style={{ color: "var(--text-strong)" }}>
          {ev.title}
        </h3>

        <div className="flex items-center gap-2 text-[13px]" style={{ color: "var(--text-muted)" }}>
          <span className="inline-flex flex-shrink-0 items-center gap-1.5 whitespace-nowrap">
            <Calendar size={13} className="flex-shrink-0" /> {fmtDate(ev.startsAt)}
          </span>
          <span className="flex-shrink-0" style={{ color: "var(--text-faint)" }}>·</span>
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <MapPin size={13} className="flex-shrink-0" />
            <span className="truncate">{ev.venue ?? "Venue TBA"}</span>
          </span>
        </div>

        <span
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold"
          style={{ color: "var(--text-muted)" }}
        >
          <Users size={13} /> {ev.registeredCount.toLocaleString()} registered
        </span>

        <Button asChild size="block" className="mt-2">
          <Link href={`/events/${ev.slug}/register`}>
            <Ticket size={16} /> Register
          </Link>
        </Button>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div
      className="flex flex-col overflow-hidden rounded-[var(--radius-xl)] border animate-pulse"
      style={{ background: "var(--surface)", borderColor: "var(--border-hex,#ecedf4)" }}
    >
      <div className="h-28" style={{ background: "var(--surface-3)" }} />
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="h-4 w-3/4 rounded" style={{ background: "var(--surface-3)" }} />
        <div className="h-3 w-1/2 rounded" style={{ background: "var(--surface-3)" }} />
        <div className="h-3 w-1/3 rounded" style={{ background: "var(--surface-3)" }} />
        <div className="mt-2 h-[42px] w-full rounded-[var(--radius-md)]" style={{ background: "var(--surface-3)" }} />
      </div>
    </div>
  );
}
