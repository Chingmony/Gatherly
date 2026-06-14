import Link from "next/link";
import { serverFetch } from "@/lib/api/server";
import { ApiError } from "@/lib/api/client";
import type { PublicEventCard, PublicFormResponse } from "@/lib/api/types";
import { PublicTopbar } from "@/components/public-topbar";
import { EventCover } from "@/components/event-cover";
import { PublicRegisterForm } from "./register-form";

/**
 * Public event page (docs/03 §4.9, design PublicPage): event hero + the dynamic registration form.
 * Resolves the active form by slug (PUBLIC event + ACTIVE form); otherwise a clear closed state.
 */
export default async function PublicEventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  let form: PublicFormResponse | null = null;
  let closed = false;
  try {
    form = await serverFetch<PublicFormResponse>(`/public/events/${slug}/form`);
  } catch (e) {
    if (e instanceof ApiError && (e.status === 404 || e.status === 409)) closed = true;
    else throw e;
  }

  // Card (venue/date/cover) for the hero — best-effort from the public listing.
  let card: PublicEventCard | undefined;
  try {
    const events = await serverFetch<PublicEventCard[]>("/public/events");
    card = events.find((e) => e.slug === slug);
  } catch {
    /* hero falls back to title only */
  }

  return (
    <div className="min-h-screen">
      <PublicTopbar />
      <main className="mx-auto max-w-[820px] px-5 pb-20">
        <Link href="/" className="mt-5 inline-block text-[12px] font-semibold text-[var(--text-faint)] hover:text-[var(--text)]">
          ← All events
        </Link>

        <EventCover gradient={card?.coverGradient} height={170} radius={22} className="mt-3">
          <div className="absolute inset-0 flex flex-col justify-end p-6 text-white">
            {card?.category && (
              <span className="mb-2 w-fit rounded-full bg-black/25 px-2.5 py-1 text-[11px] font-bold backdrop-blur">
                {card.category}
              </span>
            )}
            <h1 className="text-[26px] font-extrabold leading-tight tracking-[-0.01em]">
              {form?.eventTitle ?? card?.title ?? "Event"}
            </h1>
            {card && (
              <p className="mt-1 text-[13px] font-medium text-white/85">
                {formatDate(card.startsAt)}{card.venue ? ` · ${card.venue}` : ""}
              </p>
            )}
          </div>
        </EventCover>

        <div className="mt-6">
          {closed || !form ? (
            <div className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-8 text-center shadow-[var(--shadow-card)]">
              <h2 className="text-[16px] font-bold text-[var(--text-strong)]">Registration isn’t open</h2>
              <p className="mt-1 text-[13px] text-[var(--text-muted)]">
                This event isn’t accepting registrations right now.
              </p>
            </div>
          ) : (
            <PublicRegisterForm eventId={form.eventId} title={form.formTitle} schema={form.schema} />
          )}
        </div>
      </main>
    </div>
  );
}

function formatDate(iso?: string): string {
  if (!iso) return "Date TBA";
  return new Date(iso).toLocaleDateString(undefined, { weekday: "short", year: "numeric", month: "short", day: "numeric" });
}
