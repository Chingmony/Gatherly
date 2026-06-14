"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateEvent, publishEvent, archiveEvent, deleteEvent } from "@/lib/api/events";
import { saveAgenda } from "@/lib/api/agenda";
import { ApiError } from "@/lib/api/client";
import type {
  AgendaResponse,
  AgendaTemplateResponse,
  EventResponse,
  EventStatus,
} from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const STATUS_LABEL: Record<EventStatus, string> = { DRAFT: "Draft", PUBLIC: "Public", ARCHIVED: "Archived" };

/** ISO → value for <input type="datetime-local"> (local time, minute precision). */
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

interface AgendaRow {
  title: string;
  startsAt: string; // datetime-local
  endsAt: string;
}

export function EventWorkspace({
  event,
  agenda,
  templates,
}: {
  event: EventResponse;
  agenda: AgendaResponse;
  templates: AgendaTemplateResponse[];
}) {
  const router = useRouter();

  // ---- Event details ----
  const [title, setTitle] = useState(event.title);
  const [venue, setVenue] = useState(event.venue ?? "");
  const [description, setDescription] = useState(event.description ?? "");
  const [startsAt, setStartsAt] = useState(isoToLocal(event.startsAt));
  const [endsAt, setEndsAt] = useState(isoToLocal(event.endsAt));
  const [detailMsg, setDetailMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [savingDetail, setSavingDetail] = useState(false);
  const [busy, setBusy] = useState(false);

  // ---- Agenda ----
  const [rows, setRows] = useState<AgendaRow[]>(
    agenda.items.map((i) => ({ title: i.title, startsAt: isoToLocal(i.startsAt), endsAt: isoToLocal(i.endsAt) })),
  );
  const [agendaMsg, setAgendaMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [savingAgenda, setSavingAgenda] = useState(false);
  const [templateId, setTemplateId] = useState("");

  async function onSaveDetails(e: React.FormEvent) {
    e.preventDefault();
    setDetailMsg(null);
    setSavingDetail(true);
    try {
      await updateEvent(event.id, {
        title,
        venue: venue || undefined,
        description: description || undefined,
        startsAt: localToIso(startsAt),
        endsAt: localToIso(endsAt),
      });
      setDetailMsg({ ok: true, text: "Saved." });
      router.refresh();
    } catch (err) {
      setDetailMsg({ ok: false, text: err instanceof ApiError ? err.message : "Could not save." });
    } finally {
      setSavingDetail(false);
    }
  }

  async function runStatus(action: () => Promise<unknown>, after?: () => void) {
    setBusy(true);
    try {
      await action();
      if (after) after();
      else router.refresh();
    } catch {
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  // ---- Agenda editing ----
  function addRow() {
    setRows((r) => [...r, { title: "", startsAt: "", endsAt: "" }]);
  }
  function removeRow(idx: number) {
    setRows((r) => r.filter((_, i) => i !== idx));
  }
  function move(idx: number, dir: -1 | 1) {
    setRows((r) => {
      const next = [...r];
      const j = idx + dir;
      if (j < 0 || j >= next.length) return r;
      [next[idx], next[j]] = [next[j], next[idx]];
      return next;
    });
  }
  function setRow(idx: number, patch: Partial<AgendaRow>) {
    setRows((r) => r.map((row, i) => (i === idx ? { ...row, ...patch } : row)));
  }

  function applyTemplate() {
    const tpl = templates.find((t) => t.id === templateId);
    if (!tpl) return;
    const ordered = [...tpl.items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    // Compute sequential times from the event start when available.
    let cursor = event.startsAt ? new Date(event.startsAt) : null;
    const next: AgendaRow[] = ordered.map((it) => {
      let s = "";
      let e = "";
      if (cursor) {
        s = isoToLocal(cursor.toISOString());
        const end = new Date(cursor.getTime() + (it.durationMin ?? 0) * 60000);
        e = isoToLocal(end.toISOString());
        cursor = end;
      }
      return { title: it.title, startsAt: s, endsAt: e };
    });
    setRows(next);
    setAgendaMsg({ ok: true, text: `Applied “${tpl.name}” — review and save.` });
  }

  async function onSaveAgenda() {
    setAgendaMsg(null);
    setSavingAgenda(true);
    try {
      await saveAgenda(event.id, {
        items: rows
          .filter((r) => r.title.trim())
          .map((r) => ({ title: r.title.trim(), startsAt: localToIso(r.startsAt), endsAt: localToIso(r.endsAt) })),
      });
      setAgendaMsg({ ok: true, text: "Agenda saved." });
      router.refresh();
    } catch (err) {
      setAgendaMsg({ ok: false, text: err instanceof ApiError ? err.message : "Could not save agenda." });
    } finally {
      setSavingAgenda(false);
    }
  }

  const card = "rounded-[var(--r)] border border-[var(--bo)] bg-[var(--ca)] p-6 shadow-[var(--sh)]";
  const field =
    "w-full rounded-[var(--rs)] border border-[var(--bo)] bg-[var(--ca)] px-3.5 py-2.5 text-[14px] text-[var(--t1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ac)] focus-visible:border-[var(--ac)]";

  return (
    <div className="space-y-5">
      {/* Header + lifecycle actions */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-[20px] font-bold tracking-[-0.01em] text-[var(--t1)]">{event.title}</h1>
          <p className="text-[12px] font-medium text-[var(--t3)]">/{event.slug}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={event.status === "PUBLIC" ? "accent" : "neutral"}>{STATUS_LABEL[event.status]}</Badge>
          {event.status === "DRAFT" && (
            <Button variant="secondary" disabled={busy} onClick={() => runStatus(() => publishEvent(event.id))}>
              Publish
            </Button>
          )}
          {event.status !== "ARCHIVED" && (
            <Button variant="secondary" disabled={busy} onClick={() => runStatus(() => archiveEvent(event.id))}>
              Archive
            </Button>
          )}
          <Button
            variant="destructive"
            disabled={busy}
            onClick={() => runStatus(() => deleteEvent(event.id), () => router.push("/events"))}
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Details / scheduling */}
      <form onSubmit={onSaveDetails} className={`space-y-4 ${card}`}>
        <h2 className="text-[14px] font-bold text-[var(--t1)]">Details</h2>
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
          <textarea id="description" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className={field} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="startsAt">Starts</Label>
            <input id="startsAt" type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className={field} />
          </div>
          <div>
            <Label htmlFor="endsAt">Ends</Label>
            <input id="endsAt" type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} className={field} />
          </div>
        </div>
        {detailMsg && (
          <p className={`text-[13px] font-medium ${detailMsg.ok ? "text-[var(--ac)]" : "text-[var(--ac-2)]"}`} role={detailMsg.ok ? "status" : "alert"}>
            {detailMsg.text}
          </p>
        )}
        <div className="flex justify-end">
          <Button type="submit" disabled={savingDetail}>{savingDetail ? "Saving…" : "Save details"}</Button>
        </div>
      </form>

      {/* Agenda */}
      <div className={`space-y-4 ${card}`}>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[14px] font-bold text-[var(--t1)]">Agenda</h2>
          <div className="flex items-center gap-2">
            <select value={templateId} onChange={(e) => setTemplateId(e.target.value)} className={`${field} w-auto py-2`}>
              <option value="">Apply a template…</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>{t.name}{t.isDefault ? " (default)" : ""}</option>
              ))}
            </select>
            <Button type="button" variant="secondary" disabled={!templateId} onClick={applyTemplate}>Apply</Button>
          </div>
        </div>

        {rows.length === 0 && <p className="text-[13px] text-[var(--t3)]">No agenda items yet.</p>}

        <div className="space-y-3">
          {rows.map((row, idx) => (
            <div key={idx} className="rounded-[var(--rs)] border border-[var(--bo)] p-3">
              <div className="flex items-start gap-2">
                <div className="flex-1 space-y-2">
                  <Input
                    placeholder={`Item ${idx + 1} title`}
                    value={row.title}
                    onChange={(e) => setRow(idx, { title: e.target.value })}
                  />
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <input type="datetime-local" value={row.startsAt} onChange={(e) => setRow(idx, { startsAt: e.target.value })} className={field} aria-label="Start" />
                    <input type="datetime-local" value={row.endsAt} onChange={(e) => setRow(idx, { endsAt: e.target.value })} className={field} aria-label="End" />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <Button type="button" variant="ghost" disabled={idx === 0} onClick={() => move(idx, -1)} aria-label="Move up">↑</Button>
                  <Button type="button" variant="ghost" disabled={idx === rows.length - 1} onClick={() => move(idx, 1)} aria-label="Move down">↓</Button>
                  <Button type="button" variant="ghost" onClick={() => removeRow(idx)} aria-label="Remove">✕</Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {agendaMsg && (
          <p className={`text-[13px] font-medium ${agendaMsg.ok ? "text-[var(--ac)]" : "text-[var(--ac-2)]"}`} role={agendaMsg.ok ? "status" : "alert"}>
            {agendaMsg.text}
          </p>
        )}
        <div className="flex justify-between">
          <Button type="button" variant="secondary" onClick={addRow}>+ Add item</Button>
          <Button type="button" disabled={savingAgenda} onClick={onSaveAgenda}>{savingAgenda ? "Saving…" : "Save agenda"}</Button>
        </div>
      </div>

      {/* Roadmap: where the rest of the event workspace arrives */}
      <div className={`${card}`}>
        <h2 className="text-[14px] font-bold text-[var(--t1)]">Coming to this workspace</h2>
        <p className="mt-1 text-[12px] text-[var(--t3)]">Built in later milestones — each is a separate vertical slice.</p>
        <ul className="mt-3 space-y-2 text-[13px] text-[var(--t2)]">
          <li>👥 Members &amp; delegation — assign sub-admins/handlers <span className="text-[var(--t3)]">(M3)</span></li>
          <li>📦 Materials &amp; tasks — supply workflow + status <span className="text-[var(--t3)]">(M4)</span></li>
          <li>📝 Registration form — dynamic builder <span className="text-[var(--t3)]">(M5)</span></li>
          <li>🎟️ Guests &amp; attendance — registrations, QR tickets, scan-in <span className="text-[var(--t3)]">(M6–M7)</span></li>
        </ul>
      </div>
    </div>
  );
}
