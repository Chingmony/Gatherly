import type { Metadata } from "next";
import { cookies } from "next/headers";
import { EventsView } from "./events-view";
import { HandlerEvents } from "./_components/handler-events";

export const metadata: Metadata = { title: "Events" };

export default async function AllEventsPage() {
  // Handlers get a read-only list of their assigned events; admin/manager get the
  // full management view. The role cookie is the same UX hint `proxy.ts` reads —
  // the backend @PreAuthorize is the real authority on the data either way.
  const role = (await cookies()).get("gatherly_role")?.value;
  if (role === "handler") return <HandlerEvents />;
  return <EventsView />;
}
