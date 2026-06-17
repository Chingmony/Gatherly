import type { Metadata } from "next";
import Link from "next/link";
import {
  QrCode,
  Zap,
  ShieldCheck,
  ScanLine,
  Mail,
  CalendarCheck,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicShell } from "../public-chrome";

export const metadata: Metadata = { title: "About Gatherly" };

const FEATURES = [
  {
    icon: <Zap size={20} />,
    title: "Register in seconds",
    body: "Public events take seconds to join — no account required. Fill a short form and you're in.",
  },
  {
    icon: <QrCode size={20} />,
    title: "Instant QR tickets",
    body: "A unique, single-scan QR ticket is generated and emailed the moment you register.",
  },
  {
    icon: <Mail size={20} />,
    title: "Delivered to your inbox",
    body: "Your ticket lands in your email instantly, with an on-screen fallback you can revisit anytime.",
  },
  {
    icon: <ScanLine size={20} />,
    title: "Effortless check-in",
    body: "Organizers scan your QR at the door. Each ticket checks in exactly once — no duplicates.",
  },
  {
    icon: <ShieldCheck size={20} />,
    title: "Built for organizers",
    body: "Role-based access lets teams manage events, handlers, and check-in with the right permissions.",
  },
  {
    icon: <CalendarCheck size={20} />,
    title: "One place for events",
    body: "Browse, filter, and discover upcoming public events — all from a single, fast experience.",
  },
];

const STEPS = [
  { n: "1", title: "Discover", body: "Browse public events and find the one you want to attend." },
  { n: "2", title: "Register", body: "Complete a quick form — email and phone are all that's required." },
  { n: "3", title: "Get your QR", body: "Your unique ticket arrives by email and on screen instantly." },
  { n: "4", title: "Check in", body: "Show the QR at the entrance and you're through the door." },
];

export default function AboutPage() {
  return (
    <PublicShell>
      <div className="mx-auto flex max-w-[1200px] flex-col gap-16 px-6 py-12 md:px-10 md:py-16">
        {/* Hero */}
        <section className="flex flex-col items-center gap-5 text-center">
          <span
            className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-bold"
            style={{ background: "var(--surface)", color: "var(--text-muted)", boxShadow: "var(--shadow-card)" }}
          >
            About Gatherly
          </span>
          <h1
            className="m-0 max-w-2xl text-[36px] font-extrabold leading-[1.05] tracking-tight md:text-[48px]"
            style={{ color: "var(--text-strong)" }}
          >
            Events that are{" "}
            <span
              style={{
                background: "linear-gradient(100deg, #7c5cf0 0%, #9b6df0 45%, #ec4899 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              effortless
            </span>{" "}
            to join.
          </h1>
          <p className="m-0 max-w-xl text-[15px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
            Gatherly is an event management platform built around one promise: find an event, register in moments, and
            get a unique QR ticket the instant you join. No clutter, no friction.
          </p>
          <div className="mt-1 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/#events">
                Browse events <ArrowRight size={16} />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/tickets">Find my ticket</Link>
            </Button>
          </div>
        </section>

        {/* Feature grid */}
        <section className="flex flex-col gap-6">
          <h2 className="m-0 text-[24px] font-extrabold tracking-tight" style={{ color: "var(--text-strong)" }}>
            What makes it work
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="flex flex-col gap-3 rounded-[var(--radius-xl)] border p-6"
                style={{ background: "var(--surface)", borderColor: "var(--border-hex,#ecedf4)", boxShadow: "var(--shadow-card)" }}
              >
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)]"
                  style={{ background: "var(--primary-soft)", color: "var(--primary-hex,#6366f1)" }}
                >
                  {f.icon}
                </span>
                <h3 className="m-0 text-base font-bold" style={{ color: "var(--text-strong)" }}>
                  {f.title}
                </h3>
                <p className="m-0 text-[14px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="flex flex-col gap-6">
          <h2 className="m-0 text-[24px] font-extrabold tracking-tight" style={{ color: "var(--text-strong)" }}>
            How it works
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s) => (
              <div
                key={s.n}
                className="flex flex-col gap-3 rounded-[var(--radius-xl)] border p-6"
                style={{ background: "var(--surface)", borderColor: "var(--border-hex,#ecedf4)" }}
              >
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-extrabold text-white"
                  style={{ background: "var(--primary-hex,#6366f1)" }}
                >
                  {s.n}
                </span>
                <h3 className="m-0 text-base font-bold" style={{ color: "var(--text-strong)" }}>
                  {s.title}
                </h3>
                <p className="m-0 text-[14px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section
          className="relative overflow-hidden rounded-[var(--radius-xl)] px-8 py-12 text-center md:px-12"
          style={{
            background: "linear-gradient(115deg, #6366f1 0%, #7c5cf0 42%, #9b6df0 70%, #6f8bf5 100%)",
            boxShadow: "var(--shadow-glow)",
          }}
        >
          <div className="relative mx-auto flex max-w-xl flex-col items-center gap-4">
            <h2 className="m-0 text-[28px] font-extrabold leading-tight md:text-[32px]" style={{ color: "#fff" }}>
              Ready to find your next event?
            </h2>
            <p className="m-0 text-[15px] leading-relaxed" style={{ color: "rgba(255,255,255,0.86)" }}>
              Browse what&apos;s coming up and grab your QR ticket in under a minute.
            </p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg" variant="soft">
                <Link href="/#events">
                  Browse events <ArrowRight size={16} />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/40 bg-white/10 text-white hover:bg-white/20"
              >
                <Link href="/login">Organizer sign in</Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </PublicShell>
  );
}
