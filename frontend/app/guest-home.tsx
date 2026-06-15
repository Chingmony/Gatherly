"use client";

import * as React from "react";
import Link from "next/link";
import { CalendarDays, MapPin, Search, Tag } from "lucide-react";
import { coverGradient } from "@/lib/covers";
import type { PublicEventCard } from "@/lib/api/types";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Reveal } from "@/components/motion/reveal";

/**
 * Guest browsing surface (design GuestHome): a full-bleed branded aurora hero with a
 * gradient headline, trust stats, and a floating "featured event" card, followed by a
 * glass search/filter bar, category quick-filters, and a live-filtered grid of public
 * events. Filtering is client-side over the events the server already fetched.
 */
export function GuestHome({ events }: { events: PublicEventCard[] }) {
  const [q, setQ] = React.useState("");
  const [dateWindow, setDateWindow] = React.useState<DateWindow>("any");
  const [venue, setVenue] = React.useState("");
  const [category, setCategory] = React.useState("");

  const featured = events[0];

  const venues = React.useMemo(
    () => uniq(events.map((e) => e.venue).filter(Boolean) as string[]),
    [events],
  );
  const categories = React.useMemo(
    () => uniq(events.map((e) => e.category).filter(Boolean) as string[]),
    [events],
  );

  const filtered = React.useMemo(() => {
    const needle = q.trim().toLowerCase();
    return events.filter((e) => {
      if (needle) {
        const hay = `${e.title} ${e.category ?? ""} ${e.venue ?? ""}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      if (venue && e.venue !== venue) return false;
      if (category && e.category !== category) return false;
      if (!withinWindow(e.startsAt, dateWindow)) return false;
      return true;
    });
  }, [events, q, venue, category, dateWindow]);

  const hasFilters = Boolean(q || venue || category || dateWindow !== "any");
  function reset() {
    setQ("");
    setVenue("");
    setCategory("");
    setDateWindow("any");
  }

  function jumpToEvents() {
    document.getElementById("events")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function pickCategory(c: string) {
    setCategory((prev) => (prev === c ? "" : c));
    requestAnimationFrame(jumpToEvents);
  }

  return (
    <>
      {/* Hero — full-bleed branded aurora */}
      <section className="relative left-1/2 right-1/2 -mx-[50vw] w-screen overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, var(--primary-soft) 0%, transparent 62%)",
            }}
          />
          <div
            className="hero-orb hero-orb-a absolute"
            style={{
              top: "-90px",
              left: "8%",
              width: 320,
              height: 320,
              background: "radial-gradient(circle at 30% 30%, var(--primary), transparent 68%)",
              opacity: 0.28,
              filter: "blur(34px)",
            }}
          />
          <div
            className="hero-orb hero-orb-b absolute"
            style={{
              top: "-40px",
              right: "4%",
              width: 360,
              height: 360,
              background: "radial-gradient(circle at 60% 40%, var(--pink), var(--orange) 70%, transparent 72%)",
              opacity: 0.22,
              filter: "blur(40px)",
            }}
          />
          <div
            className="hero-orb hero-orb-a absolute"
            style={{
              top: "120px",
              left: "44%",
              width: 280,
              height: 280,
              background: "radial-gradient(circle at 50% 50%, var(--violet), transparent 70%)",
              opacity: 0.18,
              filter: "blur(42px)",
            }}
          />
        </div>

        <div className="relative mx-auto max-w-[1100px] px-5 py-14 sm:py-20">
          <div className="grid items-center gap-12 lg:grid-cols-[1.08fr_0.92fr]">
            {/* Headline column */}
            <div>
              <Reveal>
                <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3.5 py-1.5 text-[12px] font-bold text-[var(--text-muted)] shadow-[var(--shadow-sm)]">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--green)] opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--green)]" />
                  </span>
                  Public events · register in seconds
                </span>
              </Reveal>

              <Reveal delay={0.05}>
                <h1 className="mt-5 text-[40px] font-extrabold leading-[1.04] tracking-[-0.03em] text-[var(--text-strong)] sm:text-[58px]">
                  Find your next <span className="text-grad">unforgettable</span> event.
                </h1>
              </Reveal>

              <Reveal delay={0.1}>
                <p className="mt-5 max-w-md text-[15.5px] font-medium leading-relaxed text-[var(--text-muted)]">
                  Browse upcoming public events and register in moments — your unique QR
                  ticket lands in your inbox the instant you join.
                </p>
              </Reveal>

              <Reveal delay={0.15}>
                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <button
                    onClick={jumpToEvents}
                    className="inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--primary)] px-6 py-3 text-[14px] font-bold text-white shadow-[var(--shadow-glow)] transition-transform hover:-translate-y-0.5"
                  >
                    Browse events
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path d="M12 5v14M5 12l7 7 7-7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[var(--surface)] px-6 py-3 text-[14px] font-bold text-[var(--text)] transition-colors hover:border-[var(--primary-ring)] hover:text-[var(--primary)]"
                  >
                    Organizer sign in
                  </Link>
                </div>
              </Reveal>

              {events.length > 0 && (
                <Reveal delay={0.2}>
                  <dl className="mt-9 flex flex-wrap gap-x-9 gap-y-4">
                    <Stat value={events.length} label={events.length === 1 ? "Live event" : "Live events"} />
                    {categories.length > 0 && <Stat value={categories.length} label="Categories" />}
                    {venues.length > 0 && <Stat value={venues.length} label="Venues" />}
                  </dl>
                </Reveal>
              )}
            </div>

            {/* Featured card column */}
            {featured && (
              <Reveal delay={0.12} className="hidden lg:block">
                <FeaturedCard ev={featured} />
              </Reveal>
            )}
          </div>
        </div>
      </section>

      {/* Search / filter bar — glass, lifts above the hero */}
      <Reveal delay={0.05}>
        <form
          onSubmit={(e) => e.preventDefault()}
          className="relative z-10 -mt-8 grid grid-cols-1 gap-2 rounded-[var(--radius-xl)] border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface)_88%,transparent)] p-2.5 shadow-[var(--shadow-pop)] backdrop-blur sm:grid-cols-[1.4fr_1fr_1fr_1fr_auto] sm:items-center"
        >
          <Field label="Search" icon={<Search size={16} aria-hidden />}>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name or type"
              className="w-full bg-transparent text-[14px] font-semibold text-[var(--text-strong)] outline-none placeholder:font-medium placeholder:text-[var(--text-faint)]"
            />
          </Field>

          <Field label="Date" icon={<CalendarDays size={16} aria-hidden />} divider>
            <Select
              variant="bare"
              value={dateWindow}
              onChange={(v) => setDateWindow(v as DateWindow)}
              aria-label="Date"
              options={[
                { value: "any", label: "Any date" },
                { value: "week", label: "This week" },
                { value: "month", label: "This month" },
                { value: "upcoming", label: "Upcoming" },
              ]}
            />
          </Field>

          <Field label="Location" icon={<MapPin size={16} aria-hidden />} divider>
            <Select
              variant="bare"
              value={venue}
              onChange={setVenue}
              aria-label="Location"
              options={[{ value: "", label: "Anywhere" }, ...venues.map((v) => ({ value: v, label: v }))]}
            />
          </Field>

          <Field label="Type event" icon={<Tag size={16} aria-hidden />} divider>
            <Select
              variant="bare"
              value={category}
              onChange={setCategory}
              aria-label="Type event"
              options={[{ value: "", label: "Any type" }, ...categories.map((c) => ({ value: c, label: c }))]}
            />
          </Field>

          <button
            type="submit"
            aria-label="Search events"
            className="mx-auto my-1 grid h-11 w-11 place-items-center rounded-full bg-[var(--primary)] text-white shadow-[var(--shadow-glow)] transition-transform hover:-translate-y-0.5 sm:mx-2"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
              <path d="m20 20-3.2-3.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </form>
      </Reveal>

      {/* Category quick-filters */}
      {categories.length > 0 && (
        <Reveal delay={0.08}>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <Chip active={category === ""} onClick={() => setCategory("")}>
              All
            </Chip>
            {categories.map((c) => (
              <Chip key={c} active={category === c} onClick={() => pickCategory(c)}>
                {c}
              </Chip>
            ))}
          </div>
        </Reveal>
      )}

      {/* Listings */}
      <div id="events" className="mt-10 mb-4 flex items-baseline justify-between scroll-mt-20">
        <h2 className="text-[22px] font-extrabold tracking-[-0.02em] text-[var(--text-strong)]">
          {hasFilters ? "Matching events" : "Upcoming events"}
        </h2>
        <span className="text-[12.5px] font-semibold text-[var(--text-faint)]">
          {filtered.length} {filtered.length === 1 ? "event" : "events"}
          {hasFilters && events.length !== filtered.length ? ` of ${events.length}` : ""}
        </span>
      </div>

      {events.length === 0 ? (
        <EmptyState text="No public events yet — check back soon." />
      ) : filtered.length === 0 ? (
        <EmptyState
          text="No events match your search."
          action={
            <button
              onClick={reset}
              className="mt-3 text-[13px] font-bold text-[var(--primary)] hover:underline"
            >
              Clear filters
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((ev, i) => (
            <Reveal key={ev.id} delay={Math.min(i * 0.04, 0.24)}>
              <EventCard ev={ev} />
            </Reveal>
          ))}
        </div>
      )}
    </>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <dd className="text-[26px] font-extrabold leading-none tracking-[-0.02em] text-[var(--text-strong)]">
        {value}
      </dd>
      <dt className="mt-1 text-[12px] font-bold uppercase tracking-[0.08em] text-[var(--text-faint)]">
        {label}
      </dt>
    </div>
  );
}

/** The spotlight card in the hero — tilted glass tile floating beside the headline. */
function FeaturedCard({ ev }: { ev: PublicEventCard }) {
  return (
    <div className="hero-float">
      <Link
        href={`/event/${ev.slug}`}
        className="group block overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-pop)] transition-transform duration-300 hover:-translate-y-1"
      >
        <div className="relative" style={{ height: 188, background: coverGradient(ev.coverGradient) }}>
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(160px 120px at 80% 16%, rgba(255,255,255,.32), transparent 70%), linear-gradient(180deg, transparent 40%, rgba(13,10,40,.42) 100%)",
            }}
          />
          <span className="absolute left-4 top-4 rounded-full bg-white/85 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.08em] text-[var(--primary-700)] backdrop-blur">
            ★ Featured
          </span>
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/80">
              {ev.category ?? "Event"}
            </p>
            <h3 className="mt-1 line-clamp-2 text-[20px] font-extrabold leading-[1.12] tracking-[-0.01em]">
              {ev.title}
            </h3>
          </div>
        </div>
        <div className="flex items-center justify-between p-4">
          <div className="min-w-0">
            <p className="truncate text-[12.5px] font-semibold text-[var(--text-muted)]">
              {formatDate(ev.startsAt)}{ev.venue ? ` · ${ev.venue}` : ""}
            </p>
            <div className="mt-2">
              <Badge variant="green" dot={false}>
                {ev.registered}{ev.capacity ? ` / ${ev.capacity}` : ""} registered
              </Badge>
            </div>
          </div>
          <span className="shrink-0 rounded-[var(--radius-md)] bg-[var(--primary-soft)] px-4 py-2 text-[13px] font-bold text-[var(--primary)] transition-colors group-hover:bg-[var(--primary)] group-hover:text-white">
            Register →
          </span>
        </div>
      </Link>
    </div>
  );
}

function EventCard({ ev }: { ev: PublicEventCard }) {
  const corner = cornerBadge(ev);
  return (
    <Link
      href={`/event/${ev.slug}`}
      className="group block overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1 hover:border-[var(--primary-ring)] hover:shadow-[var(--shadow-pop)]"
    >
      <div className="relative overflow-hidden" style={{ height: 132 }}>
        <div
          aria-hidden
          className="absolute inset-0 transition-transform duration-500 group-hover:scale-[1.08]"
          style={{ background: coverGradient(ev.coverGradient) }}
        />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(120px 90px at 78% 20%, rgba(255,255,255,.30), transparent 70%), repeating-linear-gradient(125deg, rgba(255,255,255,.08) 0 1px, transparent 1px 13px)",
          }}
        />
        {ev.category && (
          <span className="absolute left-3 top-3 rounded-full bg-black/30 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur">
            {ev.category}
          </span>
        )}
        {corner && (
          <span
            className="absolute right-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur"
            style={{ background: corner.bg }}
          >
            {corner.label}
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="truncate text-[15px] font-bold text-[var(--text-strong)]">{ev.title}</h3>
        <p className="mt-1 text-[12.5px] font-medium text-[var(--text-muted)]">
          {formatDate(ev.startsAt)}{ev.venue ? ` · ${ev.venue}` : ""}
        </p>
        <div className="mt-3 flex items-center justify-between">
          <Badge variant="green" dot={false}>
            {ev.registered}{ev.capacity ? ` / ${ev.capacity}` : ""} registered
          </Badge>
          <span className="text-[13px] font-bold text-[var(--primary)] group-hover:underline">Register →</span>
        </div>
      </div>
    </Link>
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
      aria-pressed={active}
      className={`rounded-full border px-4 py-2 text-[13px] font-bold transition-colors ${
        active
          ? "border-transparent bg-[var(--primary)] text-white shadow-[var(--shadow-sm)]"
          : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:border-[var(--primary-ring)] hover:text-[var(--text)]"
      }`}
    >
      {children}
    </button>
  );
}

function Field({
  label,
  icon,
  divider,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  divider?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`flex flex-col justify-center px-3 py-1.5 ${
        divider ? "sm:border-l sm:border-[var(--border)]" : ""
      }`}
    >
      <span className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-[var(--text-faint)]">{label}</span>
      <div className="mt-0.5 flex items-center gap-2">
        {icon && <span className="shrink-0 text-[var(--text-faint)]">{icon}</span>}
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}

function EmptyState({ text, action }: { text: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-10 text-center text-[14px] text-[var(--text-muted)] shadow-[var(--shadow-card)]">
      {text}
      {action}
    </div>
  );
}

type DateWindow = "any" | "week" | "month" | "upcoming";

function withinWindow(iso: string | undefined, window: DateWindow): boolean {
  if (window === "any") return true;
  if (!iso) return false;
  const when = new Date(iso).getTime();
  const now = Date.now();
  if (window === "upcoming") return when >= now;
  const span = window === "week" ? 7 : 30;
  const limit = now + span * 24 * 60 * 60 * 1000;
  return when >= now && when <= limit;
}

function cornerBadge(ev: PublicEventCard): { label: string; bg: string } | null {
  if (ev.capacity && ev.registered >= ev.capacity) return { label: "Full", bg: "rgba(31,34,44,.55)" };
  if (ev.capacity && ev.registered / ev.capacity >= 0.85) return { label: "Almost full", bg: "rgba(245,158,11,.85)" };
  if (ev.startsAt) {
    const days = (new Date(ev.startsAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000);
    if (days > 14) return { label: "Coming soon", bg: "rgba(99,102,241,.85)" };
  }
  return null;
}

function uniq(values: string[]): string[] {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
}

function formatDate(iso?: string): string {
  if (!iso) return "Date TBA";
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}
