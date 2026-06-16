"use client";

import Link from "next/link";
import type { EventStatus } from "@/lib/api/events";

// Footer / overlay accent — a single calm teal so the card reads as one piece
// regardless of the cover image's colours. Literal hex is allowed here because
// it only ever appears inside gradients/overlays (per the handler design doc).
const TEAL = "#2f6e7e";
const FALLBACK_COVER = "linear-gradient(160deg, #5aa6b3, #2f6e7e)";

// Status → presentation. Active (Public) on top, Archived sinks to the bottom.
export const STATUS_META: Record<EventStatus, { label: string; color: string; rank: number }> = {
  PUBLIC:   { label: "Public",   color: "var(--green-600)", rank: 0 },
  DRAFT:    { label: "Draft",    color: "var(--text-muted)", rank: 1 },
  ARCHIVED: { label: "Archived", color: "var(--orange)",     rank: 2 },
};

/** Minimal shape the card needs — satisfied by both `AdminEvent` and `EventResponse`. */
export interface EventCardData {
  title: string;
  coverImageUrl?: string | null;
  startsAt: string | null;
  venue: string | null;
  status: EventStatus;
}

interface DateParts { month: string; day: string; weekday: string; time: string; tz: string }

function dateParts(iso: string | null): DateParts | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const tz = new Intl.DateTimeFormat("en-US", { timeZoneName: "short" })
    .formatToParts(d)
    .find((p) => p.type === "timeZoneName")?.value ?? "";
  return {
    month:   d.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
    day:     d.toLocaleDateString("en-US", { day: "2-digit" }),
    weekday: d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase(),
    time:    d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
    tz,
  };
}

/** First comma-segment is the venue name; the remainder is the address. */
function splitVenue(venue: string | null): { name: string; address: string } {
  if (!venue || !venue.trim()) return { name: "Venue TBD", address: "" };
  const parts = venue.split(",").map((s) => s.trim()).filter(Boolean);
  return { name: parts[0], address: parts.slice(1).join(", ") };
}

/**
 * The handler event card — a 240px vertical card: cover image with the title
 * overlaid bottom-left over an image→teal gradient, a status pill top-right, and
 * a teal footer (date chip · venue · time/timezone). Shared by the handler events
 * list (`/events`) and the scanner picker (`/scanner`); the only difference is
 * where tapping it goes, via `href`.
 */
export function HandlerEventCard({ event, href }: { event: EventCardData; href: string }) {
  const st = STATUS_META[event.status];
  const dp = dateParts(event.startsAt);
  const venue = splitVenue(event.venue);

  return (
    <Link
      href={href}
      className="group flex flex-col w-full sm:w-[240px] rounded-[24px] overflow-hidden border transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-pop)]"
      style={{ background: TEAL, borderColor: "var(--border-hex,#ecedf4)" }}
    >
      {/* Cover + title overlay — fixed tall banner for a vertical card */}
      <div className="relative h-[210px]">
        <div
          className="absolute inset-0 transition-transform duration-300 group-hover:scale-[1.03]"
          style={
            event.coverImageUrl
              ? { backgroundImage: `url(${event.coverImageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
              : { background: FALLBACK_COVER }
          }
        />
        {/* Fade image → teal footer */}
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(180deg, rgba(18,48,58,0) 28%, rgba(28,72,84,.55) 64%, ${TEAL} 100%)` }}
        />
        {/* Status pill */}
        <span
          className="absolute top-3 right-3 inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full"
          style={{ background: "rgba(255,255,255,.92)", color: st.color }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: st.color }} />
          {st.label}
        </span>
        {/* Title */}
        <h3
          className="absolute left-5 right-5 bottom-4 text-white text-[24px] font-extrabold leading-[1.1] tracking-tight m-0"
          style={{ textShadow: "0 2px 14px rgba(0,0,0,.35)" }}
        >
          {event.title}
        </h3>
      </div>

      {/* Footer: date chip · venue · time */}
      <div className="flex items-center gap-3 px-4 py-3">
        {dp && (
          <div className="flex flex-col items-center justify-center rounded-[10px] bg-white px-2.5 py-1.5 min-w-[46px] leading-none flex-shrink-0">
            <span className="text-[10px] font-bold tracking-wide" style={{ color: TEAL }}>{dp.month}</span>
            <span className="text-[18px] font-extrabold" style={{ color: "#1f2937" }}>{dp.day}</span>
            <span className="text-[9px] font-bold tracking-wide" style={{ color: "#9aa3ad" }}>{dp.weekday}</span>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white truncate m-0">{venue.name}</p>
          {venue.address && (
            <p className="text-xs line-clamp-2 m-0 leading-snug" style={{ color: "rgba(255,255,255,.72)" }}>
              {venue.address}
            </p>
          )}
        </div>

        {dp && (
          <div className="text-right flex-shrink-0">
            <p className="text-sm font-bold text-white m-0">{dp.time}</p>
            <p className="text-xs m-0" style={{ color: "rgba(255,255,255,.72)" }}>{dp.tz}</p>
          </div>
        )}
      </div>
    </Link>
  );
}
