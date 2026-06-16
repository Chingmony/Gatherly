"use client";

import * as React from "react";
import { coverGradient } from "@/lib/covers";
import type { AgendaItemResponse, PublicEventDetail, PublicFormResponse } from "@/lib/api/types";
import { Reveal } from "@/components/motion/reveal";
import { PublicRegisterForm } from "./register-form";

type Tab = "register" | "schedule";

/**
 * Guest event detail (design GuestEventDetail): a cover hero with tags, then a Register / Schedule
 * tab switcher. Register pairs a "your ticket" preview with the dynamic form (or a closed state);
 * Schedule shows a month calendar + the agenda timeline. Payment is out of v1 scope (docs/00) —
 * registration is free and the QR is emailed on success.
 */
export function EventDetail({ detail, form }: { detail: PublicEventDetail; form: PublicFormResponse | null }) {
  const [tab, setTab] = React.useState<Tab>("register");
  const canRegister = detail.registrationOpen && !!form;

  return (
    <>
      <Reveal>
        <Hero detail={detail} />
      </Reveal>

      <Reveal delay={0.05}>
        <div className="mt-6 flex justify-center">
          <div role="tablist" aria-label="Event sections" className="inline-flex gap-1 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-1 shadow-[var(--shadow-card)]">
            <TabButton active={tab === "register"} onClick={() => setTab("register")} icon={<TicketIcon />}>Register</TabButton>
            <TabButton active={tab === "schedule"} onClick={() => setTab("schedule")} icon={<CalendarIcon />}>Schedule</TabButton>
          </div>
        </div>
      </Reveal>

      <div className="mt-6">
        {tab === "register" ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-[300px_1fr]">
            <TicketPreview detail={detail} canRegister={canRegister} />
            {canRegister && form ? (
              <PublicRegisterForm eventId={detail.id} title={form.formTitle} schema={form.schema} />
            ) : (
              <ClosedCard />
            )}
          </div>
        ) : (
          <ScheduleTab detail={detail} />
        )}
      </div>
    </>
  );
}

// ---- Hero ------------------------------------------------------------------

function Hero({ detail }: { detail: PublicEventDetail }) {
  return (
    <section
      className="relative mt-3 overflow-hidden rounded-[var(--radius-xl)] p-7 text-white sm:p-10"
      style={{ minHeight: 260, background: coverGradient(detail.coverGradient) }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(420px 240px at 88% -10%, rgba(255,255,255,.22), transparent 70%), linear-gradient(180deg, rgba(13,10,40,.08) 0%, rgba(13,10,40,.42) 100%)",
        }}
      />
      <div className="relative">
        <div className="flex flex-wrap items-center gap-2">
          {detail.category && (
            <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold backdrop-blur">{detail.category}</span>
          )}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold backdrop-blur">
            <span className="h-[7px] w-[7px] rounded-full" style={{ background: detail.registrationOpen ? "#4ade80" : "#fca5a5" }} />
            {detail.registrationOpen ? "Registration open" : "Registration closed"}
          </span>
        </div>

        <h1 className="mt-3 max-w-2xl text-[30px] font-extrabold leading-[1.06] tracking-[-0.02em] sm:text-[40px]">{detail.title}</h1>

        <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-[13.5px] font-semibold text-white/90">
          {detail.startsAt && (
            <span className="inline-flex items-center gap-1.5"><CalendarIcon />{formatDateTime(detail.startsAt)}</span>
          )}
          {detail.venue && (
            <span className="inline-flex items-center gap-1.5"><PinIcon />{detail.venue}</span>
          )}
        </div>

        {detail.description && (
          <p className="mt-3 max-w-2xl text-[14px] font-medium leading-relaxed text-white/85">{detail.description}</p>
        )}

        {detail.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {detail.tags.map((t) => (
              <span key={t} className="rounded-full bg-white/12 px-3 py-1.5 text-[12px] font-bold backdrop-blur">{t}</span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ---- Register tab ----------------------------------------------------------

function TicketPreview({ detail, canRegister }: { detail: PublicEventDetail; canRegister: boolean }) {
  return (
    <div className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)]">
      <div className="relative p-5 text-white" style={{ background: coverGradient(detail.coverGradient) }}>
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(13,10,40,.05), rgba(13,10,40,.32))" }} />
        <div className="relative flex items-start justify-between">
          <span className="text-[12px] font-bold uppercase tracking-[0.12em] text-white/80">Your ticket</span>
          <TicketIcon className="opacity-70" />
        </div>
      </div>
      <div className="p-5">
        <h3 className="text-[15px] font-extrabold text-[var(--text-strong)]">{detail.title}</h3>
        <div className="mt-1.5 space-y-1 text-[12.5px] font-medium text-[var(--text-muted)]">
          {detail.startsAt && <p className="flex items-center gap-1.5"><CalendarIcon />{formatDateTime(detail.startsAt)}</p>}
          {detail.venue && <p className="flex items-center gap-1.5"><PinIcon />{detail.venue}</p>}
        </div>

        {/* QR is minted + emailed after registration — this is a placeholder before then. */}
        <div className="mt-4 grid place-items-center rounded-[var(--radius-lg)] border border-dashed border-[var(--border-strong)] bg-[var(--surface-2)] p-6">
          <QrGlyph />
          <p className="mt-2 text-center text-[11.5px] font-medium text-[var(--text-faint)]">
            {canRegister ? "Register to get your unique QR ticket" : "Registration is closed"}
          </p>
        </div>
        <p className="mt-3 text-center text-[11.5px] text-[var(--text-faint)]">Your QR ticket is emailed instantly — free to attend.</p>
      </div>
    </div>
  );
}

function ClosedCard() {
  return (
    <div className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-8 text-center shadow-[var(--shadow-card)]">
      <h2 className="text-[16px] font-bold text-[var(--text-strong)]">Registration isn’t open</h2>
      <p className="mt-1 text-[13px] text-[var(--text-muted)]">This event isn’t accepting registrations right now.</p>
    </div>
  );
}

// ---- Schedule tab ----------------------------------------------------------

function ScheduleTab({ detail }: { detail: PublicEventDetail }) {
  if (detail.agenda.length === 0 && !detail.startsAt) {
    return (
      <div className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-8 text-center text-[14px] text-[var(--text-muted)] shadow-[var(--shadow-card)]">
        No agenda has been published for this event yet.
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-[320px_1fr]">
      <Calendar startsAt={detail.startsAt} />
      <AgendaTimeline items={detail.agenda} startsAt={detail.startsAt} />
    </div>
  );
}

function Calendar({ startsAt }: { startsAt?: string }) {
  const eventDate = startsAt ? new Date(startsAt) : null;
  const [view, setView] = React.useState(() => {
    const d = eventDate ?? new Date();
    return { y: d.getFullYear(), m: d.getMonth() };
  });

  const first = new Date(view.y, view.m, 1);
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const lead = (first.getDay() + 6) % 7; // Monday-first offset
  const cells: (number | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  const isEventDay = (day: number) =>
    eventDate != null && eventDate.getFullYear() === view.y && eventDate.getMonth() === view.m && eventDate.getDate() === day;

  return (
    <div className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {eventDate && (
            <span className="grid h-10 w-10 place-items-center rounded-[var(--radius-md)] bg-[var(--primary-soft)] text-center leading-none text-[var(--primary)]">
              <span className="text-[8px] font-extrabold uppercase">{eventDate.toLocaleDateString(undefined, { month: "short" })}</span>
              <span className="text-[14px] font-extrabold">{eventDate.getDate()}</span>
            </span>
          )}
          <span className="text-[15px] font-extrabold text-[var(--text-strong)]">
            {new Date(view.y, view.m, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
          </span>
        </div>
        <div className="flex gap-1">
          <CalNav label="Previous month" onClick={() => setView((v) => shiftMonth(v, -1))}>‹</CalNav>
          <CalNav label="Next month" onClick={() => setView((v) => shiftMonth(v, 1))}>›</CalNav>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-y-2 text-center">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <span key={d} className="text-[11px] font-bold text-[var(--text-faint)]">{d}</span>
        ))}
        {cells.map((day, i) => (
          <div key={i} className="grid place-items-center">
            {day == null ? (
              <span />
            ) : isEventDay(day) ? (
              <span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--orange)] text-[13px] font-extrabold text-white shadow-[var(--shadow-glow)]">{day}</span>
            ) : (
              <span className="grid h-8 w-8 place-items-center text-[13px] font-semibold text-[var(--text)]">{day}</span>
            )}
          </div>
        ))}
      </div>

      {eventDate && (
        <div className="mt-4 flex items-center justify-center gap-2 border-t border-[var(--border)] pt-3 text-[12px] font-semibold text-[var(--text-muted)]">
          <span className="h-[7px] w-[7px] rounded-full bg-[var(--orange)]" /> Event day
        </div>
      )}
    </div>
  );
}

function AgendaTimeline({ items, startsAt }: { items: AgendaItemResponse[]; startsAt?: string }) {
  if (items.length === 0) {
    return (
      <div className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-8 text-center text-[14px] text-[var(--text-muted)] shadow-[var(--shadow-card)]">
        No agenda has been published yet.
      </div>
    );
  }
  return (
    <div className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)]">
      <h2 className="text-[18px] font-extrabold text-[var(--primary)]">Agenda</h2>
      {startsAt && (
        <p className="mt-1 text-[13px] font-semibold text-[var(--text-muted)]">
          {new Date(startsAt).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}
        </p>
      )}
      <ol className="mt-4 space-y-3.5">
        {items.map((item) => {
          // Prefer the organizer-set section; fall back to deriving a track from the title.
          const section = item.section?.trim();
          const track = section ? { label: section, color: trackOf(section).color } : trackOf(item.title);
          return (
            <li key={item.id} className="flex gap-3.5">
              <div className="w-[52px] shrink-0 text-right">
                <p className="text-[13px] font-extrabold text-[var(--primary)]">{item.startsAt ? formatTime(item.startsAt) : "—"}</p>
                {item.endsAt && <p className="text-[11.5px] font-semibold text-[var(--text-faint)]">{formatTime(item.endsAt)}</p>}
              </div>
              <span className="mt-0.5 w-[3px] shrink-0 rounded-full" style={{ background: track.color }} aria-hidden />
              <div className="min-w-0 pb-0.5">
                <p className="text-[11.5px] font-bold uppercase tracking-[0.06em]" style={{ color: track.color }}>{track.label}</p>
                <p className="text-[14.5px] font-bold text-[var(--text-strong)]">{item.title}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ---- Small UI bits ---------------------------------------------------------

function TabButton({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-[var(--radius-md)] px-4 py-2 text-[13px] font-bold transition-colors ${
        active ? "bg-[var(--surface-2)] text-[var(--primary)] shadow-[var(--shadow-sm)]" : "text-[var(--text-muted)] hover:text-[var(--text)]"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function CalNav({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid h-8 w-8 place-items-center rounded-full border border-[var(--border)] text-[16px] font-bold text-[var(--text-muted)] transition-colors hover:border-[var(--primary-ring)] hover:text-[var(--primary)]"
    >
      {children}
    </button>
  );
}

function CalendarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="5" width="18" height="16" rx="2.5" stroke="currentColor" strokeWidth="2" />
      <path d="M3 9h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function PinIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
function TicketIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h13A1.5 1.5 0 0 1 20 8.5v2a2 2 0 0 0 0 4v2A1.5 1.5 0 0 1 18.5 18h-13A1.5 1.5 0 0 1 4 16.5v-2a2 2 0 0 0 0-4v-2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}
function QrGlyph() {
  return (
    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" aria-hidden className="text-[var(--text-faint)]">
      <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M14 14h3v3M21 14v7M17 21h-3M21 18h-1.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

// ---- Helpers ---------------------------------------------------------------

type Track = { label: string; color: string };

/** Infer a track label + colour from the agenda title (no track column exists server-side). */
function trackOf(title: string): Track {
  const t = title.toLowerCase();
  if (/(check-?in|registration|doors|arrival)/.test(t)) return { label: "Check-in", color: "var(--text-muted)" };
  if (/(lunch|break|coffee|refreshment)/.test(t)) return { label: "Break", color: "var(--green-600)" };
  if (/(workshop|lab|breakout|hands-on)/.test(t)) return { label: "Workshop", color: "var(--violet)" };
  if (/(party|social|after|networking|mixer|reception)/.test(t)) return { label: "Social", color: "var(--orange)" };
  if (/(keynote|stage|panel|opening|closing|award|talk|session)/.test(t)) return { label: "Main Stage", color: "var(--primary)" };
  return { label: "Session", color: "var(--blue)" };
}

function shiftMonth(v: { y: number; m: number }, by: number): { y: number; m: number } {
  const d = new Date(v.y, v.m + by, 1);
  return { y: d.getFullYear(), m: d.getMonth() };
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: false });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });
}
