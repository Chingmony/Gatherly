import Link from "next/link";
import { serverFetch } from "@/lib/api/server";
import { ApiError } from "@/lib/api/client";
import type { PublicEventDetail, PublicFormResponse } from "@/lib/api/types";
import { PublicTopbar } from "@/components/public-topbar";
import { EventDetail } from "./event-detail";

/**
 * Public event page (docs/03 §4.9, design GuestEventDetail): event hero with a Register / Schedule
 * tab switcher. The detail endpoint feeds the hero + Schedule (agenda); the active form (if any)
 * feeds the Register tab. A non-public slug is 404; a closed form yields a clear closed state.
 */
export default async function PublicEventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  let detail: PublicEventDetail | null = null;
  try {
    detail = await serverFetch<PublicEventDetail>(`/public/events/${slug}`);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) detail = null;
    else throw e;
  }

  if (!detail) {
    return (
      <div className="min-h-screen">
        <PublicTopbar />
        <main className="mx-auto max-w-[820px] px-5 pb-20">
          <Link href="/" className="mt-5 inline-block text-[12px] font-semibold text-[var(--text-faint)] hover:text-[var(--text)]">
            ← All events
          </Link>
          <div className="mt-6 rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-8 text-center shadow-[var(--shadow-card)]">
            <h1 className="text-[16px] font-bold text-[var(--text-strong)]">Event not found</h1>
            <p className="mt-1 text-[13px] text-[var(--text-muted)]">This event isn’t available right now.</p>
          </div>
        </main>
      </div>
    );
  }

  // Active registration form for the Register tab — best-effort (closed → null).
  let form: PublicFormResponse | null = null;
  try {
    form = await serverFetch<PublicFormResponse>(`/public/events/${slug}/form`);
  } catch (e) {
    if (e instanceof ApiError && (e.status === 404 || e.status === 409)) form = null;
    else throw e;
  }

  return (
    <div className="min-h-screen">
      <PublicTopbar />
      <main className="mx-auto max-w-[1040px] px-5 pb-20">
        <Link href="/" className="mt-5 inline-block text-[12px] font-semibold text-[var(--text-faint)] hover:text-[var(--text)]">
          ← All events
        </Link>
        <EventDetail detail={detail} form={form} />
      </main>
    </div>
  );
}
