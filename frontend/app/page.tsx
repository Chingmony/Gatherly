import { serverFetch } from "@/lib/api/server";
import type { PublicEventCard } from "@/lib/api/types";
import { PublicTopbar } from "@/components/public-topbar";
import { GuestHome } from "./guest-home";

/**
 * Public guest homepage (docs/03 §4.9, design GuestHome): featured-event hero + search bar +
 * grid of PUBLIC events. Guests browse and open an event to register. Unauthenticated —
 * not matched by proxy.ts.
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
        <GuestHome events={events} />
      </main>
    </div>
  );
}
