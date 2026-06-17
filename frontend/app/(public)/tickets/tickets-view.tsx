"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import {
  Ticket as TicketIcon,
  ArrowRight,
  Mail,
  QrCode,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Calendar,
  MapPin,
  CheckCircle2,
  Clock,
  XCircle,
  SearchX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { ApiError } from "@/lib/api/client";
import { getTicket, resendTicket, type Ticket, type TicketStatus } from "@/lib/api/tickets";
import { PublicShell } from "../public-chrome";

/**
 * Accepts either a raw check-in token or a full ticket link
 * (`…/tickets/<token>`) and extracts the opaque token.
 */
function extractToken(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  const match = value.match(/\/tickets\/([^/?#\s]+)/i);
  if (match) return decodeURIComponent(match[1]);
  if (/[\s/]/.test(value)) return null;
  return value;
}

function fmtDate(iso: string | null) {
  if (!iso) return "Date TBA";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Date TBA";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/** Visual buckets the four backend lifecycle states collapse into. */
const STATUS_CONFIG: Record<
  TicketStatus,
  { label: string; variant: "green" | "gray" | "danger"; icon: React.ReactNode }
> = {
  PENDING: { label: "Valid", variant: "green", icon: <CheckCircle2 size={15} /> },
  DELIVERED: { label: "Valid", variant: "green", icon: <CheckCircle2 size={15} /> },
  CHECKED_IN: { label: "Used", variant: "gray", icon: <Clock size={15} /> },
  REVOKED: { label: "Cancelled", variant: "danger", icon: <XCircle size={15} /> },
};

const STEPS = [
  {
    icon: <Mail size={18} />,
    title: "Check your inbox",
    body: "Your ticket link was emailed the moment you registered. Search for “Gatherly”.",
  },
  {
    icon: <QrCode size={18} />,
    title: "Open your QR ticket",
    body: "Paste the link or code to pull up your unique QR check-in ticket.",
  },
  {
    icon: <ShieldCheck size={18} />,
    title: "Scan at the door",
    body: "Show the QR at the venue entrance — each ticket scans in once.",
  },
];

type LookupState = "idle" | "loading" | "found" | "notfound" | "error";

export function TicketsLookupView() {
  const [value, setValue] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);
  const [state, setState] = useState<LookupState>("idle");
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const token = extractToken(value);
      if (!token) {
        setInputError("Enter the ticket link or code from your confirmation email.");
        return;
      }
      setInputError(null);
      setResendState("idle");
      setResendMessage(null);

      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;

      setState("loading");
      setTicket(null);
      getTicket(token, controller.signal)
        .then((t) => {
          setTicket(t);
          setState("found");
        })
        .catch((err) => {
          if (controller.signal.aborted) return;
          setState(err instanceof ApiError && err.status === 404 ? "notfound" : "error");
        });
    },
    [value],
  );

  const handleResend = useCallback(async () => {
    if (!ticket) return;
    setResendState("sending");
    setResendMessage(null);
    try {
      await resendTicket(ticket.checkinToken);
      setResendState("sent");
      setResendMessage("Ticket sent — check your inbox.");
    } catch (err) {
      setResendState("error");
      setResendMessage(
        err instanceof ApiError
          ? err.code === "RATE_LIMITED"
            ? "Please wait a moment before requesting another email."
            : err.message
          : "Couldn't resend the ticket. Please try again.",
      );
    }
  }, [ticket]);

  return (
    <PublicShell>
      <div className="mx-auto flex max-w-[1200px] flex-col gap-10 px-6 pb-20 pt-6 md:px-10">
        {/* Heading */}
        <div className="flex flex-col gap-4">
          <span
            className="inline-flex items-center gap-2 self-start rounded-full px-3.5 py-1.5 text-xs font-bold"
            style={{ background: "var(--surface)", color: "var(--text-muted)", boxShadow: "var(--shadow-card)" }}
          >
            <TicketIcon size={13} /> Guest ticket portal
          </span>
          <h1
            className="m-0 text-[40px] font-extrabold leading-[1.02] tracking-tight md:text-[52px]"
            style={{ color: "var(--text-strong)" }}
          >
            Find your{" "}
            <span
              style={{
                background: "linear-gradient(100deg, #7c5cf0 0%, #9b6df0 45%, #ec4899 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              ticket
            </span>
          </h1>
          <p className="m-0 max-w-xl text-[15px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
            Paste the ticket link from your confirmation email — or just the code — to look up your QR check-in ticket.
          </p>
        </div>

        {/* Two-column: lookup + result */}
        <div className="grid items-start gap-8 lg:grid-cols-2">
          {/* Left: form + steps */}
          <div className="flex flex-col gap-6">
            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-3 rounded-[var(--radius-xl)] p-4 sm:flex-row sm:items-start"
              style={{ background: "var(--surface)", boxShadow: "var(--shadow-card)" }}
            >
              <div className="flex flex-1 flex-col gap-1">
                <input
                  type="text"
                  inputMode="text"
                  autoComplete="off"
                  placeholder="Ticket link or code"
                  value={value}
                  onChange={(e) => {
                    setValue(e.target.value);
                    if (inputError) setInputError(null);
                  }}
                  aria-label="Ticket link or code"
                  aria-invalid={inputError ? true : undefined}
                  className="h-12 w-full rounded-[var(--radius-md)] border px-4 text-base font-semibold transition-all focus:outline-none focus:border-[var(--primary-hex,#6366f1)] focus:shadow-[0_0_0_4px_var(--primary-ring)]"
                  style={{ background: "var(--surface-2)", borderColor: "var(--border-hex,#ecedf4)", color: "var(--text)" }}
                />
                {inputError && (
                  <span
                    className="inline-flex items-center gap-1.5 px-1 text-[13px] font-semibold"
                    style={{ color: "var(--danger)" }}
                  >
                    <AlertCircle size={13} /> {inputError}
                  </span>
                )}
              </div>
              <Button type="submit" size="lg" className="h-12 sm:w-auto" disabled={state === "loading"}>
                {state === "loading" ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                {state === "loading" ? "Looking up…" : "View ticket"}
              </Button>
            </form>

            <div className="grid gap-4 sm:grid-cols-3">
              {STEPS.map((s) => (
                <div
                  key={s.title}
                  className="flex flex-col gap-2 rounded-[var(--radius-xl)] border p-5"
                  style={{ background: "var(--surface)", borderColor: "var(--border-hex,#ecedf4)" }}
                >
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-full"
                    style={{ background: "var(--primary-soft)", color: "var(--primary-hex,#6366f1)" }}
                  >
                    {s.icon}
                  </span>
                  <span className="text-sm font-bold" style={{ color: "var(--text-strong)" }}>
                    {s.title}
                  </span>
                  <span className="text-[13px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
                    {s.body}
                  </span>
                </div>
              ))}
            </div>

            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Don&apos;t have a ticket yet?{" "}
              <Link href="/#events" className="font-semibold" style={{ color: "var(--primary-hex,#6366f1)" }}>
                Browse events
              </Link>
            </p>
          </div>

          {/* Right: result panel */}
          <div className="lg:sticky lg:top-6">
            <ResultPanel
              state={state}
              ticket={ticket}
              resendState={resendState}
              resendMessage={resendMessage}
              onResend={handleResend}
            />
          </div>
        </div>
      </div>
    </PublicShell>
  );
}

function ResultPanel({
  state,
  ticket,
  resendState,
  resendMessage,
  onResend,
}: {
  state: LookupState;
  ticket: Ticket | null;
  resendState: "idle" | "sending" | "sent" | "error";
  resendMessage: string | null;
  onResend: () => void;
}) {
  if (state === "idle") {
    return (
      <Panel>
        <QrCode size={34} style={{ color: "var(--text-faint)" }} />
        <p className="m-0 text-sm font-bold" style={{ color: "var(--text)" }}>
          Your ticket will appear here
        </p>
        <p className="m-0 text-[13px]" style={{ color: "var(--text-muted)" }}>
          Enter your ticket link or code to look it up.
        </p>
      </Panel>
    );
  }

  if (state === "loading") {
    return (
      <Panel>
        <Loader2 size={30} className="animate-spin" style={{ color: "var(--text-muted)" }} />
        <p className="m-0 text-sm font-semibold" style={{ color: "var(--text-muted)" }}>
          Looking up your ticket…
        </p>
      </Panel>
    );
  }

  if (state === "notfound") {
    return (
      <Panel>
        <SearchX size={34} style={{ color: "var(--danger)" }} />
        <p className="m-0 text-sm font-bold" style={{ color: "var(--text)" }}>
          Ticket not found
        </p>
        <p className="m-0 text-[13px]" style={{ color: "var(--text-muted)" }}>
          This link or code is invalid or expired. Double-check the link in your email.
        </p>
      </Panel>
    );
  }

  if (state === "error") {
    return (
      <Panel>
        <AlertCircle size={34} style={{ color: "var(--danger)" }} />
        <p className="m-0 text-sm font-bold" style={{ color: "var(--text)" }}>
          Something went wrong
        </p>
        <p className="m-0 text-[13px]" style={{ color: "var(--text-muted)" }}>
          We couldn&apos;t load your ticket. Please try again in a moment.
        </p>
      </Panel>
    );
  }

  // state === "found"
  const t = ticket!;
  const config = STATUS_CONFIG[t.ticketStatus];

  return (
    <div
      className="overflow-hidden rounded-[var(--radius-xl)]"
      style={{ background: "var(--surface)", boxShadow: "var(--shadow-pop)" }}
    >
      {/* Cover */}
      <div
        className="flex h-32 flex-col justify-end p-5"
        style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
      >
        <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.85)" }}>
          Your ticket
        </span>
        <h2 className="m-0 text-xl font-extrabold leading-tight" style={{ color: "#fff" }}>
          {t.eventTitle ?? "Event"}
        </h2>
      </div>

      <div className="flex flex-col gap-4 p-6">
        <div className="flex items-center gap-2" style={{ color: `var(--${config.variant === "green" ? "green-600" : config.variant === "danger" ? "danger" : "text-muted"})` }}>
          {config.icon}
          <StatusBadge variant={config.variant}>{config.label}</StatusBadge>
        </div>

        <div className="flex flex-col gap-2.5">
          <Field label="Guest" value={t.guestName} />
          <div className="flex flex-col gap-1.5 border-t pt-3" style={{ borderColor: "var(--border-hex,#ecedf4)" }}>
            <span className="inline-flex items-center gap-1.5 text-[13px]" style={{ color: "var(--text-muted)" }}>
              <Calendar size={13} /> {fmtDate(t.startsAt)}
            </span>
            {t.venue && (
              <span className="inline-flex items-center gap-1.5 text-[13px]" style={{ color: "var(--text-muted)" }}>
                <MapPin size={13} /> {t.venue}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button asChild size="block">
            <Link href={`/tickets/${encodeURIComponent(t.checkinToken)}`}>
              <QrCode size={16} /> Open full QR ticket
            </Link>
          </Button>
          <Button size="block" variant="soft" onClick={onResend} disabled={resendState === "sending"}>
            {resendState === "sending" ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
            {resendState === "sending" ? "Sending…" : "Resend to email"}
          </Button>
          {resendMessage && (
            <p
              className="m-0 text-center text-[12px]"
              style={{ color: resendState === "error" ? "var(--danger)" : "var(--green-600)" }}
            >
              {resendMessage}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex min-h-[280px] flex-col items-center justify-center gap-3 rounded-[var(--radius-xl)] border p-8 text-center"
      style={{ background: "var(--surface)", borderColor: "var(--border-hex,#ecedf4)" }}
    >
      {children}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>
        {label}
      </span>
      <span className="text-sm font-bold" style={{ color: "var(--text-strong)" }}>
        {value}
      </span>
    </div>
  );
}
