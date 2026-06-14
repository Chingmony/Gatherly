"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createEvent, publishEvent, archiveEvent, deleteEvent } from "@/lib/api/events";
import { ApiError } from "@/lib/api/client";
import type { EventResponse, EventStatus } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";

const STATUS_LABEL: Record<EventStatus, string> = {
  DRAFT: "Draft",
  PUBLIC: "Public",
  ARCHIVED: "Archived",
};

function formatDate(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function EventsManager({ initialEvents }: { initialEvents: EventResponse[] }) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [venue, setVenue] = useState("");
  const [description, setDescription] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  function openModal() {
    setTitle("");
    setVenue("");
    setDescription("");
    setStartsAt("");
    setEndsAt("");
    setError(null);
    setModalOpen(true);
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await createEvent({
        title,
        venue: venue || undefined,
        description: description || undefined,
        startsAt: startsAt ? new Date(startsAt).toISOString() : undefined,
        endsAt: endsAt ? new Date(endsAt).toISOString() : undefined,
      });
      setModalOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create event.");
    } finally {
      setPending(false);
    }
  }

  async function run(id: string, action: () => Promise<unknown>) {
    setBusyId(id);
    try {
      await action();
      router.refresh();
    } catch {
      // list reflects actual state on refresh
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openModal}>Create Event</Button>
      </div>

      <div className="overflow-hidden rounded-[var(--r)] border border-[var(--bo)] bg-[var(--ca)] shadow-[var(--sh)]">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[var(--bo)] text-[10.5px] font-semibold uppercase tracking-[0.06em] text-[var(--t3)]">
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Venue</th>
              <th className="px-4 py-3">Starts</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {initialEvents.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-[13px] text-[var(--t3)]">
                  No events yet.
                </td>
              </tr>
            )}
            {initialEvents.map((ev) => (
              <tr key={ev.id} className="border-b border-[var(--bo)] last:border-0 transition-colors hover:bg-[var(--sidebar-hover)]">
                <td className="px-4 py-3 text-[13px] font-medium">
                  <Link href={`/events/${ev.id}`} className="text-[var(--ac)] hover:underline">
                    {ev.title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-[13px] text-[var(--t2)]">{ev.venue || "—"}</td>
                <td className="px-4 py-3 text-[13px] text-[var(--t2)]">{formatDate(ev.startsAt)}</td>
                <td className="px-4 py-3">
                  <Badge variant={ev.status === "PUBLIC" ? "accent" : "neutral"}>
                    {STATUS_LABEL[ev.status]}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1">
                    {ev.status === "DRAFT" && (
                      <Button variant="ghost" disabled={busyId === ev.id}
                              onClick={() => run(ev.id, () => publishEvent(ev.id))}>
                        Publish
                      </Button>
                    )}
                    {ev.status !== "ARCHIVED" && (
                      <Button variant="ghost" disabled={busyId === ev.id}
                              onClick={() => run(ev.id, () => archiveEvent(ev.id))}>
                        Archive
                      </Button>
                    )}
                    <Button variant="ghost" disabled={busyId === ev.id}
                            onClick={() => run(ev.id, () => deleteEvent(ev.id))}>
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} titleId="create-event-title">
        <h2 id="create-event-title" className="text-[15px] font-bold tracking-[-0.01em] text-[var(--t1)]">
          Create Event
        </h2>
        <p className="mt-1 text-[13px] text-[var(--t2)]">It starts as a draft — publish it when ready.</p>
        <form onSubmit={onCreate} className="mt-4 space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" required value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="venue">Venue</Label>
            <Input id="venue" value={venue} onChange={(e) => setVenue(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-[var(--rs)] border border-[var(--bo)] bg-[var(--ca)] px-3.5 py-2.5 text-[14px] text-[var(--t1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ac)] focus-visible:border-[var(--ac)]"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="startsAt">Starts</Label>
              <input
                id="startsAt"
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="w-full rounded-[var(--rs)] border border-[var(--bo)] bg-[var(--ca)] px-3.5 py-2.5 text-[14px] text-[var(--t1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ac)] focus-visible:border-[var(--ac)]"
              />
            </div>
            <div>
              <Label htmlFor="endsAt">Ends</Label>
              <input
                id="endsAt"
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className="w-full rounded-[var(--rs)] border border-[var(--bo)] bg-[var(--ca)] px-3.5 py-2.5 text-[14px] text-[var(--t1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ac)] focus-visible:border-[var(--ac)]"
              />
            </div>
          </div>
          {error && <p className="text-[13px] font-medium text-[var(--ac-2)]" role="alert">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Creating…" : "Create Event"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
