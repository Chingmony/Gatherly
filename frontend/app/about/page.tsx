import type { Metadata } from "next";
import Link from "next/link";
import { PublicTopbar } from "@/components/public-topbar";
import { Reveal } from "@/components/motion/reveal";

export const metadata: Metadata = {
  title: "About · Gatherly",
  description:
    "Gatherly is an event-management platform — public registration, unique QR tickets by email, and a one-scan check-in at the door.",
};

/**
 * About / product page (public). Static marketing surface that explains what Gatherly is, how the
 * guest QR-ticket flow works, the role hierarchy that runs each event, and the headline features.
 * Pure presentation — no data fetch — kept on the shared design tokens + aurora hero motif.
 */
export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <PublicTopbar />
      <main className="mx-auto max-w-[1100px] px-5 pb-24">
        {/* Hero — full-bleed branded aurora */}
        <section className="relative left-1/2 right-1/2 -mx-[50vw] w-screen overflow-hidden">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(180deg, var(--primary-soft) 0%, transparent 60%)" }}
            />
            <div
              className="hero-orb hero-orb-a absolute"
              style={{
                top: "-90px",
                left: "10%",
                width: 320,
                height: 320,
                background: "radial-gradient(circle at 30% 30%, var(--primary), transparent 68%)",
                opacity: 0.26,
                filter: "blur(36px)",
              }}
            />
            <div
              className="hero-orb hero-orb-b absolute"
              style={{
                top: "-30px",
                right: "6%",
                width: 340,
                height: 340,
                background: "radial-gradient(circle at 60% 40%, var(--pink), var(--orange) 70%, transparent 72%)",
                opacity: 0.2,
                filter: "blur(40px)",
              }}
            />
          </div>

          <div className="relative mx-auto max-w-[1100px] px-5 py-16 text-center sm:py-24">
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3.5 py-1.5 text-[12px] font-bold text-[var(--text-muted)] shadow-[var(--shadow-sm)]">
                <SparkIcon /> One organization · every event
              </span>
            </Reveal>
            <Reveal delay={0.05}>
              <h1 className="mx-auto mt-5 max-w-3xl text-[40px] font-extrabold leading-[1.04] tracking-[-0.03em] text-[var(--text-strong)] sm:text-[56px]">
                Events that run themselves, from <span className="text-grad">sign-up to scan-in</span>.
              </h1>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mx-auto mt-5 max-w-xl text-[16px] font-medium leading-relaxed text-[var(--text-muted)]">
                Gatherly is an event-management platform for a single organization. Guests register
                through a custom form, get a unique QR ticket by email, and walk in with a single scan —
                while organizers stay in control end to end.
              </p>
            </Reveal>
            <Reveal delay={0.15}>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link
                  href="/#events"
                  className="inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--primary)] px-6 py-3 text-[14px] font-bold text-white shadow-[var(--shadow-glow)] transition-transform hover:-translate-y-0.5"
                >
                  Browse events →
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[var(--surface)] px-6 py-3 text-[14px] font-bold text-[var(--text)] transition-colors hover:border-[var(--primary-ring)] hover:text-[var(--primary)]"
                >
                  Organizer sign in
                </Link>
              </div>
            </Reveal>
          </div>
        </section>

        {/* How it works — guest flow */}
        <Reveal delay={0.05}>
          <section className="mt-16">
            <SectionHeading eyebrow="For guests" title="Three steps to the door" />
            <ol className="mt-7 grid gap-4 sm:grid-cols-3">
              <FlowStep n={1} title="Register" icon={<PenIcon />}>
                Open a public event and fill its form. Free to attend — no payment, no account.
              </FlowStep>
              <FlowStep n={2} title="Get your QR" icon={<QrIcon />}>
                A cryptographically unique, single-use ticket arrives in your inbox instantly.
              </FlowStep>
              <FlowStep n={3} title="Scan in" icon={<ScanIcon />}>
                Show the QR at the venue — one scan confirms attendance, and it can’t be reused.
              </FlowStep>
            </ol>
          </section>
        </Reveal>

        {/* Features */}
        <Reveal delay={0.05}>
          <section className="mt-20">
            <SectionHeading eyebrow="What’s inside" title="Everything an event needs" />
            <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Feature icon={<QrIcon />} title="Unique QR tickets">
                Every registration mints a secure single-use token, emailed as a QR — no double entry,
                no door-rush duplicates.
              </Feature>
              <Feature icon={<BoltIcon />} title="Live check-in">
                Organizers scan at the gate and attendance updates in real time, with each confirmation
                forwarded to a Telegram ops channel.
              </Feature>
              <Feature icon={<FormIcon />} title="Dynamic forms">
                Build a registration form per event — fields, ordering, validation — without a single
                database migration.
              </Feature>
              <Feature icon={<UsersIcon />} title="Delegated roles">
                Admins hand individual events to Sub-admins, who delegate tasks to Handlers — control
                without bottlenecks.
              </Feature>
              <Feature icon={<ClipboardIcon />} title="Materials &amp; tasks">
                Track every supply and task across a clear five-state workflow with a full audit trail.
              </Feature>
              <Feature icon={<ShieldIcon />} title="Secure by default">
                Stateless JWT sessions, two-layer authorization, and default-deny on every endpoint.
              </Feature>
            </div>
          </section>
        </Reveal>

        {/* Roles */}
        <Reveal delay={0.05}>
          <section className="mt-20">
            <SectionHeading eyebrow="The hierarchy" title="Built for everyone running the event" />
            <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <RoleCard tone="primary" title="Admin" sub="Full control">
                Creates and publishes events, manages users and the global supply catalog, and appoints
                Sub-admins.
              </RoleCard>
              <RoleCard tone="violet" title="Sub-admin" sub="Runs an event">
                Manages assigned events — details, guests, attendance — and delegates Handlers, without
                destructive global powers.
              </RoleCard>
              <RoleCard tone="blue" title="Handler" sub="Gets it done">
                Owns assigned materials and tasks, advancing each through its workflow and flagging
                issues as they arise.
              </RoleCard>
              <RoleCard tone="green" title="Guest" sub="Just attends">
                Registers in seconds, holds a QR ticket, and walks straight in — no account required.
              </RoleCard>
            </div>
          </section>
        </Reveal>

        {/* CTA band */}
        <Reveal delay={0.05}>
          <section className="relative mt-20 overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-10 text-center shadow-[var(--shadow-card)] sm:p-14">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 -z-10"
              style={{ background: "radial-gradient(600px 200px at 50% 0%, var(--primary-soft), transparent 70%)" }}
            />
            <h2 className="text-[26px] font-extrabold tracking-[-0.02em] text-[var(--text-strong)] sm:text-[32px]">
              Find something worth showing up for.
            </h2>
            <p className="mx-auto mt-3 max-w-md text-[15px] font-medium text-[var(--text-muted)]">
              Browse what’s on now and grab your QR ticket — it only takes a moment.
            </p>
            <Link
              href="/#events"
              className="mt-7 inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--primary)] px-7 py-3.5 text-[15px] font-bold text-white shadow-[var(--shadow-glow)] transition-transform hover:-translate-y-0.5"
            >
              Browse events →
            </Link>
          </section>
        </Reveal>
      </main>
    </div>
  );
}

// ---- Building blocks -------------------------------------------------------

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="text-center">
      <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[var(--primary)]">{eyebrow}</p>
      <h2 className="mt-2 text-[26px] font-extrabold tracking-[-0.02em] text-[var(--text-strong)] sm:text-[32px]">
        {title}
      </h2>
    </div>
  );
}

function FlowStep({
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
    <li className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-[var(--radius-md)] bg-[var(--primary-soft)] text-[var(--primary)]">
          {icon}
        </span>
        <span className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-[var(--text-faint)]">
          Step {n}
        </span>
      </div>
      <h3 className="mt-3 text-[16px] font-extrabold text-[var(--text-strong)]">{title}</h3>
      <p className="mt-1 text-[13px] font-medium leading-relaxed text-[var(--text-muted)]">{children}</p>
    </li>
  );
}

function Feature({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] transition-transform hover:-translate-y-0.5">
      <span className="grid h-11 w-11 place-items-center rounded-[var(--radius-md)] bg-[var(--primary-soft)] text-[var(--primary)]">
        {icon}
      </span>
      <h3 className="mt-4 text-[15.5px] font-extrabold text-[var(--text-strong)]">{title}</h3>
      <p className="mt-1.5 text-[13.5px] font-medium leading-relaxed text-[var(--text-muted)]">{children}</p>
    </div>
  );
}

const ROLE_TONES = {
  primary: { soft: "var(--primary-soft)", fg: "var(--primary)" },
  violet: { soft: "var(--violet-soft)", fg: "var(--violet)" },
  blue: { soft: "var(--blue-soft)", fg: "var(--blue)" },
  green: { soft: "var(--green-soft)", fg: "var(--green-600)" },
} as const;

function RoleCard({
  tone,
  title,
  sub,
  children,
}: {
  tone: keyof typeof ROLE_TONES;
  title: string;
  sub: string;
  children: React.ReactNode;
}) {
  const t = ROLE_TONES[tone];
  return (
    <div className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
      <span
        className="inline-flex rounded-full px-3 py-1 text-[11.5px] font-extrabold uppercase tracking-[0.08em]"
        style={{ background: t.soft, color: t.fg }}
      >
        {title}
      </span>
      <p className="mt-3 text-[13px] font-bold text-[var(--text-strong)]">{sub}</p>
      <p className="mt-1 text-[13px] font-medium leading-relaxed text-[var(--text-muted)]">{children}</p>
    </div>
  );
}

// ---- Icons -----------------------------------------------------------------

function SparkIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
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
function BoltIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}
function FormIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="3" width="16" height="18" rx="2.5" stroke="currentColor" strokeWidth="2" />
      <path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function UsersIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="9" cy="8" r="3.2" stroke="currentColor" strokeWidth="2" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0M16 5.2a3.2 3.2 0 0 1 0 5.6M17.5 19a5.5 5.5 0 0 0-2.3-4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function ClipboardIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="5" y="4" width="14" height="17" rx="2.5" stroke="currentColor" strokeWidth="2" />
      <path d="M9 4a3 3 0 0 1 6 0M9 12l1.6 1.6L14 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ShieldIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 3l7 3v5c0 4.4-3 8.3-7 9.6C8 19.3 5 15.4 5 11V6l7-3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
