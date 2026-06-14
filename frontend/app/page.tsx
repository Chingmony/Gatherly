import Link from "next/link";
import { serverFetch } from "@/lib/api/server";
import type { PublicEventCard } from "@/lib/api/types";
import { PublicTopbar } from "@/components/public-topbar";
import { EventCover } from "@/components/event-cover";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/motion/reveal";

/**
 * Public guest homepage (docs/03 §4.9, design GuestHome): hero + grid of PUBLIC events. Guests
 * browse and open an event to register. Unauthenticated — not matched by proxy.ts.
 */
export default async function HomePage() {
  let events: PublicEventCard[] = [];
  try {
    events = await serverFetch<PublicEventCard[]>("/public/events");
  } catch {
    events = [];
  }

  return (
    <div className="min-h-screen">
      <PublicTopbar />
      <main className="mx-auto max-w-[1100px] px-5 pb-20">
        {/* Hero */}
        <Reveal>
          <section
            className="relative mt-6 overflow-hidden rounded-[var(--radius-xl)] p-10 text-white sm:p-14"
            style={{ background: "linear-gradient(135deg, #6d6bf5, #8b5cf6 55%, #ec4899)" }}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{ background: "radial-gradient(420px 220px at 85% 0%, rgba(255,255,255,.25), transparent 70%)" }}
            />
            <div className="relative max-w-xl">
              <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-white/70">Gatherly</p>
              <h1 className="mt-2 text-[34px] font-extrabold leading-[1.08] tracking-[-0.02em] sm:text-[42px]">
                Find your next event.
              </h1>
              <p className="mt-3 max-w-md text-[15px] font-medium text-white/85">
                Browse upcoming public events and register in seconds — your QR ticket is ready the moment you join.
              </p>
            </div>
          </section>
        </Reveal>

        {/* Listings */}
        <div className="mt-9 mb-4 flex items-baseline justify-between">
          <h2 className="text-[18px] font-extrabold tracking-[-0.01em] text-[var(--text-strong)]">Upcoming events</h2>
          <span className="text-[12px] font-semibold text-[var(--text-faint)]">{events.length} public</span>
        </div>

        {events.length === 0 ? (
          <div className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-10 text-center text-[14px] text-[var(--text-muted)] shadow-[var(--shadow-card)]">
            No public events yet — check back soon.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((ev, i) => (
              <Reveal key={ev.id} delay={Math.min(i * 0.04, 0.24)}>
                <Link
                  href={`/e/${ev.slug}`}
                  className="group block overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)] transition-transform hover:-translate-y-0.5"
                >
                  <EventCover gradient={ev.coverGradient} height={120} radius={0}>
                    {ev.category && (
                      <span className="absolute left-3 top-3 rounded-full bg-black/25 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur">
                        {ev.category}
                      </span>
                    )}
                  </EventCover>
                  <div className="p-4">
                    <h3 className="truncate text-[15px] font-bold text-[var(--text-strong)]">{ev.title}</h3>
                    <p className="mt-1 text-[12.5px] font-medium text-[var(--text-muted)]">
                      {formatDate(ev.startsAt)}{ev.venue ? ` · ${ev.venue}` : ""}
                    </p>
                    <div className="mt-3 flex items-center justify-between">
                      <Badge variant="green" dot={false}>
                        {ev.registered}{ev.capacity ? ` / ${ev.capacity}` : ""} registered
                      </Badge>
                      <span className="text-[13px] font-bold text-[var(--primary)] group-hover:underline">Register →</span>
                    </div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function formatDate(iso?: string): string {
  if (!iso) return "Date TBA";
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}
