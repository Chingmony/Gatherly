"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Calendar,
  CalendarDays,
  MapPin,
  Ticket,
  Check,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  User,
  Mail,
  Phone,
  Building2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApiError } from "@/lib/api/client";
import {
  getPublicEvent,
  getPublicEventForm,
  registerForEvent,
  type PublicEvent,
  type PublicForm,
  type PublicFormField,
  type RegistrationResult,
} from "@/lib/api/events";

/* ─────────────────────────── helpers ─────────────────────────── */
const COVER_THEMES: Record<string, { from: string; to: string }> = {
  violet: { from: "#6366f1", to: "#8b5cf6" },
  blue: { from: "#3b82f6", to: "#6366f1" },
  teal: { from: "#14b8a6", to: "#06b6d4" },
  green: { from: "#22c55e", to: "#16a34a" },
  orange: { from: "#f59e0b", to: "#f97316" },
  amber: { from: "#f97316", to: "#ec4899" },
  pink: { from: "#f43f5e", to: "#f59e0b" },
};

function heroGradientFor(coverColor: string | null): string {
  let from = "#6366f1";
  let to = "#8b5cf6";
  if (coverColor) {
    if (coverColor.startsWith("#")) {
      from = coverColor;
      to = coverColor;
    } else if (COVER_THEMES[coverColor]) {
      ({ from, to } = COVER_THEMES[coverColor]);
    }
  }
  return `linear-gradient(120deg, ${from} 0%, #7c5cf0 55%, ${to} 100%)`;
}

function fmtDate(iso: string | null) {
  if (!iso) return "Date TBA";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Date TBA";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function fmtTime(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

type View = "register" | "schedule";
type FormMode = "loading" | "ready" | "no_form" | "error";

export default function RegisterPage() {
  const params = useParams<{ id: string }>();
  const slug = params?.id ?? "";

  const [event, setEvent] = useState<PublicEvent | null>(null);
  const [load, setLoad] = useState<"loading" | "ready" | "notfound" | "error">("loading");
  const [form, setForm] = useState<PublicForm | null>(null);
  const [formMode, setFormMode] = useState<FormMode>("loading");

  const [view, setView] = useState<View>("register");
  const [result, setResult] = useState<RegistrationResult | null>(null);

  useEffect(() => {
    if (!slug) return;
    const controller = new AbortController();
    setLoad("loading");
    setFormMode("loading");

    getPublicEvent(slug, controller.signal)
      .then((ev) => {
        setEvent(ev);
        setLoad("ready");
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setLoad(err instanceof ApiError && err.status === 404 ? "notfound" : "error");
      });

    getPublicEventForm(slug, controller.signal)
      .then((f) => {
        setForm(f);
        setFormMode("ready");
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setFormMode(err instanceof ApiError && err.code === "NO_ACTIVE_FORM" ? "no_form" : "error");
      });

    return () => controller.abort();
  }, [slug]);

  if (load === "loading") {
    return (
      <Shell>
        <div className="flex flex-col items-center justify-center gap-3 py-32" style={{ color: "var(--text-muted)" }}>
          <Loader2 size={28} className="animate-spin" />
          <span className="text-sm font-semibold">Loading event…</span>
        </div>
      </Shell>
    );
  }

  if (load === "notfound" || load === "error" || !event) {
    return (
      <Shell>
        <div className="flex flex-col items-center justify-center gap-3 py-28 text-center">
          <AlertCircle size={32} style={{ color: load === "notfound" ? "var(--text-faint)" : "var(--danger)" }} />
          <div className="flex flex-col gap-1">
            <p className="text-base font-extrabold m-0" style={{ color: "var(--text-strong)" }}>
              {load === "notfound" ? "Event not found" : "Couldn't load this event"}
            </p>
            <p className="text-sm m-0" style={{ color: "var(--text-muted)" }}>
              {load === "notfound"
                ? "This event may be unpublished or no longer available."
                : "Please check your connection and try again."}
            </p>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/explore"><LayoutGrid size={15} /> Browse events</Link>
          </Button>
        </div>
      </Shell>
    );
  }

  if (result) return <SuccessScreen event={event} result={result} />;

  const heroGradient = heroGradientFor(event.coverColor);
  const dateLine = [fmtDate(event.startsAt), fmtTime(event.startsAt)].filter(Boolean).join(" · ");

  return (
    <Shell>
      <div className="flex flex-col gap-6">
        {/* Hero */}
        <div
          className="relative overflow-hidden rounded-[var(--radius-xl)] px-7 py-7 md:px-10 md:py-9"
          style={{ background: heroGradient, boxShadow: "var(--shadow-glow)" }}
        >
          <Calendar size={150} className="absolute -right-4 top-4 pointer-events-none" style={{ color: "rgba(255,255,255,0.14)" }} aria-hidden="true" />
          <div className="relative flex flex-col gap-3 max-w-2xl">
            <span
              className="inline-flex items-center gap-1.5 self-start text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm"
              style={{ background: "rgba(255,255,255,0.2)", color: "#fff" }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#fff" }} />
              {event.category ? `${event.category} · ` : ""}Registration open
            </span>
            <h1 className="text-[30px] md:text-[36px] font-extrabold leading-[1.05] m-0" style={{ color: "#fff" }}>
              {event.title}
            </h1>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm font-semibold" style={{ color: "rgba(255,255,255,0.92)" }}>
              <span className="inline-flex items-center gap-1.5">
                <Calendar size={14} /> {dateLine}
              </span>
              {event.venue && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={14} /> {event.venue}
                </span>
              )}
            </div>
            {event.description && (
              <p className="text-[14px] leading-relaxed m-0 max-w-xl" style={{ color: "rgba(255,255,255,0.82)" }}>
                {event.description}
              </p>
            )}
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex justify-center">
          <div
            className="inline-flex items-center gap-1 p-1 rounded-[var(--radius-md)] border"
            style={{ background: "var(--surface)", borderColor: "var(--border-hex,#ecedf4)", boxShadow: "var(--shadow-card)" }}
          >
            <TabButton active={view === "register"} onClick={() => setView("register")} icon={<Ticket size={15} />}>
              Register
            </TabButton>
            <TabButton active={view === "schedule"} onClick={() => setView("schedule")} icon={<CalendarDays size={15} />}>
              Schedule
            </TabButton>
          </div>
        </div>

        {/* Content */}
        {view === "register" ? (
          <div className="grid grid-cols-1 md:grid-cols-[330px_1fr] gap-6 items-start">
            <TicketCard event={event} heroGradient={heroGradient} dateLine={dateLine} />
            {formMode === "loading" ? (
              <Panel><CenterNote icon={<Loader2 size={24} className="animate-spin" />} title="Loading registration form…" /></Panel>
            ) : formMode === "ready" && form ? (
              <RegistrationForm event={event} form={form} onSuccess={setResult} />
            ) : formMode === "no_form" ? (
              <Panel>
                <CenterNote
                  icon={<CalendarDays size={24} />}
                  title="Registration isn't open yet"
                  sub="This event doesn't have an active registration form. Please check back soon."
                />
              </Panel>
            ) : (
              <Panel>
                <CenterNote
                  icon={<AlertCircle size={24} style={{ color: "var(--danger)" }} />}
                  title="Couldn't load the form"
                  sub="Something went wrong fetching the registration form."
                />
              </Panel>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-[330px_1fr] gap-6 items-start">
            <CalendarCard startsAt={event.startsAt} />
            <AgendaCard />
          </div>
        )}
      </div>
    </Shell>
  );
}

/* ─────────────────────────── Shell / small bits ─────────────────────────── */
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <header className="flex items-center px-6 md:px-10 h-[68px] gap-3">
        <Logo size={28} />
        <div className="flex-1" />
        <ThemeToggle />
        <Button asChild variant="ghost" size="sm">
          <Link href="/explore"><LayoutGrid size={15} /> All events</Link>
        </Button>
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard"><ChevronLeft size={15} /> Back to app</Link>
        </Button>
      </header>
      <div className="max-w-[940px] mx-auto px-4 sm:px-6 pb-16">{children}</div>
    </div>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-[var(--radius-xl)] border p-6"
      style={{ background: "var(--surface)", borderColor: "var(--border-hex,#ecedf4)", boxShadow: "var(--shadow-card)" }}
    >
      {children}
    </div>
  );
}

function CenterNote({ icon, title, sub }: { icon: React.ReactNode; title: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2.5 py-16 text-center" style={{ color: "var(--text-muted)" }}>
      <span style={{ color: "var(--text-faint)" }}>{icon}</span>
      <p className="text-sm font-bold m-0" style={{ color: "var(--text-strong)" }}>{title}</p>
      {sub && <p className="text-xs m-0 max-w-xs" style={{ color: "var(--text-muted)" }}>{sub}</p>}
    </div>
  );
}

function TabButton({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 px-4 h-[34px] rounded-[var(--radius-sm)] text-sm font-bold transition-all cursor-pointer"
      style={{ background: active ? "var(--primary-soft)" : "transparent", color: active ? "var(--primary-hex,#6366f1)" : "var(--text-muted)" }}
    >
      {icon}
      {children}
    </button>
  );
}

/* ─────────────────────────── Ticket card ─────────────────────────── */
function TicketCard({ event, heroGradient, dateLine }: { event: PublicEvent; heroGradient: string; dateLine: string }) {
  const qr = useMemo(() => makeQrMatrix(event.id + event.title, 25), [event.id, event.title]);
  return (
    <div
      className="rounded-[var(--radius-xl)] border overflow-hidden md:sticky md:top-6"
      style={{ background: "var(--surface)", borderColor: "var(--border-hex,#ecedf4)", boxShadow: "var(--shadow-card)" }}
    >
      <div className="relative h-24 flex items-end p-4" style={{ background: heroGradient }}>
        <Ticket size={64} className="absolute right-3 top-3" style={{ color: "rgba(255,255,255,0.22)" }} aria-hidden="true" />
        <span className="text-white font-extrabold text-base">Your ticket</span>
      </div>

      <div className="p-5 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="text-[15px] font-extrabold" style={{ color: "var(--text-strong)" }}>{event.title}</span>
          <span className="inline-flex items-center gap-1.5 text-[13px]" style={{ color: "var(--text-muted)" }}>
            <Calendar size={12} /> {dateLine}
          </span>
          {event.venue && (
            <span className="inline-flex items-center gap-1.5 text-[13px]" style={{ color: "var(--text-muted)" }}>
              <MapPin size={12} /> {event.venue}
            </span>
          )}
        </div>

        <div className="border-t" style={{ borderColor: "var(--border-hex,#ecedf4)" }} />

        <div className="flex flex-col items-center gap-3">
          <div className="p-3 rounded-[var(--radius-md)]" style={{ background: "#fff", boxShadow: "var(--shadow-sm)" }}>
            <QrCode matrix={qr} size={150} />
          </div>
          <span className="text-xs text-center" style={{ color: "var(--text-faint)" }}>
            Your personal QR ticket is emailed once you register.
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── Registration form (dynamic) ─────────────────────────── */
const FULL_WIDTH_TYPES = new Set<PublicFormField["type"]>(["textarea", "multiselect", "checkbox"]);

function fieldIcon(f: PublicFormField): React.ReactNode {
  if (f.type === "email") return <Mail size={15} />;
  if (f.type === "phone") return <Phone size={15} />;
  const k = f.key.toLowerCase();
  if (k.includes("name")) return <User size={15} />;
  if (k.includes("company") || k.includes("org")) return <Building2 size={15} />;
  return null;
}

function inputType(f: PublicFormField): string {
  switch (f.type) {
    case "email": return "email";
    case "phone": return "tel";
    case "number": return "number";
    case "date": return "date";
    default: return "text";
  }
}

function RegistrationForm({
  event,
  form,
  onSuccess,
}: {
  event: PublicEvent;
  form: PublicForm;
  onSuccess: (r: RegistrationResult) => void;
}) {
  const fields = useMemo(() => [...form.fields].sort((a, b) => a.order - b.order), [form.fields]);

  const [text, setText] = useState<Record<string, string>>({});
  const [multi, setMulti] = useState<Record<string, string[]>>({});
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);

  const toggleMulti = (key: string, opt: string) =>
    setMulti((p) => {
      const cur = p[key] ?? [];
      return { ...p, [key]: cur.includes(opt) ? cur.filter((o) => o !== opt) : [...cur, opt] };
    });

  function buildAnswers(): Record<string, unknown> {
    const answers: Record<string, unknown> = {};
    for (const f of fields) {
      if (f.type === "multiselect") {
        const arr = multi[f.key] ?? [];
        if (arr.length) answers[f.key] = arr;
      } else if (f.type === "checkbox") {
        answers[f.key] = !!checks[f.key];
      } else if (f.type === "number") {
        const v = (text[f.key] ?? "").trim();
        if (v !== "") answers[f.key] = Number(v);
      } else {
        const v = (text[f.key] ?? "").trim();
        if (v !== "") answers[f.key] = v;
      }
    }
    return answers;
  }

  function missingRequired(): boolean {
    return fields.some((f) => {
      if (!f.required) return false;
      if (f.type === "multiselect") return (multi[f.key] ?? []).length === 0;
      if (f.type === "checkbox") return !checks[f.key];
      return (text[f.key] ?? "").trim() === "";
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors([]);
    if (missingRequired()) {
      setError("Please fill in all required fields.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await registerForEvent(event.id, buildAnswers());
      onSuccess(res);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || "Registration failed. Please review your details.");
        setFieldErrors(err.fieldErrors.map((fe) => fe.message).filter(Boolean));
      } else {
        setError("Something went wrong. Please try again.");
      }
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[var(--radius-xl)] border p-6 flex flex-col gap-5"
      style={{ background: "var(--surface)", borderColor: "var(--border-hex,#ecedf4)", boxShadow: "var(--shadow-card)" }}
    >
      <div className="flex flex-col gap-0.5">
        <h2 className="text-[19px] font-extrabold m-0" style={{ color: "var(--text-strong)" }}>Get your ticket</h2>
        <p className="text-[13px] m-0" style={{ color: "var(--text-muted)" }}>Fill in your details — it takes under a minute.</p>
      </div>

      {error && (
        <div
          className="flex flex-col gap-1 rounded-[var(--radius-md)] border px-3.5 py-3"
          style={{ background: "var(--danger-soft)", borderColor: "var(--danger)" }}
          role="alert"
        >
          <span className="inline-flex items-center gap-2 text-sm font-bold" style={{ color: "var(--danger)" }}>
            <AlertCircle size={15} /> {error}
          </span>
          {fieldErrors.length > 0 && (
            <ul className="list-disc pl-8 m-0 text-xs" style={{ color: "var(--text)" }}>
              {fieldErrors.map((m, i) => <li key={i}>{m}</li>)}
            </ul>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {fields.map((f) => {
          const full = FULL_WIDTH_TYPES.has(f.type);
          return (
            <div key={f.key} className={`flex flex-col gap-1.5 ${full ? "sm:col-span-2" : ""}`}>
              {f.type !== "checkbox" && (
                <Label htmlFor={`f-${f.key}`}>
                  {f.label}
                  {f.required && <span style={{ color: "var(--danger)" }}> *</span>}
                </Label>
              )}

              {f.type === "textarea" ? (
                <Textarea
                  id={`f-${f.key}`}
                  value={text[f.key] ?? ""}
                  onChange={(e) => setText((p) => ({ ...p, [f.key]: e.target.value }))}
                  required={f.required}
                />
              ) : f.type === "select" ? (
                <Select value={text[f.key] ?? ""} onValueChange={(v) => setText((p) => ({ ...p, [f.key]: v }))}>
                  <SelectTrigger id={`f-${f.key}`}><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>
                    {(f.options ?? []).map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : f.type === "multiselect" ? (
                <div className="flex flex-wrap gap-2">
                  {(f.options ?? []).map((o) => {
                    const on = (multi[f.key] ?? []).includes(o);
                    return (
                      <button
                        key={o}
                        type="button"
                        onClick={() => toggleMulti(f.key, o)}
                        className="px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer"
                        style={{
                          background: on ? "var(--primary-soft)" : "var(--surface-2)",
                          borderColor: on ? "var(--primary-hex,#6366f1)" : "var(--border-hex,#ecedf4)",
                          color: on ? "var(--primary-hex,#6366f1)" : "var(--text-muted)",
                        }}
                      >
                        {o}
                      </button>
                    );
                  })}
                </div>
              ) : f.type === "checkbox" ? (
                <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    id={`f-${f.key}`}
                    type="checkbox"
                    checked={!!checks[f.key]}
                    onChange={(e) => setChecks((p) => ({ ...p, [f.key]: e.target.checked }))}
                    className="w-4 h-4 accent-[var(--primary-hex,#6366f1)]"
                  />
                  <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                    {f.label}
                    {f.required && <span style={{ color: "var(--danger)" }}> *</span>}
                  </span>
                </label>
              ) : (
                <IconInput
                  id={`f-${f.key}`}
                  icon={fieldIcon(f)}
                  type={inputType(f)}
                  required={f.required}
                  value={text[f.key] ?? ""}
                  onChange={(v) => setText((p) => ({ ...p, [f.key]: v }))}
                />
              )}
            </div>
          );
        })}
      </div>

      <Button type="submit" size="block" className="h-[50px]" disabled={submitting}>
        {submitting ? <Loader2 size={16} className="animate-spin" /> : <Ticket size={16} />}
        {submitting ? "Submitting…" : "Complete Registration"}
      </Button>

      <p className="text-xs text-center m-0" style={{ color: "var(--text-faint)" }}>
        By registering you agree to the event terms. Your ticket QR is emailed instantly.
      </p>
    </form>
  );
}

function IconInput({
  id,
  icon,
  type,
  value,
  onChange,
  required,
}: {
  id: string;
  icon: React.ReactNode;
  type: string;
  value: string;
  onChange: (v: string) => void;
  required: boolean;
}) {
  return (
    <div className="relative">
      {icon && (
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-faint)" }}>
          {icon}
        </span>
      )}
      <Input
        id={id}
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={icon ? "pl-10" : ""}
      />
    </div>
  );
}

/* ─────────────────────────── Calendar card (real event month) ─────────────────────────── */
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function CalendarCard({ startsAt }: { startsAt: string | null }) {
  const eventDate = startsAt ? new Date(startsAt) : null;
  const valid = eventDate && !Number.isNaN(eventDate.getTime());
  const initialYear = valid ? eventDate!.getFullYear() : new Date().getFullYear();
  const initialMonth = valid ? eventDate!.getMonth() : new Date().getMonth();

  const [view, setView] = useState({ year: initialYear, month: initialMonth });

  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  // Monday-based leading offset.
  const firstWeekday = (new Date(view.year, view.month, 1).getDay() + 6) % 7;
  const cells = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const isEventMonth = valid && eventDate!.getFullYear() === view.year && eventDate!.getMonth() === view.month;
  const eventDay = valid ? eventDate!.getDate() : -1;

  const shift = (delta: number) =>
    setView((v) => {
      const m = v.month + delta;
      return { year: v.year + Math.floor(m / 12), month: ((m % 12) + 12) % 12 };
    });

  return (
    <div
      className="rounded-[var(--radius-xl)] border p-5 flex flex-col gap-4 md:sticky md:top-6"
      style={{ background: "var(--surface)", borderColor: "var(--border-hex,#ecedf4)", boxShadow: "var(--shadow-card)" }}
    >
      <div className="flex items-center gap-3">
        {valid && (
          <div
            className="flex flex-col items-center justify-center w-11 h-11 rounded-[var(--radius-sm)] leading-none"
            style={{ background: "var(--primary-soft)", color: "var(--primary-hex,#6366f1)" }}
          >
            <span className="text-[9px] font-bold">{MONTHS[eventDate!.getMonth()].toUpperCase()}</span>
            <span className="text-base font-extrabold">{eventDay}</span>
          </div>
        )}
        <span className="text-[17px] font-extrabold flex-1" style={{ color: "var(--text-strong)" }}>
          {MONTHS[view.month]} {view.year}
        </span>
        <div className="flex items-center gap-1.5">
          <CalNavBtn onClick={() => shift(-1)}><ChevronLeft size={16} /></CalNavBtn>
          <CalNavBtn onClick={() => shift(1)}><ChevronRight size={16} /></CalNavBtn>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((w) => (
          <span key={w} className="text-[11px] font-bold py-1" style={{ color: "var(--text-muted)" }}>{w}</span>
        ))}
        {cells.map((d, i) => {
          if (d === null) return <span key={`b${i}`} />;
          const isEvent = isEventMonth && d === eventDay;
          return (
            <div key={d} className="flex items-center justify-center py-1">
              <span
                className="flex items-center justify-center w-8 h-8 rounded-full text-[13px] font-bold"
                style={
                  isEvent
                    ? { background: "var(--orange)", color: "#fff", boxShadow: "0 4px 10px rgba(245,158,11,0.4)" }
                    : { color: "var(--text)" }
                }
              >
                {d}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2 pt-3 border-t" style={{ borderColor: "var(--border-hex,#ecedf4)" }}>
        <span className="w-2 h-2 rounded-full" style={{ background: "var(--orange)" }} />
        <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>Event day</span>
      </div>
    </div>
  );
}

function CalNavBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-center w-8 h-8 rounded-[var(--radius-sm)] border transition-colors cursor-pointer hover:bg-[var(--surface-2)]"
      style={{ background: "var(--surface)", borderColor: "var(--border-hex,#ecedf4)", color: "var(--text-muted)" }}
      aria-label="Change month"
    >
      {children}
    </button>
  );
}

/* ─────────────────────────── Agenda card (placeholder — no agenda API yet) ─────────────────────────── */
function AgendaCard() {
  return (
    <div
      className="rounded-[var(--radius-xl)] border p-6 flex flex-col gap-4"
      style={{ background: "var(--surface)", borderColor: "var(--border-hex,#ecedf4)", boxShadow: "var(--shadow-card)" }}
    >
      <h2 className="text-[19px] font-extrabold m-0" style={{ color: "var(--primary-hex,#6366f1)" }}>Agenda</h2>
      <CenterNote icon={<CalendarDays size={24} />} title="Agenda coming soon" sub="The detailed session schedule for this event hasn't been published yet." />
    </div>
  );
}

/* ─────────────────────────── Success screen ─────────────────────────── */
function SuccessScreen({ event, result }: { event: PublicEvent; result: RegistrationResult }) {
  let ticketPath = "/explore";
  try {
    ticketPath = new URL(result.ticketUrl).pathname;
  } catch {
    if (result.ticketUrl?.startsWith("/")) ticketPath = result.ticketUrl;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: "var(--bg)" }}>
      <div
        className="w-full max-w-sm rounded-[var(--radius-xl)] border p-8 flex flex-col items-center gap-5 text-center"
        style={{ background: "var(--surface)", borderColor: "var(--border-hex,#ecedf4)", boxShadow: "var(--shadow-pop)" }}
      >
        <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "var(--green-soft)" }}>
          <Check size={28} style={{ color: "var(--green-600)" }} />
        </div>
        <div>
          <h2 className="text-[22px] font-extrabold m-0" style={{ color: "var(--text-strong)" }}>You&apos;re registered!</h2>
          <p className="text-sm mt-1.5 m-0" style={{ color: "var(--text-muted)" }}>
            {result.message || "Check your email for your ticket and QR code."}
          </p>
        </div>
        <div
          className="w-full rounded-[var(--radius-lg)] p-4 flex flex-col gap-1.5 text-left"
          style={{ background: "var(--surface-2)", border: "1px solid var(--border-hex,#ecedf4)" }}
        >
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Event</span>
          <span className="text-sm font-bold" style={{ color: "var(--text-strong)" }}>{event.title}</span>
          <span className="text-xs flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
            <Calendar size={11} /> {[fmtDate(event.startsAt), fmtTime(event.startsAt)].filter(Boolean).join(" · ")}
          </span>
          {event.venue && (
            <span className="text-xs flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
              <MapPin size={11} /> {event.venue}
            </span>
          )}
        </div>
        <div className="flex flex-col gap-2 w-full">
          <Button asChild size="block">
            <Link href={ticketPath}><Ticket size={16} /> View my ticket</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/explore">Explore more events</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── QR helpers (decorative until ticket is issued) ─────────────────────────── */
function QrCode({ matrix, size }: { matrix: boolean[][]; size: number }) {
  const n = matrix.length;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${n} ${n}`} shapeRendering="crispEdges" role="img" aria-label="Sample ticket QR">
      <rect width={n} height={n} fill="#fff" />
      {matrix.flatMap((row, r) =>
        row.map((on, c) => (on ? <rect key={`${r}-${c}`} x={c} y={r} width={1} height={1} fill="#11142a" /> : null))
      )}
    </svg>
  );
}

function makeQrMatrix(seed: string, n: number): boolean[][] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const rand = () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h >>> 0) % 1000) / 1000;
  };
  const g: boolean[][] = Array.from({ length: n }, () => Array.from({ length: n }, () => rand() > 0.52));
  const drawFinder = (top: number, left: number) => {
    for (let i = -1; i <= 7; i++) {
      for (let j = -1; j <= 7; j++) {
        const r = top + i;
        const c = left + j;
        if (r < 0 || c < 0 || r >= n || c >= n) continue;
        const onBorder = i === 0 || i === 6 || j === 0 || j === 6;
        const core = i >= 2 && i <= 4 && j >= 2 && j <= 4;
        const inRange = i >= 0 && i <= 6 && j >= 0 && j <= 6;
        g[r][c] = inRange ? onBorder || core : false;
      }
    }
  };
  drawFinder(0, 0);
  drawFinder(0, n - 7);
  drawFinder(n - 7, 0);
  return g;
}
