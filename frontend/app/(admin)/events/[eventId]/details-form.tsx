"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateEvent } from "@/lib/api/events";
import { ApiError } from "@/lib/api/client";
import type { EventResponse } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { coverGradient, COVER_KEYS } from "@/lib/covers";

const FIELD =
  "w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-2.5 text-[14px] text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:border-[var(--primary)]";

function isoToLocal(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
function localToIso(local: string): string | undefined {
  if (!local) return undefined;
  const d = new Date(local);
  return isNaN(d.getTime()) ? undefined : d.toISOString();
}

/** Event Details tab (docs/03 §4.4): editable event fields incl. scheduling + cover. */
export function DetailsForm({ event }: { event: EventResponse }) {
  const router = useRouter();
  const [title, setTitle] = useState(event.title);
  const [venue, setVenue] = useState(event.venue ?? "");
  const [category, setCategory] = useState(event.category ?? "");
  const [capacity, setCapacity] = useState(event.capacity != null ? String(event.capacity) : "");
  const [cover, setCover] = useState(event.coverGradient ?? "a");
  const [description, setDescription] = useState(event.description ?? "");
  const [startsAt, setStartsAt] = useState(isoToLocal(event.startsAt));
  const [endsAt, setEndsAt] = useState(isoToLocal(event.endsAt));
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setSaving(true);
    try {
      await updateEvent(event.id, {
        title,
        venue: venue || undefined,
        category: category || undefined,
        capacity: capacity ? Number(capacity) : undefined,
        coverGradient: cover,
        description: description || undefined,
        startsAt: localToIso(startsAt),
        endsAt: localToIso(endsAt),
      });
      setMsg({ ok: true, text: "Saved." });
      router.refresh();
    } catch (err) {
      setMsg({ ok: false, text: err instanceof ApiError ? err.message : "Could not save." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSave} className="space-y-4">
      <div><Label htmlFor="t">Title</Label><Input id="t" required value={title} onChange={(e) => setTitle(e.target.value)} /></div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div><Label htmlFor="cat">Category</Label><Input id="cat" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Conference" /></div>
        <div><Label htmlFor="cap">Capacity</Label><Input id="cap" type="number" min={0} value={capacity} onChange={(e) => setCapacity(e.target.value)} placeholder="Unlimited" /></div>
      </div>
      <div><Label htmlFor="v">Venue</Label><Input id="v" value={venue} onChange={(e) => setVenue(e.target.value)} /></div>
      <div>
        <Label>Cover</Label>
        <div className="flex gap-2">
          {COVER_KEYS.map((k) => (
            <button type="button" key={k} aria-label={`Cover ${k}`} onClick={() => setCover(k)}
              className="h-8 w-12 rounded-[8px]"
              style={{ background: coverGradient(k), outline: cover === k ? "2px solid var(--primary)" : "none", outlineOffset: 2 }} />
          ))}
        </div>
      </div>
      <div><Label htmlFor="d">Description</Label><textarea id="d" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className={FIELD} /></div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div><Label htmlFor="s">Starts</Label><input id="s" type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className={FIELD} /></div>
        <div><Label htmlFor="e">Ends</Label><input id="e" type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} className={FIELD} /></div>
      </div>
      {msg && <p role={msg.ok ? "status" : "alert"} className={`text-[13px] font-semibold ${msg.ok ? "text-[var(--green-600)]" : "text-[var(--danger)]"}`}>{msg.text}</p>}
      <div className="flex justify-end"><Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save details"}</Button></div>
    </form>
  );
}
