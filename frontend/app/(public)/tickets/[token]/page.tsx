"use client";

import { useEffect, useState } from "react";
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

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <header className="flex items-center px-6 md:px-10 h-[68px] gap-3">
        <Logo size={28} />
        <div className="flex-1" />
        <ThemeToggle />
        <Button asChild variant="ghost" size="sm">
          <Link href="/explore"><LayoutGrid size={15} /> All events</Link>
        </Button>
      </header>

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
    </div>
  );
}
