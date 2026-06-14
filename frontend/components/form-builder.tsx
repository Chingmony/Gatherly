"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { saveForm, activateForm } from "@/lib/api/forms";
import { ApiError } from "@/lib/api/client";
import type { FieldType, FormField, FormResponse } from "@/lib/api/types";
import { FormFields } from "@/components/form-renderer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const TYPES: FieldType[] = ["text", "textarea", "email", "phone", "number", "date", "select", "multiselect", "checkbox"];
const FIELD =
  "w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-[13px] text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]";

function slug(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/(^_+|_+$)/g, "");
}

function seedFields(): FormField[] {
  return [
    { key: "full_name", label: "Full name", type: "text", required: true, order: 1 },
    { key: "email", label: "Email", type: "email", required: true, order: 2, locked: true },
    { key: "phone", label: "Phone", type: "phone", required: true, order: 3 },
  ];
}

/**
 * Registration form builder (docs/05 §5.1): edit the JSONB field array + live preview. Email is
 * locked & required (ticket delivery); a required phone is enforced before activation (docs/02 §6.1).
 * Schema is locked once the form is ACTIVE.
 */
export function FormBuilder({ eventId, initial }: { eventId: string; initial: FormResponse | null }) {
  const router = useRouter();
  const locked = initial?.status === "ACTIVE";
  const [title, setTitle] = useState(initial?.title ?? "Registration");
  const [fields, setFields] = useState<FormField[]>(
    initial?.schema?.length ? initial.schema : seedFields(),
  );
  const [status, setStatus] = useState(initial?.status ?? "DRAFT");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const canActivate = useMemo(
    () =>
      fields.some((f) => f.type === "email" && f.required) &&
      fields.some((f) => f.type === "phone" && f.required),
    [fields],
  );

  function patch(i: number, p: Partial<FormField>) {
    setFields((fs) => fs.map((f, idx) => (idx === i ? { ...f, ...p } : f)));
  }
  function move(i: number, dir: -1 | 1) {
    setFields((fs) => {
      const next = [...fs];
      const j = i + dir;
      if (j < 0 || j >= next.length) return fs;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }
  function addField() {
    setFields((fs) => [...fs, { key: "", label: "Untitled question", type: "text", required: false }]);
  }
  function removeField(i: number) {
    setFields((fs) => fs.filter((_, idx) => idx !== i));
  }

  /** Stable keys + sequential order; preserve existing keys, derive new ones from the label. */
  function normalized(): FormField[] {
    const used = new Set<string>();
    return fields.map((f, i) => {
      let key = f.key || slug(f.label) || `field_${i + 1}`;
      while (used.has(key)) key = `${key}_${i + 1}`;
      used.add(key);
      return { ...f, key, order: i + 1 };
    });
  }

  async function onSave() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await saveForm(eventId, { title, schema: normalized() });
      setStatus(res.status);
      setFields(res.schema);
      setMsg({ ok: true, text: "Saved." });
      router.refresh();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof ApiError ? e.message : "Could not save the form." });
    } finally {
      setBusy(false);
    }
  }

  async function onActivate() {
    setBusy(true);
    setMsg(null);
    try {
      await saveForm(eventId, { title, schema: normalized() });
      const res = await activateForm(eventId);
      setStatus(res.status);
      setMsg({ ok: true, text: "Form activated — guests can now register." });
      router.refresh();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof ApiError ? e.message : "Could not activate the form." });
    } finally {
      setBusy(false);
    }
  }

  const previewValues: Record<string, unknown> = {};

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge variant={status === "ACTIVE" ? "green" : "neutral"}>{status}</Badge>
          {!canActivate && <span className="text-[12px] text-[var(--text-muted)]">Needs a required email + phone to activate</span>}
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" disabled={busy || locked} onClick={onSave}>Save draft</Button>
          <Button size="sm" disabled={busy || !canActivate || locked} onClick={onActivate}>Activate</Button>
        </div>
      </div>

      {locked && (
        <p className="rounded-[var(--radius-md)] bg-[var(--surface-2)] px-3 py-2 text-[12px] text-[var(--text-muted)]">
          This form is active and locked — field keys are immutable while submissions can reference them.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Editor */}
        <div className="space-y-3">
          <div>
            <Label htmlFor="form-title">Form title</Label>
            <Input id="form-title" value={title} disabled={locked} onChange={(e) => setTitle(e.target.value)} />
          </div>

          {fields.map((f, i) => {
            const isEmail = f.type === "email" && f.locked;
            return (
              <div key={i} className="rounded-[var(--radius-md)] border border-[var(--border)] p-3">
                <div className="flex items-start gap-2">
                  <div className="flex-1 space-y-2">
                    <input className={FIELD} value={f.label} disabled={locked}
                      onChange={(e) => patch(i, { label: e.target.value })} placeholder="Question label" />
                    <div className="flex flex-wrap items-center gap-2">
                      <select className={`${FIELD} w-auto`} value={f.type} disabled={locked || isEmail}
                        onChange={(e) => patch(i, { type: e.target.value as FieldType })}>
                        {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <label className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[var(--text-muted)]">
                        <input type="checkbox" checked={!!f.required} disabled={locked || isEmail}
                          onChange={(e) => patch(i, { required: e.target.checked })} />
                        Required
                      </label>
                      {isEmail && <Badge variant="primary" dot={false}>Required for ticket</Badge>}
                    </div>
                    {(f.type === "select" || f.type === "multiselect") && (
                      <input className={FIELD} disabled={locked} placeholder="Options, comma-separated"
                        value={(f.options ?? []).join(", ")}
                        onChange={(e) => patch(i, { options: e.target.value.split(",").map((o) => o.trim()).filter(Boolean) })} />
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <Button type="button" variant="ghost" size="sm" disabled={locked || i === 0} onClick={() => move(i, -1)} aria-label="Up">↑</Button>
                    <Button type="button" variant="ghost" size="sm" disabled={locked || i === fields.length - 1} onClick={() => move(i, 1)} aria-label="Down">↓</Button>
                    <Button type="button" variant="ghost" size="sm" disabled={locked || isEmail} onClick={() => removeField(i)} aria-label="Remove">✕</Button>
                  </div>
                </div>
              </div>
            );
          })}

          <Button variant="ghost" size="sm" disabled={locked} onClick={addField}>+ Add question</Button>
          {msg && (
            <p role={msg.ok ? "status" : "alert"} className={`text-[13px] font-semibold ${msg.ok ? "text-[var(--green-600)]" : "text-[var(--danger)]"}`}>
              {msg.text}
            </p>
          )}
        </div>

        {/* Live preview */}
        <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-2)] p-5">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--text-faint)]">Live preview</p>
          <FormFields fields={normalized()} values={previewValues} disabled onChange={() => {}} />
        </div>
      </div>
    </div>
  );
}
