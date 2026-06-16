"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Calendar,
  MapPin,
  Mail,
  Download,
  Share2,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
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
  valid: {
    label: "Valid",
    variant: "green",
    icon: <CheckCircle2 size={20} />,
    message: "Present this QR code at the venue entrance.",
  },
  used: {
    label: "Used",
    variant: "gray",
    icon: <Clock size={20} />,
    message: "This ticket has already been scanned.",
  },
  cancelled: {
    label: "Cancelled",
    variant: "danger",
    icon: <XCircle size={20} />,
    message: "This ticket has been cancelled.",
  },
};

const EVENT_COVER = "#6366f1";

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
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      <header
        className="h-[60px] flex items-center px-6"
        style={{ background: "var(--surface)", borderBottom: "1px solid var(--border-hex,#ecedf4)" }}
      >
        <Logo size={28} />
        <div className="flex-1" />
        <ThemeToggle />
      </header>
      <div className="flex-1 flex items-start justify-center px-4 py-10">{children}</div>
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
          <Link href="/" className="text-sm font-semibold mt-1" style={{ color: "var(--primary-hex,#6366f1)" }}>
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
            style={{
              background: `linear-gradient(135deg, ${EVENT_COVER}, color-mix(in srgb, ${EVENT_COVER} 30%, #22c55e))`,
            }}
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
                style={{
                  color:
                    config.variant === "green"
                      ? "var(--green-600)"
                      : config.variant === "danger"
                        ? "var(--danger)"
                        : "var(--text-muted)",
                }}
              >
                {config.icon}
                <StatusBadge variant={config.variant}>{config.label}</StatusBadge>
              </div>
              <code
                className="text-xs font-mono px-2 py-1 rounded"
                style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}
              >
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
                style={{
                  background: isValid ? "white" : "#e0e0e6",
                  boxShadow: "var(--shadow-sm)",
                  padding: 12,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- base64 data URL from API, not a remote asset */}
                <img
                  src={t.qrImageDataUrl}
                  alt={`QR check-in code for ${t.guestName}`}
                  width={164}
                  height={164}
                  className="w-[164px] h-[164px]"
                  style={{
                    imageRendering: "pixelated",
                    filter: isValid ? "none" : "grayscale(100%) opacity(0.6)",
                  }}
                />
              </div>

              {/* Used / cancelled overlay */}
              {!isValid && (
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ background: "rgba(240,240,244,.7)" }}
                >
                  <StatusBadge variant={config.variant} style={{ fontSize: 14, padding: "6px 14px" }}>
                    {config.label.toUpperCase()}
                  </StatusBadge>
                </div>
              )}

              <p className="text-[12px] mt-3 m-0" style={{ color: "var(--text-faint)" }}>
                {config.message}
              </p>
            </div>

            {/* Guest + event info */}
            <div className="flex flex-col gap-2.5">
              <div className="flex flex-col gap-0.5">
                <span
                  className="text-[11px] font-bold uppercase tracking-wider"
                  style={{ color: "var(--text-faint)" }}
                >
                  Guest
                </span>
                <span className="text-sm font-bold" style={{ color: "var(--text-strong)" }}>
                  {t.guestName}
                </span>
              </div>
              <div
                className="flex flex-col gap-1.5 py-3 border-t"
                style={{ borderColor: "var(--border-hex,#ecedf4)" }}
              >
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
                <Button size="sm" variant="ghost">
                  <Share2 size={13} /> Share
                </Button>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-xs" style={{ color: "var(--text-faint)" }}>
          Powered by{" "}
          <Link
            href="/"
            style={{ color: "var(--primary-hex,#6366f1)", textDecoration: "none", fontWeight: 600 }}
          >
            Gatherly
          </Link>
        </p>
      </div>
    </Shell>
  );
}