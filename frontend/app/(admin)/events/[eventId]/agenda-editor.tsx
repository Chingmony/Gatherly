"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveAgenda } from "@/lib/api/agenda";
import { ApiError } from "@/lib/api/client";
import type { AgendaResponse, AgendaTemplateResponse, EventResponse } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

interface Row { title: string; startsAt: string; endsAt: string }

/** Agenda tab (docs/03 §4.4): apply a template, reorder/edit sessions, full-replace save. */
export function AgendaEditor({
  event, agenda, templates,
}: { event: EventResponse; agenda: AgendaResponse; templates: AgendaTemplateResponse[] }) {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>(
    agenda.items.map((i) => ({ title: i.title, startsAt: isoToLocal(i.startsAt), endsAt: isoToLocal(i.endsAt) })),
  );
  const [templateId, setTemplateId] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  function applyTemplate() {
    const tpl = templates.find((t) => t.id === templateId);
    if (!tpl) return;
    let cursor = event.startsAt ? new Date(event.startsAt) : null;
    const ordered = [...tpl.items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    setRows(ordered.map((it) => {
      let s = "", e = "";
      if (cursor) {
        s = isoToLocal(cursor.toISOString());
        const end = new Date(cursor.getTime() + (it.durationMin ?? 0) * 60000);
        e = isoToLocal(end.toISOString());
        cursor = end;
      }
      return { title: it.title, startsAt: s, endsAt: e };
    }));
    setMsg({ ok: true, text: `Applied “${tpl.name}” — review and save.` });
  }

  async function onSave() {
    setMsg(null);
    setSaving(true);
    try {
      await saveAgenda(event.id, {
        items: rows.filter((r) => r.title.trim()).map((r) => ({
          title: r.title.trim(), startsAt: localToIso(r.startsAt), endsAt: localToIso(r.endsAt),
        })),
      });
      setMsg({ ok: true, text: "Agenda saved." });
      router.refresh();
    } catch (err) {
      setMsg({ ok: false, text: err instanceof ApiError ? err.message : "Could not save agenda." });
    } finally {
      setSaving(false);
    }
  }

  const set = (i: number, p: Partial<Row>) => setRows((r) => r.map((row, idx) => (idx === i ? { ...row, ...p } : row)));
  const move = (i: number, d: -1 | 1) => setRows((r) => { const n = [...r]; const j = i + d; if (j < 0 || j >= n.length) return r; [n[i], n[j]] = [n[j], n[i]]; return n; });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-2">
        <select value={templateId} onChange={(e) => setTemplateId(e.target.value)} className={`${FIELD} w-auto py-2`}>
          <option value="">Apply a template…</option>
          {templates.map((t) => <option key={t.id} value={t.id}>{t.name}{t.isDefault ? " (default)" : ""}</option>)}
        </select>
        <Button type="button" variant="ghost" size="sm" disabled={!templateId} onClick={applyTemplate}>Apply</Button>
      </div>
      {rows.length === 0 && <p className="text-[13px] text-[var(--text-muted)]">No agenda items yet.</p>}
      <div className="space-y-3">
        {rows.map((row, idx) => (
          <div key={idx} className="rounded-[var(--radius-md)] border border-[var(--border)] p-3">
            <div className="flex items-start gap-2">
              <div className="flex-1 space-y-2">
                <Input placeholder={`Item ${idx + 1}`} value={row.title} onChange={(e) => set(idx, { title: e.target.value })} />
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <input type="datetime-local" value={row.startsAt} onChange={(e) => set(idx, { startsAt: e.target.value })} className={FIELD} aria-label="Start" />
                  <input type="datetime-local" value={row.endsAt} onChange={(e) => set(idx, { endsAt: e.target.value })} className={FIELD} aria-label="End" />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <Button type="button" variant="ghost" size="sm" disabled={idx === 0} onClick={() => move(idx, -1)} aria-label="Up">↑</Button>
                <Button type="button" variant="ghost" size="sm" disabled={idx === rows.length - 1} onClick={() => move(idx, 1)} aria-label="Down">↓</Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setRows((r) => r.filter((_, i) => i !== idx))} aria-label="Remove">✕</Button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {msg && <p role={msg.ok ? "status" : "alert"} className={`text-[13px] font-semibold ${msg.ok ? "text-[var(--green-600)]" : "text-[var(--danger)]"}`}>{msg.text}</p>}
      <div className="flex justify-between">
        <Button type="button" variant="ghost" size="sm" onClick={() => setRows((r) => [...r, { title: "", startsAt: "", endsAt: "" }])}>+ Add item</Button>
        <Button type="button" disabled={saving} onClick={onSave}>{saving ? "Saving…" : "Save agenda"}</Button>
      </div>
    </div>
  );
}
