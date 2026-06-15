import type { Metadata } from "next";
import Link from "next/link";
import { PublicTopbar } from "@/components/public-topbar";
import { Reveal } from "@/components/motion/reveal";
import { TicketFinder } from "./ticket-finder";

export const metadata: Metadata = {
  title: "Your tickets · Gatherly",
  description: "Find and open your Gatherly event ticket — your unique QR is emailed the moment you register.",
};

/**
 * Tickets landing (docs/03 §4.9). Guests are unauthenticated, so this is a "find your ticket" entry
 * point: paste the emailed link/code to open the live QR ticket, plus a short explainer of how the
 * single-use QR flow works end to end.
 */
export default function TicketsPage() {
  return (
    <div className="min-h-screen">
      <PublicTopbar />
      <main className="mx-auto max-w-[680px] px-5 pb-24">
        {/* Header */}
        <section className="relative overflow-hidden pt-12 text-center sm:pt-16">
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            <div
              className="hero-orb hero-orb-a absolute"
              style={{
                top: "-70px",
                left: "12%",
                width: 240,
                height: 240,
                background: "radial-gradient(circle at 40% 40%, var(--primary), transparent 68%)",
                opacity: 0.2,
                filter: "blur(38px)",
              }}
            />
            <div
              className="hero-orb hero-orb-b absolute"
              style={{
                top: "-50px",
                right: "10%",
                width: 260,
                height: 260,
                background: "radial-gradient(circle at 60% 40%, var(--violet), transparent 70%)",
                opacity: 0.16,
                filter: "blur(42px)",
              }}
            />
          </div>

          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3.5 py-1.5 text-[12px] font-bold text-[var(--text-muted)] shadow-[var(--shadow-sm)]">
              <TicketIcon /> Single-use QR tickets
            </span>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 className="mt-5 text-[34px] font-extrabold leading-[1.06] tracking-[-0.02em] text-[var(--text-strong)] sm:text-[44px]">
              Find your <span className="text-grad">ticket</span>.
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mx-auto mt-4 max-w-md text-[15px] font-medium leading-relaxed text-[var(--text-muted)]">
              Your ticket lives in the link we emailed you. Paste that link — or just the ticket code —
              to open your live QR and check its status.
            </p>
          </Reveal>
        </section>

        {/* Finder */}
        <Reveal delay={0.14}>
          <div className="mt-8 rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)] sm:p-7">
            <TicketFinder />
            <p className="mt-4 flex items-start gap-2 text-[12.5px] text-[var(--text-faint)]">
              <MailIcon />
              Can’t find the email? Check your spam folder, or re-register from the event page to get a
              fresh ticket.
            </p>
          </div>
        </Reveal>

        {/* How it works */}
        <Reveal delay={0.18}>
          <div className="mt-12">
            <h2 className="text-center text-[13px] font-bold uppercase tracking-[0.14em] text-[var(--text-faint)]">
              How your ticket works
            </h2>
            <ol className="mt-5 grid gap-4 sm:grid-cols-3">
              <Step n={1} title="Register" icon={<PenIcon />}>
                Fill the event’s form. It’s free — no payment, no account needed.
              </Step>
              <Step n={2} title="Get your QR" icon={<QrIcon />}>
                A unique single-use QR ticket is emailed to you instantly.
              </Step>
              <Step n={3} title="Scan in" icon={<ScanIcon />}>
                Show it at the entrance — an organizer scans it to confirm you’re in.
              </Step>
            </ol>
          </div>
        </Reveal>

        <Reveal delay={0.22}>
          <p className="mt-12 text-center text-[14px] font-medium text-[var(--text-muted)]">
            Haven’t registered yet?{" "}
            <Link href="/#events" className="font-bold text-[var(--primary)] hover:underline">
              Browse upcoming events →
            </Link>
          </p>
        </Reveal>
      </main>
    </div>
  );
}

function Step({
  n,
  title,
  icon,
  children,
}: {
  n: number;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <li className="relative rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-[var(--radius-md)] bg-[var(--primary-soft)] text-[var(--primary)]">
          {icon}
        </span>
        <span className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-[var(--text-faint)]">
          Step {n}
        </span>
      </div>
      <h3 className="mt-3 text-[15px] font-extrabold text-[var(--text-strong)]">{title}</h3>
      <p className="mt-1 text-[13px] font-medium leading-relaxed text-[var(--text-muted)]">{children}</p>
    </li>
  );
}

function TicketIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h13A1.5 1.5 0 0 1 20 8.5v2a2 2 0 0 0 0 4v2A1.5 1.5 0 0 1 18.5 18h-13A1.5 1.5 0 0 1 4 16.5v-2a2 2 0 0 0 0-4v-2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}
function MailIcon() {
  return (
    <svg className="mt-0.5 shrink-0" width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2.5" stroke="currentColor" strokeWidth="2" />
      <path d="m4 7 8 6 8-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function PenIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17v3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="m14 7 3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function QrIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M14 14h3v3M21 14v7M17 21h-3M21 18h-1.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function ScanIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M4 12h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
