"use client";

import { useParams } from "next/navigation";
import { Calendar, MapPin, Mail, Download, Share2, CheckCircle2, XCircle, Clock } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";

type TicketStatus = "valid" | "used" | "cancelled";

// Mock ticket data — in production, fetch server-side by token
const MOCK_TICKET = {
  token: "TKT-A8F3-9JK2",
  status: "valid" as TicketStatus,
  guestName: "Clara Bennett",
  email: "clara@email.com",
  event: {
    name: "NorthStar Leadership Summit",
    date: "Jun 18, 2026",
    time: "9:00 AM – 5:00 PM",
    location: "Moscone Center, San Francisco, CA",
    cover: "#6366f1",
  },
};

const STATUS_CONFIG: Record<TicketStatus, { label: string; variant: "green" | "gray" | "danger"; icon: React.ReactNode; message: string }> = {
  valid:     { label: "Valid",     variant: "green",  icon: <CheckCircle2 size={20} />, message: "Present this QR code at the venue entrance." },
  used:      { label: "Used",      variant: "gray",   icon: <Clock size={20} />,        message: "This ticket has already been scanned." },
  cancelled: { label: "Cancelled", variant: "danger", icon: <XCircle size={20} />,      message: "This ticket has been cancelled." },
};

export default function TicketPortalPage() {
  const params = useParams();
  const ticket = MOCK_TICKET;
  const config = STATUS_CONFIG[ticket.status];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      {/* Minimal header */}
      <header
        className="h-[60px] flex items-center px-6"
        style={{ background: "var(--surface)", borderBottom: "1px solid var(--border-hex,#ecedf4)" }}
      >
        <Logo size={28} />
      </header>

      <div className="flex-1 flex items-start justify-center px-4 py-10">
        <div className="w-full max-w-[440px] flex flex-col gap-4">
          {/* Ticket card */}
          <div
            className="rounded-[22px] border overflow-hidden"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border-hex,#ecedf4)",
              boxShadow: "var(--shadow-pop)",
              filter: ticket.status !== "valid" ? "grayscale(40%)" : "none",
              opacity: ticket.status === "cancelled" ? 0.8 : 1,
            }}
          >
            {/* Event cover */}
            <div
              className="h-32 flex items-end px-5 pb-4 relative"
              style={{ background: `linear-gradient(135deg, ${ticket.event.cover}, color-mix(in srgb, ${ticket.event.cover} 30%, #22c55e))` }}
            >
              <div className="flex flex-col gap-1">
                <span className="text-white font-extrabold text-base">{ticket.event.name}</span>
                <span className="text-white/70 text-xs">by Gatherly Inc.</span>
              </div>
            </div>

            <div className="px-6 py-5 flex flex-col gap-5">
              {/* Status pill */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2" style={{ color: config.variant === "green" ? "var(--green-600)" : config.variant === "danger" ? "var(--danger)" : "var(--text-muted)" }}>
                  {config.icon}
                  <StatusBadge variant={config.variant}>{config.label}</StatusBadge>
                </div>
                <code className="text-xs font-mono px-2 py-1 rounded" style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}>
                  {ticket.token}
                </code>
              </div>

              {/* QR code */}
              <div
                className="flex flex-col items-center py-6 rounded-[var(--radius-lg)] relative overflow-hidden"
                style={{ background: ticket.status === "valid" ? "var(--surface-2)" : "#f0f0f4" }}
              >
                {/* QR grid mock */}
                <div
                  className="w-[188px] h-[188px] rounded-xl"
                  style={{ background: ticket.status === "valid" ? "white" : "#e0e0e6", boxShadow: "var(--shadow-sm)", display: "grid", padding: 12 }}
                >
                  {/* Simple QR-like pattern */}
                  <svg width="164" height="164" viewBox="0 0 164 164" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="0" y="0" width="50" height="50" rx="6" fill={ticket.status === "valid" ? "#11142a" : "#aaa"} />
                    <rect x="8" y="8" width="34" height="34" rx="3" fill="white" />
                    <rect x="14" y="14" width="22" height="22" rx="2" fill={ticket.status === "valid" ? "#11142a" : "#aaa"} />
                    <rect x="114" y="0" width="50" height="50" rx="6" fill={ticket.status === "valid" ? "#11142a" : "#aaa"} />
                    <rect x="122" y="8" width="34" height="34" rx="3" fill="white" />
                    <rect x="128" y="14" width="22" height="22" rx="2" fill={ticket.status === "valid" ? "#11142a" : "#aaa"} />
                    <rect x="0" y="114" width="50" height="50" rx="6" fill={ticket.status === "valid" ? "#11142a" : "#aaa"} />
                    <rect x="8" y="122" width="34" height="34" rx="3" fill="white" />
                    <rect x="14" y="128" width="22" height="22" rx="2" fill={ticket.status === "valid" ? "#11142a" : "#aaa"} />
                    {/* deterministic dot pattern */}
                    {[60,74,88,102].map((x, xi) => [60,74,88,102].map((y, yi) =>
                      (xi + yi) % 2 === 0 ? <rect key={`${x}-${y}`} x={x} y={y} width="10" height="10" fill={ticket.status === "valid" ? "#11142a" : "#aaa"} /> : null
                    ))}
                  </svg>
                </div>

                {/* Used / cancelled overlay */}
                {ticket.status !== "valid" && (
                  <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(240,240,244,.7)" }}>
                    <StatusBadge variant={config.variant} style={{ fontSize: 14, padding: "6px 14px" }}>{config.label.toUpperCase()}</StatusBadge>
                  </div>
                )}

                <p className="text-[12px] mt-3 m-0" style={{ color: "var(--text-faint)" }}>{config.message}</p>
              </div>

              {/* Guest + event info */}
              <div className="flex flex-col gap-2.5">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>Guest</span>
                  <span className="text-sm font-bold" style={{ color: "var(--text-strong)" }}>{ticket.guestName}</span>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>{ticket.email}</span>
                </div>
                <div className="flex flex-col gap-1.5 py-3 border-t" style={{ borderColor: "var(--border-hex,#ecedf4)" }}>
                  <span className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
                    <Calendar size={12} style={{ flexShrink: 0 }} /> {ticket.event.date}, {ticket.event.time}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
                    <MapPin size={12} style={{ flexShrink: 0 }} /> {ticket.event.location}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2">
                <Button size="block" variant="soft">
                  <Mail size={13} /> Resend to email
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button size="sm" variant="ghost"><Download size={13} /> Save to wallet</Button>
                  <Button size="sm" variant="ghost"><Share2 size={13} /> Share</Button>
                </div>
              </div>
            </div>
          </div>

          <p className="text-center text-xs" style={{ color: "var(--text-faint)" }}>
            Powered by <Link href="/explore" style={{ color: "var(--primary-hex,#6366f1)", textDecoration: "none", fontWeight: 600 }}>Gatherly</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
