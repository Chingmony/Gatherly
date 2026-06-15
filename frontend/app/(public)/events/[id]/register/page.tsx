"use client";

import { useState } from "react";
import {
  Calendar,
  MapPin,
  Check,
  ChevronRight,
  ChevronLeft,
  Moon,
  Sun,
  LayoutGrid,
  Ticket,
  User,
  Mail,
  Phone,
  Building2,
  CalendarDays,
} from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Segmented } from "@/components/ui/segmented";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTheme } from "@/components/theme-provider";

const EVENT = {
  id: "ev1",
  name: "NorthStar Tech Summit",
  category: "Conference",
  date: "Jun 24, 2026",
  time: "8:00 AM",
  location: "Pier 48, San Francisco",
  attendees: 1842,
  price: 25,
  description:
    "Join 1,842+ attendees for a day of keynotes, hands-on workshops and unmatched networking. Whether you're shipping your first product or scaling your tenth, NorthStar Tech Summit is where the community gathers.",
  tags: ["Keynotes", "Workshops", "Networking", "After-party"],
};

const TSHIRT_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const DIETARY = ["No preference", "Vegetarian", "Vegan", "Halal", "Gluten-free"];

const AGENDA = [
  { start: "08:00", end: "09:00", track: "Check-in", title: "Doors & Registration", color: "var(--primary-hex,#6366f1)" },
  { start: "09:00", end: "10:15", track: "Main Stage", title: "Opening Keynote", color: "var(--violet)" },
  { start: "10:30", end: "12:00", track: "Workshop", title: "Workshop Block A", color: "var(--blue)" },
  { start: "12:00", end: "13:00", track: "Break", title: "Lunch & Networking", color: "var(--green)" },
  { start: "13:30", end: "14:30", track: "Main Stage", title: "Panel — Scaling Teams", color: "var(--violet)" },
  { start: "15:00", end: "16:30", track: "Workshop", title: "Workshop Block B", color: "var(--blue)" },
  { start: "16:45", end: "17:30", track: "Main Stage", title: "Closing + Awards", color: "var(--violet)" },
  { start: "18:00", end: "20:00", track: "Social", title: "After-party", color: "var(--orange)" },
];

type FormState = {
  fullName: string;
  email: string;
  phone: string;
  tshirt: string;
  dietary: string;
  company: string;
};

const HERO_GRADIENT =
  "linear-gradient(135deg, #8b7bf8 0%, #6f5cf3 55%, #6a5cf0 100%)";

export default function RegisterPage() {
  const { theme, toggleTheme } = useTheme();
  const [tab, setTab] = useState("register");
  const [values, setValues] = useState<FormState>({
    fullName: "",
    email: "",
    phone: "",
    tshirt: "",
    dietary: "",
    company: "",
  });
  const [submitted, setSubmitted] = useState(false);

  function set<K extends keyof FormState>(k: K, v: string) {
    setValues((p) => ({ ...p, [k]: v }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      {/* ── Public header ── */}
      <header className="h-[60px] sm:h-[64px] flex items-center px-3 sm:px-8 gap-2 sm:gap-3">
        <Logo size={28} />
        <div className="flex-1" />
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-colors"
          style={{ background: "var(--surface)", border: "1px solid var(--border-hex,#ecedf4)", color: "var(--text-muted)" }}
        >
          {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
        </button>
        <Link
          href="/explore"
          aria-label="All events"
          className="h-9 w-9 sm:w-auto px-0 sm:px-3.5 rounded-full flex items-center justify-center gap-2 text-sm font-bold flex-shrink-0 transition-colors"
          style={{ background: "var(--surface)", border: "1px solid var(--border-hex,#ecedf4)", color: "var(--text)" }}
        >
          <LayoutGrid size={14} /> <span className="hidden sm:inline">All events</span>
        </Link>
        <Link
          href="/explore"
          aria-label="Back to app"
          className="h-9 w-9 sm:w-auto px-0 sm:px-3.5 rounded-full flex items-center justify-center gap-2 text-sm font-bold flex-shrink-0 transition-colors"
          style={{ background: "var(--surface)", border: "1px solid var(--border-hex,#ecedf4)", color: "var(--text)" }}
        >
          <ChevronLeft size={14} /> <span className="hidden sm:inline">Back to app</span>
        </Link>
      </header>

      <div className="max-w-[940px] mx-auto px-3 sm:px-6 pb-12 sm:pb-16">
        {/* ── Hero banner ── */}
        <section
          className="relative overflow-hidden rounded-[20px] sm:rounded-[26px] px-5 sm:px-9 py-6 sm:py-8"
          style={{ background: HERO_GRADIENT, boxShadow: "var(--shadow-glow)" }}
        >
          {/* watermark calendar */}
          <CalendarDays
            size={150}
            className="absolute -right-4 top-3 pointer-events-none hidden sm:block"
            style={{ color: "rgba(255,255,255,0.13)" }}
            strokeWidth={1.4}
          />

          <div className="relative flex flex-wrap items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-2 text-[12.5px] font-bold rounded-full pl-2.5 pr-3 py-1 bg-white/95 text-[var(--primary-700,#4338ca)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary-hex,#6366f1)]" />
              {EVENT.category}
              <span className="opacity-50">·</span>
              <span className="text-[var(--green-600,#16a34a)]">Registration open</span>
            </span>
          </div>

          <h1 className="relative text-white font-extrabold leading-tight text-[27px] sm:text-[40px] m-0">
            {EVENT.name}
          </h1>

          <div className="relative flex flex-wrap items-center gap-x-5 gap-y-1.5 mt-3 text-white/95 text-sm font-semibold">
            <span className="flex items-center gap-2">
              <Calendar size={15} /> {EVENT.date} · {EVENT.time}
            </span>
            <span className="flex items-center gap-2">
              <MapPin size={15} /> {EVENT.location}
            </span>
          </div>

          <p className="relative text-white/80 text-sm leading-relaxed mt-4 max-w-[560px]">
            {EVENT.description}
          </p>

          <div className="relative flex flex-wrap gap-2 mt-5">
            {EVENT.tags.map((t) => (
              <span
                key={t}
                className="text-[12.5px] font-bold text-white rounded-full px-3.5 py-1.5 bg-white/18"
                style={{ backdropFilter: "blur(4px)" }}
              >
                {t}
              </span>
            ))}
          </div>
        </section>

        {/* ── Tabs ── */}
        <div className="flex justify-center my-6">
          <Segmented
            className="w-[280px]"
            value={tab}
            onChange={setTab}
            options={[
              { id: "register", label: "Register" },
              { id: "schedule", label: "Schedule" },
            ]}
          />
        </div>

        {/* ── Tab content ── */}
        {tab === "register" ? (
          <RegisterView
            values={values}
            set={set}
            submitted={submitted}
            onSubmit={handleSubmit}
          />
        ) : (
          <ScheduleView />
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────── Register view ── */

function RegisterView({
  values,
  set,
  submitted,
  onSubmit,
}: {
  values: FormState;
  set: <K extends keyof FormState>(k: K, v: string) => void;
  submitted: boolean;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-5 items-start">
      {/* ── Ticket card ── */}
      <div
        className="rounded-[22px] border overflow-hidden"
        style={{ background: "var(--surface)", borderColor: "var(--border-hex,#ecedf4)", boxShadow: "var(--shadow-card)" }}
      >
        <div
          className="relative h-[88px] flex items-end px-5 pb-3.5"
          style={{ background: HERO_GRADIENT }}
        >
          <Ticket
            size={62}
            className="absolute right-3 top-3 pointer-events-none"
            style={{ color: "rgba(255,255,255,0.22)" }}
            strokeWidth={1.5}
          />
          <span className="text-white font-extrabold text-[15px]">Your ticket</span>
        </div>

        <div className="px-5 py-5 flex flex-col gap-3">
          <span className="text-[15px] font-extrabold" style={{ color: "var(--text-strong)" }}>
            {EVENT.name}
          </span>
          <div className="flex flex-col gap-1.5">
            <span className="flex items-center gap-2 text-[13px]" style={{ color: "var(--text-muted)" }}>
              <Calendar size={13} style={{ flexShrink: 0 }} /> {EVENT.date} · {EVENT.time}
            </span>
            <span className="flex items-center gap-2 text-[13px]" style={{ color: "var(--text-muted)" }}>
              <MapPin size={13} style={{ flexShrink: 0 }} /> {EVENT.location}
            </span>
          </div>

          <div className="border-t my-1" style={{ borderColor: "var(--border-hex,#ecedf4)" }} />

          {/* Pay pill */}
          <div className="flex justify-center">
            <span
              className="inline-flex items-center gap-1.5 text-[12.5px] font-bold rounded-full px-3 py-1.5"
              style={{ background: "var(--orange-soft)", color: "var(--orange)" }}
            >
              <Ticket size={13} /> Pay&nbsp;<b>${EVENT.price}</b>&nbsp;to attend
            </span>
          </div>

          {/* QR */}
          <div className="flex justify-center py-2">
            <QrMock />
          </div>

          <p className="text-[11.5px] text-center m-0" style={{ color: "var(--text-faint)" }}>
            Scan to pay, then complete the form.
          </p>
        </div>
      </div>

      {/* ── Form card ── */}
      <div
        className="rounded-[22px] border px-6 sm:px-7 py-6"
        style={{ background: "var(--surface)", borderColor: "var(--border-hex,#ecedf4)", boxShadow: "var(--shadow-card)" }}
      >
        {submitted ? (
          <SuccessPanel />
        ) : (
          <form onSubmit={onSubmit} className="flex flex-col gap-5">
            <div>
              <h2 className="text-[19px] font-extrabold m-0" style={{ color: "var(--text-strong)" }}>
                Get your ticket
              </h2>
              <p className="text-[13px] mt-1 m-0" style={{ color: "var(--text-muted)" }}>
                Fill in your details — it takes under a minute.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Full Name" required>
                <IconInput icon={<User size={15} />} placeholder="Jane Doe" value={values.fullName} onChange={(v) => set("fullName", v)} required />
              </Field>
              <Field label="Email Address" required>
                <IconInput icon={<Mail size={15} />} type="email" placeholder="jane@email.com" value={values.email} onChange={(v) => set("email", v)} required />
              </Field>
              <Field label="Phone Number" required>
                <IconInput icon={<Phone size={15} />} type="tel" placeholder="+1 (555) 000-0000" value={values.phone} onChange={(v) => set("phone", v)} required />
              </Field>
              <Field label="T-Shirt Size">
                <Select value={values.tshirt} onValueChange={(v) => set("tshirt", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select…" />
                  </SelectTrigger>
                  <SelectContent>
                    {TSHIRT_SIZES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Dietary Preference" required>
                <Select value={values.dietary} onValueChange={(v) => set("dietary", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select…" />
                  </SelectTrigger>
                  <SelectContent>
                    {DIETARY.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Company / Org">
                <IconInput icon={<Building2 size={15} />} placeholder="Where do you work?" value={values.company} onChange={(v) => set("company", v)} />
              </Field>
            </div>

            <Button type="submit" size="block" className="h-[50px]">
              <Ticket size={15} /> I&apos;ve paid — Complete Registration
            </Button>

            <p className="text-[12px] text-center m-0" style={{ color: "var(--text-faint)" }}>
              By registering you agree to the event terms. Your ticket QR is emailed instantly.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

function SuccessPanel() {
  return (
    <div className="flex flex-col items-center text-center gap-4 py-8">
      <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "var(--green-soft)" }}>
        <Check size={28} style={{ color: "var(--green-600)" }} />
      </div>
      <div>
        <h2 className="text-[22px] font-extrabold m-0" style={{ color: "var(--text-strong)" }}>
          You&apos;re registered!
        </h2>
        <p className="text-sm mt-1.5 m-0 max-w-[340px]" style={{ color: "var(--text-muted)" }}>
          Your ticket and QR code are on the way to your inbox. See you at {EVENT.name}.
        </p>
      </div>
      <Link href="/explore">
        <Button variant="ghost" size="sm">Explore more events</Button>
      </Link>
    </div>
  );
}

/* ─────────────────────────────────────────── Schedule view ── */

function ScheduleView() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-5 items-start">
      <CalendarCard />
      <div
        className="rounded-[22px] border px-6 py-6"
        style={{ background: "var(--surface)", borderColor: "var(--border-hex,#ecedf4)", boxShadow: "var(--shadow-card)" }}
      >
        <h2 className="text-[19px] font-extrabold m-0" style={{ color: "var(--primary-hex,#6366f1)" }}>
          Agenda
        </h2>
        <div className="inline-flex items-center gap-1.5 text-[13px] font-semibold mt-1.5 mb-4" style={{ color: "var(--text-muted)" }}>
          24 June <ChevronRight size={13} className="rotate-90" />
        </div>

        <div className="flex flex-col">
          {AGENDA.map((item, i) => (
            <div key={i} className="flex gap-4 group">
              {/* time column */}
              <div className="w-[52px] flex-shrink-0 pt-0.5 text-right">
                <div className="text-[14px] font-extrabold" style={{ color: "var(--primary-hex,#6366f1)" }}>
                  {item.start}
                </div>
                <div className="text-[11px]" style={{ color: "var(--text-faint)" }}>
                  {item.end}
                </div>
              </div>
              {/* bar */}
              <div className="flex-shrink-0 w-[3px] rounded-full my-1" style={{ background: item.color }} />
              {/* content */}
              <div className={`flex-1 pb-4 ${i < AGENDA.length - 1 ? "border-b" : ""}`} style={{ borderColor: "var(--border-hex,#ecedf4)" }}>
                <div className="text-[11.5px] font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                  {item.track}
                </div>
                <div className="text-[15px] font-bold mt-0.5" style={{ color: "var(--text-strong)" }}>
                  {item.title}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CalendarCard() {
  // June 2026 — June 1 is a Monday; highlight the 24th (event day).
  const EVENT_DAY = 24;
  const days = Array.from({ length: 30 }, (_, i) => i + 1);
  const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div
      className="rounded-[22px] border px-5 py-5"
      style={{ background: "var(--surface)", borderColor: "var(--border-hex,#ecedf4)", boxShadow: "var(--shadow-card)" }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-10 h-10 rounded-[var(--radius-md)] flex flex-col items-center justify-center leading-none"
          style={{ background: "var(--primary-soft)", color: "var(--primary-hex,#6366f1)" }}
        >
          <span className="text-[9px] font-bold uppercase">Jun</span>
          <span className="text-[15px] font-extrabold">{EVENT_DAY}</span>
        </div>
        <span className="text-[16px] font-extrabold flex-1" style={{ color: "var(--text-strong)" }}>
          June 2026
        </span>
        <button className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}>
          <ChevronLeft size={14} />
        </button>
        <button className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}>
          <ChevronRight size={14} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-y-2 text-center">
        {weekdays.map((d) => (
          <span key={d} className="text-[11px] font-bold" style={{ color: "var(--text-faint)" }}>
            {d}
          </span>
        ))}
        {days.map((day) => {
          const isEvent = day === EVENT_DAY;
          return (
            <div key={day} className="flex items-center justify-center">
              <span
                className="w-8 h-8 flex items-center justify-center rounded-full text-[13px] font-semibold transition-colors"
                style={
                  isEvent
                    ? { background: "var(--orange)", color: "#fff", fontWeight: 800, boxShadow: "0 4px 12px rgba(245,158,11,0.4)" }
                    : { color: "var(--text)" }
                }
              >
                {day}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-center gap-2 mt-5 pt-4 border-t" style={{ borderColor: "var(--border-hex,#ecedf4)" }}>
        <span className="w-2 h-2 rounded-full" style={{ background: "var(--orange)" }} />
        <span className="text-[12.5px] font-semibold" style={{ color: "var(--text-muted)" }}>
          Event day
        </span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────── Shared bits ── */

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>
        {label}
        {required && <span style={{ color: "var(--danger)" }}> *</span>}
      </Label>
      {children}
    </div>
  );
}

function IconInput({
  icon,
  value,
  onChange,
  ...rest
}: {
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value">) {
  return (
    <div className="relative">
      <span
        className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: "var(--text-faint)" }}
      >
        {icon}
      </span>
      <Input className="pl-9" value={value} onChange={(e) => onChange(e.target.value)} {...rest} />
    </div>
  );
}

function QrMock() {
  return (
    <div
      className="w-[148px] h-[148px] rounded-xl flex items-center justify-center"
      style={{ background: "#fff", boxShadow: "var(--shadow-sm)", border: "1px solid var(--border-hex,#ecedf4)" }}
    >
      <svg width="120" height="120" viewBox="0 0 164 164" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="0" y="0" width="50" height="50" rx="6" fill="#11142a" />
        <rect x="8" y="8" width="34" height="34" rx="3" fill="white" />
        <rect x="14" y="14" width="22" height="22" rx="2" fill="#11142a" />
        <rect x="114" y="0" width="50" height="50" rx="6" fill="#11142a" />
        <rect x="122" y="8" width="34" height="34" rx="3" fill="white" />
        <rect x="128" y="14" width="22" height="22" rx="2" fill="#11142a" />
        <rect x="0" y="114" width="50" height="50" rx="6" fill="#11142a" />
        <rect x="8" y="122" width="34" height="34" rx="3" fill="white" />
        <rect x="14" y="128" width="22" height="22" rx="2" fill="#11142a" />
        {[60, 74, 88, 102, 116].map((x, xi) =>
          [60, 74, 88, 102, 116].map((y, yi) =>
            (xi + yi) % 2 === 0 ? <rect key={`${x}-${y}`} x={x} y={y} width="10" height="10" fill="#11142a" /> : null
          )
        )}
        {[60, 74, 88].map((x) => (
          <rect key={`b-${x}`} x={x} y={120} width="8" height="8" fill="#11142a" />
        ))}
      </svg>
    </div>
  );
}
