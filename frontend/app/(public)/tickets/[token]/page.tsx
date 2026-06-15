"use client";

<<<<<<< HEAD
import { useEffect, useState } from "react";
=======
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Calendar, MapPin, Mail, Download, Share2, CheckCircle2, XCircle, Clock, Loader2 } from "lucide-react";
>>>>>>> a79048d85e4d1f263f4432ed1f84757825345097
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import {
  Calendar,
  MapPin,
  Ticket,
  LayoutGrid,
  AlertCircle,
  Loader2,
  Check,
  Mail,
  CheckCircle2,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
<<<<<<< HEAD
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { ApiError } from "@/lib/api/client";
import { getTicket, resendTicket, type PublicTicket } from "@/lib/api/events";

function fmtWhen(iso: string | null): string {
  if (!iso) return "Date TBA";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Date TBA";
  return (
    d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) +
    " · " +
    d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
  );
}

const STATUS_META: Record<string, { label: string; bg: string; fg: string }> = {
  PENDING:    { label: "Ticket issued",  bg: "var(--orange-soft)",        fg: "var(--orange)" },
  DELIVERED:  { label: "Emailed to you", bg: "var(--green-soft,#ecfdf5)", fg: "var(--green-600)" },
  CHECKED_IN: { label: "Checked in",     bg: "var(--primary-soft)",       fg: "var(--primary-hex,#6366f1)" },
  REVOKED:    { label: "Revoked",        bg: "var(--danger-soft)",        fg: "var(--danger)" },
};

export default function TicketPage() {
  const params = useParams<{ token: string }>();
  const token = params?.token ?? "";

  const [ticket, setTicket] = useState<PublicTicket | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "notfound" | "error">("loading");
  const [resend, setResend] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [resendMsg, setResendMsg] = useState("");

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    setState("loading");
    getTicket(token, controller.signal)
      .then((t) => {
        setTicket(t);
        setState("ready");
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setState(err instanceof ApiError && err.status === 404 ? "notfound" : "error");
      });
    return () => controller.abort();
  }, [token]);

  async function handleResend() {
    setResend("sending");
    setResendMsg("");
    try {
      const res = await resendTicket(token);
      setResend("sent");
      setResendMsg(res.message || "We've re-sent your ticket email.");
    } catch (err) {
      setResend("error");
      setResendMsg(err instanceof ApiError ? err.message : "Couldn't re-send the email.");
    }
  }

  const status = ticket ? STATUS_META[ticket.ticketStatus] ?? STATUS_META.PENDING : null;
  const canResend = ticket?.ticketStatus !== "CHECKED_IN" && ticket?.ticketStatus !== "REVOKED";
=======
import { StatusBadge } from "@/components/ui/status-badge";
import { ApiError } from "@/lib/api/client";
import { getTicket, resendTicket, type Ticket, type TicketStatus } from "@/lib/api/tickets";

/** Visual buckets the four backend lifecycle states collapse into. */
type DisplayStatus = "valid" | "used" | "cancelled";

const DISPLAY_BY_STATUS: Record<TicketStatus, DisplayStatus> = {
  PENDING: "valid",
  DELIVERED: "valid",
  CHECKED_IN: "used",
  REVOKED: "cancelled",
};

const STATUS_CONFIG: Record<
  DisplayStatus,
  { label: string; variant: "green" | "gray" | "danger"; icon: React.ReactNode; message: string }
> = {
  valid: { label: "Valid", variant: "green", icon: <CheckCircle2 size={20} />, message: "Present this QR code at the venue entrance." },
  used: { label: "Used", variant: "gray", icon: <Clock size={20} />, message: "This ticket has already been scanned." },
  cancelled: { label: "Cancelled", variant: "danger", icon: <XCircle size={20} />, message: "This ticket has been cancelled." },
};

const EVENT_COVER = "#6366f1";
>>>>>>> a79048d85e4d1f263f4432ed1f84757825345097

function formatDate(iso: string | null): string {
  if (!iso) return "Date to be announced";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Date to be announced";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function formatTime(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
<<<<<<< HEAD
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <header className="flex items-center px-6 md:px-10 h-[68px] gap-3">
=======
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      <header
        className="h-[60px] flex items-center px-6"
        style={{ background: "var(--surface)", borderBottom: "1px solid var(--border-hex,#ecedf4)" }}
      >
>>>>>>> a79048d85e4d1f263f4432ed1f84757825345097
        <Logo size={28} />
        <div className="flex-1" />
        <ThemeToggle />
        <Button asChild variant="ghost" size="sm">
          <Link href="/explore"><LayoutGrid size={15} /> All events</Link>
        </Button>
      </header>
<<<<<<< HEAD

      <div className="max-w-[480px] mx-auto px-4 sm:px-6 pb-16">
        {state === "loading" ? (
          <div className="flex flex-col items-center justify-center gap-3 py-32" style={{ color: "var(--text-muted)" }}>
            <Loader2 size={28} className="animate-spin" />
            <span className="text-sm font-semibold">Loading your ticket…</span>
          </div>
        ) : state !== "ready" || !ticket ? (
          <div className="flex flex-col items-center justify-center gap-3 py-28 text-center">
            <AlertCircle size={32} style={{ color: state === "notfound" ? "var(--text-faint)" : "var(--danger)" }} />
            <div className="flex flex-col gap-1">
              <p className="text-base font-extrabold m-0" style={{ color: "var(--text-strong)" }}>
                {state === "notfound" ? "Ticket not found" : "Couldn't load this ticket"}
              </p>
              <p className="text-sm m-0" style={{ color: "var(--text-muted)" }}>
                {state === "notfound"
                  ? "This ticket link is invalid or has expired."
                  : "Please check your connection and try again."}
              </p>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/explore"><LayoutGrid size={15} /> Browse events</Link>
            </Button>
          </div>
        ) : (
          <div
            className="mt-6 rounded-[var(--radius-xl)] border overflow-hidden"
            style={{ background: "var(--surface)", borderColor: "var(--border-hex,#ecedf4)", boxShadow: "var(--shadow-pop)" }}
          >
            <div className="px-6 py-5 flex items-center gap-3" style={{ background: "linear-gradient(120deg,#6366f1,#7c5cf0,#8b5cf6)" }}>
              <Ticket size={22} style={{ color: "#fff" }} />
              <div className="flex flex-col">
                <span className="text-white font-extrabold text-[17px] leading-tight">{ticket.eventTitle ?? "Your ticket"}</span>
                <span className="text-[12px]" style={{ color: "rgba(255,255,255,0.85)" }}>Gatherly e-ticket</span>
              </div>
            </div>

            <div className="p-6 flex flex-col items-center gap-5">
              {/* Real QR rendered by the backend */}
              <div className="p-3 rounded-[var(--radius-md)]" style={{ background: "#fff", boxShadow: "var(--shadow-sm)" }}>
                <Image
                  src={ticket.qrImageDataUrl}
                  alt="Your check-in QR code"
                  width={220}
                  height={220}
                  unoptimized
                  style={{ display: "block", width: 220, height: 220 }}
                />
              </div>

              {status && (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full" style={{ background: status.bg, color: status.fg }}>
                  {ticket.ticketStatus === "CHECKED_IN" ? <CheckCircle2 size={12} /> : <Check size={12} />}
                  {status.label}
                </span>
              )}

              <div className="w-full rounded-[var(--radius-lg)] p-4 flex flex-col gap-2" style={{ background: "var(--surface-2)", border: "1px solid var(--border-hex,#ecedf4)" }}>
                {ticket.guestName && (
                  <span className="text-sm font-bold" style={{ color: "var(--text-strong)" }}>{ticket.guestName}</span>
                )}
                <span className="text-xs flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
                  <Calendar size={12} /> {fmtWhen(ticket.startsAt)}
                </span>
                {ticket.venue && (
                  <span className="text-xs flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
                    <MapPin size={12} /> {ticket.venue}
                  </span>
                )}
              </div>

              <p className="text-xs text-center m-0" style={{ color: "var(--text-faint)" }}>
                Show this QR at the entrance. A copy was emailed to you.
              </p>

              {canResend && (
                <div className="w-full flex flex-col items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={handleResend} disabled={resend === "sending"}>
                    {resend === "sending" ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
                    Re-send to my email
                  </Button>
                  {resendMsg && (
                    <span className="text-xs text-center" style={{ color: resend === "error" ? "var(--danger)" : "var(--green-600)" }}>
                      {resendMsg}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
=======
      <div className="flex-1 flex items-start justify-center px-4 py-10">{children}</div>
>>>>>>> a79048d85e4d1f263f4432ed1f84757825345097
    </div>
  );
}

export default function TicketPortalPage() {
  const params = useParams<{ token: string }>();
  const token = params?.token ?? "";

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "loaded" | "notfound" | "error">("loading");

  const [resendState, setResendState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    setLoadState("loading");
    setTicket(null);

    getTicket(token, controller.signal)
      .then((t) => {
        setTicket(t);
        setLoadState("loaded");
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setLoadState(err instanceof ApiError && err.status === 404 ? "notfound" : "error");
      });

    return () => controller.abort();
  }, [token]);

  const handleResend = useCallback(async () => {
    if (!token) return;
    setResendState("sending");
    setResendMessage(null);
    try {
      await resendTicket(token);
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
  }, [token]);

  if (loadState === "loading") {
    return (
      <Shell>
        <div className="flex flex-col items-center gap-3 pt-20" style={{ color: "var(--text-muted)" }}>
          <Loader2 size={28} className="animate-spin" />
          <span className="text-sm">Loading your ticket…</span>
        </div>
      </Shell>
    );
  }

  if (loadState === "notfound" || loadState === "error") {
    const notFound = loadState === "notfound";
    return (
      <Shell>
        <div className="w-full max-w-[440px] flex flex-col items-center gap-3 pt-16 text-center">
          <XCircle size={40} style={{ color: "var(--danger)" }} />
          <h1 className="text-lg font-bold m-0" style={{ color: "var(--text-strong)" }}>
            {notFound ? "Ticket not found" : "Something went wrong"}
          </h1>
          <p className="text-sm m-0" style={{ color: "var(--text-muted)" }}>
            {notFound
              ? "This ticket link is invalid or has expired. Double-check the link in your email."
              : "We couldn't load your ticket. Please try again in a moment."}
          </p>
          <Link href="/explore" className="text-sm font-semibold mt-1" style={{ color: "var(--primary-hex,#6366f1)" }}>
            Browse events
          </Link>
        </div>
      </Shell>
    );
  }

  // loadState === "loaded" — ticket is non-null here
  const t = ticket!;
  const display = DISPLAY_BY_STATUS[t.ticketStatus];
  const config = STATUS_CONFIG[display];
  const isValid = display === "valid";
  const date = formatDate(t.startsAt);
  const time = formatTime(t.startsAt);

  return (
    <Shell>
      <div className="w-full max-w-[440px] flex flex-col gap-4">
        {/* Ticket card */}
        <div
          className="rounded-[22px] border overflow-hidden"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border-hex,#ecedf4)",
            boxShadow: "var(--shadow-pop)",
            filter: !isValid ? "grayscale(40%)" : "none",
            opacity: display === "cancelled" ? 0.8 : 1,
          }}
        >
          {/* Event cover */}
          <div
            className="h-32 flex items-end px-5 pb-4 relative"
            style={{ background: `linear-gradient(135deg, ${EVENT_COVER}, color-mix(in srgb, ${EVENT_COVER} 30%, #22c55e))` }}
          >
            <div className="flex flex-col gap-1">
              <span className="text-white font-extrabold text-base">{t.eventTitle}</span>
              <span className="text-white/70 text-xs">by Gatherly Inc.</span>
            </div>
          </div>

          <div className="px-6 py-5 flex flex-col gap-5">
            {/* Status pill */}
            <div className="flex items-center justify-between">
              <div
                className="flex items-center gap-2"
                style={{ color: config.variant === "green" ? "var(--green-600)" : config.variant === "danger" ? "var(--danger)" : "var(--text-muted)" }}
              >
                {config.icon}
                <StatusBadge variant={config.variant}>{config.label}</StatusBadge>
              </div>
              <code className="text-xs font-mono px-2 py-1 rounded" style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}>
                {t.checkinToken}
              </code>
            </div>

            {/* QR code */}
            <div
              className="flex flex-col items-center py-6 rounded-[var(--radius-lg)] relative overflow-hidden"
              style={{ background: isValid ? "var(--surface-2)" : "#f0f0f4" }}
            >
              <div
                className="w-[188px] h-[188px] rounded-xl flex items-center justify-center"
                style={{ background: isValid ? "white" : "#e0e0e6", boxShadow: "var(--shadow-sm)", padding: 12 }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- base64 data URL from API, not a remote asset */}
                <img
                  src={t.qrImageDataUrl}
                  alt={`QR check-in code for ${t.guestName}`}
                  width={164}
                  height={164}
                  className="w-[164px] h-[164px]"
                  style={{ imageRendering: "pixelated", filter: isValid ? "none" : "grayscale(100%) opacity(0.6)" }}
                />
              </div>

              {/* Used / cancelled overlay */}
              {!isValid && (
                <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(240,240,244,.7)" }}>
                  <StatusBadge variant={config.variant} style={{ fontSize: 14, padding: "6px 14px" }}>
                    {config.label.toUpperCase()}
                  </StatusBadge>
                </div>
              )}

              <p className="text-[12px] mt-3 m-0" style={{ color: "var(--text-faint)" }}>{config.message}</p>
            </div>

            {/* Guest + event info */}
            <div className="flex flex-col gap-2.5">
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>Guest</span>
                <span className="text-sm font-bold" style={{ color: "var(--text-strong)" }}>{t.guestName}</span>
              </div>
              <div className="flex flex-col gap-1.5 py-3 border-t" style={{ borderColor: "var(--border-hex,#ecedf4)" }}>
                <span className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
                  <Calendar size={12} style={{ flexShrink: 0 }} /> {date}
                  {time ? `, ${time}` : ""}
                </span>
                {t.venue && (
                  <span className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
                    <MapPin size={12} style={{ flexShrink: 0 }} /> {t.venue}
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <Button size="block" variant="soft" onClick={handleResend} disabled={resendState === "sending"}>
                {resendState === "sending" ? <Loader2 size={13} className="animate-spin" /> : <Mail size={13} />}
                {resendState === "sending" ? "Sending…" : "Resend to email"}
              </Button>
              {resendMessage && (
                <p
                  className="text-[12px] text-center m-0"
                  style={{ color: resendState === "error" ? "var(--danger)" : "var(--green-600)" }}
                >
                  {resendMessage}
                </p>
              )}
              <div className="grid grid-cols-2 gap-2">
                <Button asChild size="sm" variant="ghost">
                  <a href={t.qrImageDataUrl} download={`ticket-${t.checkinToken}.png`}>
                    <Download size={13} /> Save QR
                  </a>
                </Button>
                <Button size="sm" variant="ghost"><Share2 size={13} /> Share</Button>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-xs" style={{ color: "var(--text-faint)" }}>
          Powered by{" "}
          <Link href="/explore" style={{ color: "var(--primary-hex,#6366f1)", textDecoration: "none", fontWeight: 600 }}>
            Gatherly
          </Link>
        </p>
      </div>
    </Shell>
  );
}
