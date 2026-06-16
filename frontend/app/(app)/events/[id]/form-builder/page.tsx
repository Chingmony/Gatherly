"use client";

import { useEffect, useState } from "react";
import { Lock, Plus, Trash2, GripVertical, Eye, Check, Loader2, X, AlertCircle, FileText } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ApiError } from "@/lib/api/client";
import {
  listTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  type FormField,
  type FormFieldType,
  type FormTemplate,
} from "@/lib/api/forms";

// ── Field model ──────────────────────────────────────────────────────────────
// UI-shaped field (stable `key`, `locked` for the mandatory email/phone), mapped to/from the
// backend FormField on load/save.
interface BuilderField {
  key: string;
  type: FormFieldType;
  label: string;
  required: boolean;
  options: string[];
  locked: boolean;
}

type PaletteType = Exclude<FormFieldType, "email" | "phone">;

const PALETTE: { type: PaletteType; label: string; icon: string }[] = [
  { type: "text",        label: "Short text",   icon: "T" },
  { type: "textarea",    label: "Long text",    icon: "¶" },
  { type: "number",      label: "Number",       icon: "#" },
  { type: "date",        label: "Date",         icon: "📅" },
  { type: "select",      label: "Dropdown",     icon: "▾" },
  { type: "multiselect", label: "Multi-select", icon: "≣" },
  { type: "checkbox",    label: "Checkbox",     icon: "✓" },
];

const TYPE_LABEL: Record<FormFieldType, string> = {
  text: "Short text",
  email: "Email",
  phone: "Phone",
  number: "Number",
  date: "Date",
  select: "Dropdown",
  multiselect: "Multi-select",
  checkbox: "Checkbox",
  textarea: "Long text",
};

const EVENT_TYPE_PRESETS = ["Conference", "Workshop", "Webinar", "Networking", "Custom"];

function needsOptions(t: FormFieldType): boolean {
  return t === "select" || t === "multiselect";
}

function genKey(): string {
  const rand =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID().slice(0, 8)
      : Math.floor(Math.random() * 1e9).toString(36);
  return `field_${rand}`;
}

/** The two mandatory, locked fields every form carries (QR delivery + product requirement). */
function lockedDefaults(): BuilderField[] {
  return [
    { key: "email", type: "email", label: "Email address", required: true, options: [], locked: true },
    { key: "phone", type: "phone", label: "Phone number",  required: true, options: [], locked: true },
  ];
}

function fromFields(fields: FormField[]): BuilderField[] {
  return [...fields]
    .sort((a, b) => a.order - b.order)
    .map((f) => ({
      key: f.key,
      type: f.type,
      label: f.label,
      required: f.required,
      options: f.options ?? [],
      locked: f.type === "email" || f.type === "phone",
    }));
}

/** Guarantee a locked email + phone exist. */
function normalizeLocked(fields: BuilderField[]): BuilderField[] {
  const out = [...fields];
  for (const def of lockedDefaults()) {
    if (!out.some((f) => f.type === def.type)) out.unshift(def);
  }
  return out;
}

function toRequestFields(fields: BuilderField[]): FormField[] {
  return fields.map((f, i) => ({
    key: f.key,
    label: f.label.trim() || TYPE_LABEL[f.type],
    type: f.type,
    required: f.locked ? true : f.required,
    order: i,
    options: needsOptions(f.type) ? f.options.map((o) => o.trim()).filter(Boolean) : undefined,
  }));
}

const TYPE_BADGE: Record<string, { bg: string; fg: string }> = {
  Conference: { bg: "var(--primary-soft)", fg: "var(--primary-hex,#6366f1)" },
  Workshop:   { bg: "var(--orange-soft)",  fg: "var(--orange)" },
  Webinar:    { bg: "var(--green-soft,#ecfdf5)", fg: "var(--green-600)" },
  Networking: { bg: "var(--blue-soft,#eff6ff)",  fg: "var(--blue,#2563eb)" },
};
function badgeFor(type: string) {
  return TYPE_BADGE[type] ?? { bg: "var(--surface-3)", fg: "var(--text-muted)" };
}

// ── Preview renderer (mirrors the public guest form) ─────────────────────────
function PreviewField({ field }: { field: BuilderField }) {
  const ghost = {
    background: "var(--surface-2)",
    borderColor: "var(--border-hex,#ecedf4)",
    color: "var(--text-faint)",
  } as const;
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="flex items-center gap-1">
        {field.label || TYPE_LABEL[field.type]}
        {field.required && <span style={{ color: "var(--danger)" }}>*</span>}
      </Label>
      {field.type === "textarea" ? (
        <textarea disabled placeholder="Your answer…" className="h-20 px-3 py-2.5 rounded-[var(--radius-md)] border resize-none text-sm" style={ghost} />
      ) : field.type === "checkbox" ? (
        <div className="flex items-center gap-2">
          <input type="checkbox" disabled className="w-4 h-4" />
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>{field.label || TYPE_LABEL[field.type]}</span>
        </div>
      ) : needsOptions(field.type) ? (
        <select disabled multiple={field.type === "multiselect"} className="px-3 py-2 rounded-[var(--radius-md)] border text-sm" style={ghost}>
          {(field.options.length ? field.options : ["Option 1"]).map((o, i) => (
            <option key={i}>{o || `Option ${i + 1}`}</option>
          ))}
        </select>
      ) : (
        <input
          type={field.type === "email" ? "email" : field.type === "phone" ? "tel" : field.type === "date" ? "date" : field.type === "number" ? "number" : "text"}
          disabled
          placeholder="Your answer…"
          className="h-[42px] px-3 rounded-[var(--radius-md)] border text-sm"
          style={ghost}
        />
      )}
    </div>
  );
}

export default function FormBuilderPage() {
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  // Editing draft (draftId === null → an unsaved new template).
  const [draftId, setDraftId]   = useState<string | null>(null);
  const [name, setName]         = useState("");
  const [eventType, setEventType] = useState("Custom");
  const [title, setTitle]       = useState("");
  const [fields, setFields]     = useState<BuilderField[]>(lockedDefaults());
  const [selected, setSelected] = useState<string | null>(null);

  const [saving, setSaving]     = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [error, setError]       = useState("");

  const selectedField = fields.find((f) => f.key === selected) ?? null;

  function editTemplate(t: FormTemplate) {
    setDraftId(t.id);
    setName(t.name);
    setEventType(t.eventType);
    setTitle(t.title);
    setFields(normalizeLocked(fromFields(t.fields)));
    setSelected(null);
    setError("");
  }

  function newTemplate() {
    setDraftId(null);
    setName("New template");
    setEventType("Custom");
    setTitle("Event Registration");
    setFields(lockedDefaults());
    setSelected(null);
    setError("");
  }

  useEffect(() => {
    listTemplates()
      .then((list) => {
        const items = list ?? [];
        setTemplates(items);
        if (items.length > 0) editTemplate(items[0]);
        else newTemplate();
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load templates"))
      .finally(() => setLoading(false));
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Field mutations ──
  function addField(type: PaletteType) {
    const field: BuilderField = {
      key: genKey(),
      type,
      label: TYPE_LABEL[type],
      required: false,
      options: needsOptions(type) ? ["Option 1"] : [],
      locked: false,
    };
    setFields((prev) => [...prev, field]);
    setSelected(field.key);
  }
  function updateField(key: string, patch: Partial<BuilderField>) {
    setFields((prev) => prev.map((f) => (f.key === key ? { ...f, ...patch } : f)));
  }
  function deleteField(key: string) {
    setFields((prev) => prev.filter((f) => f.key !== key));
    if (selected === key) setSelected(null);
  }
  function moveField(key: string, dir: -1 | 1) {
    setFields((prev) => {
      const idx = prev.findIndex((f) => f.key === key);
      const next = idx + dir;
      if (next < 0 || next >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx], copy[next]] = [copy[next], copy[idx]];
      return copy;
    });
  }
  function setOption(i: number, value: string) {
    if (!selectedField) return;
    updateField(selectedField.key, { options: selectedField.options.map((o, idx) => (idx === i ? value : o)) });
  }
  function addOption() {
    if (!selectedField) return;
    updateField(selectedField.key, { options: [...selectedField.options, ""] });
  }
  function removeOption(i: number) {
    if (!selectedField) return;
    updateField(selectedField.key, { options: selectedField.options.filter((_, idx) => idx !== i) });
  }

  // ── Persist ──
  async function handleSave() {
    if (saving) return;
    setError("");
    setSaving(true);
    const body = {
      name: name.trim() || "Untitled template",
      eventType: eventType.trim() || "Custom",
      title: title.trim() || "Registration",
      fields: toRequestFields(fields),
    };
    try {
      const saved = draftId ? await updateTemplate(draftId, body) : await createTemplate(body);
      setTemplates((prev) => {
        const without = prev.filter((t) => t.id !== saved.id);
        return [saved, ...without];
      });
      setDraftId(saved.id);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2400);
    } catch (e) {
      setError(e instanceof ApiError || e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!draftId || saving) return;
    setError("");
    setSaving(true);
    try {
      await deleteTemplate(draftId);
      const remaining = templates.filter((t) => t.id !== draftId);
      setTemplates(remaining);
      if (remaining.length > 0) editTemplate(remaining[0]);
      else newTemplate();
    } catch (e) {
      setError(e instanceof ApiError || e instanceof Error ? e.message : "Delete failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-5 view-anim">
      <PageHeader title="Form Builder" sub="Design reusable registration-form templates for your event types">
        <div className="flex items-center gap-2.5">
          {draftId && (
            <Button size="sm" variant="ghost" disabled={saving} onClick={handleDelete} className="hover:bg-[var(--danger-soft)] hover:text-[var(--danger)]">
              <Trash2 size={14} /> Delete
            </Button>
          )}
          <Button size="sm" disabled={saving || loading} onClick={handleSave}>
            {saving ? <Loader2 size={13} className="animate-spin" /> : savedFlash ? <><Check size={13} /> Saved!</> : draftId ? "Save template" : "Create template"}
          </Button>
        </div>
      </PageHeader>

      {/* Template selector */}
      <div className="flex flex-wrap items-center gap-2">
        {templates.map((t) => {
          const active = t.id === draftId;
          const badge = badgeFor(t.eventType);
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => editTemplate(t)}
              className="flex items-center gap-2 pl-3 pr-3.5 py-2 rounded-[var(--radius-lg)] border text-sm font-semibold transition-all cursor-pointer"
              style={{
                background: active ? "var(--primary-soft)" : "var(--surface)",
                borderColor: active ? "var(--primary-hex,#6366f1)" : "var(--border-hex,#ecedf4)",
                color: "var(--text-strong)",
                boxShadow: active ? "0 0 0 3px var(--primary-ring)" : "none",
              }}
            >
              <FileText size={14} style={{ color: "var(--text-faint)" }} />
              <span className="max-w-[160px] truncate">{t.name}</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: badge.bg, color: badge.fg }}>
                {t.eventType}
              </span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={newTemplate}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-[var(--radius-lg)] border border-dashed text-sm font-semibold transition-all cursor-pointer hover:bg-[var(--primary-soft)]"
          style={{ borderColor: "var(--border-hex,#ecedf4)", color: "var(--primary-hex,#6366f1)" }}
        >
          <Plus size={14} /> New template
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-[var(--radius-md)] text-sm font-semibold" style={{ background: "var(--danger-soft)", color: "var(--danger)" }}>
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {loading ? (
        <div className="h-64 rounded-[var(--radius-xl)] animate-pulse" style={{ background: "var(--surface-2)" }} />
      ) : (
        <>
          {/* Template meta */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tpl-name">Template name</Label>
              <Input id="tpl-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Conference registration" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tpl-type">Event type</Label>
              <input
                id="tpl-type"
                list="event-type-presets"
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                placeholder="e.g. Conference"
                className="flex w-full h-10 rounded-[var(--radius-md)] border border-[var(--border-hex,#ecedf4)] bg-[var(--surface-2)] px-3.5 text-sm text-[var(--text)] transition-all focus:outline-none focus:border-[var(--primary-hex,#6366f1)] focus:bg-[var(--surface)] focus:shadow-[0_0_0_4px_var(--primary-ring)]"
              />
              <datalist id="event-type-presets">
                {EVENT_TYPE_PRESETS.map((t) => <option key={t} value={t} />)}
              </datalist>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tpl-title">Form title (shown to guests)</Label>
              <Input id="tpl-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Summit Registration" />
            </div>
          </div>

          {/* 3-panel builder */}
          <div className="grid grid-cols-[200px_1fr_300px] gap-4 items-start min-h-[55vh]">
            {/* Palette */}
            <div className="rounded-[var(--radius-xl)] border p-4 flex flex-col gap-2" style={{ background: "var(--surface)", borderColor: "var(--border-hex,#ecedf4)", boxShadow: "var(--shadow-card)" }}>
              <span className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>Field types</span>
              {PALETTE.map(({ type, label, icon }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => addField(type)}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-[var(--radius-md)] text-sm font-semibold text-left transition-all hover:bg-[var(--primary-soft)] cursor-pointer border"
                  style={{ borderColor: "var(--border-hex,#ecedf4)", background: "var(--surface-2)", color: "var(--text-strong)" }}
                >
                  <span className="text-base w-5 text-center flex-shrink-0">{icon}</span>
                  {label}
                  <Plus size={12} className="ml-auto" style={{ color: "var(--text-faint)" }} />
                </button>
              ))}
            </div>

            {/* Canvas */}
            <div className="rounded-[var(--radius-xl)] border p-5 flex flex-col gap-3" style={{ background: "var(--surface)", borderColor: "var(--border-hex,#ecedf4)", boxShadow: "var(--shadow-card)", minHeight: 420 }}>
              <span className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>Form canvas</span>
              {fields.map((field, i) => {
                const isSelected = selected === field.key;
                return (
                  <div
                    key={field.key}
                    onClick={() => setSelected(field.key)}
                    className="flex items-center gap-3 px-4 py-3.5 rounded-[var(--radius-md)] border cursor-pointer transition-all"
                    style={{
                      borderColor: isSelected ? "var(--primary-hex,#6366f1)" : "var(--border-hex,#ecedf4)",
                      background: isSelected ? "var(--primary-soft)" : "var(--surface-2)",
                      boxShadow: isSelected ? "0 0 0 3px var(--primary-ring)" : "none",
                    }}
                  >
                    <GripVertical size={14} style={{ color: "var(--text-faint)", flexShrink: 0 }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold truncate" style={{ color: "var(--text-strong)" }}>{field.label || TYPE_LABEL[field.type]}</span>
                        {field.required && <span className="text-[10px] font-bold" style={{ color: "var(--danger)" }}>required</span>}
                        {field.locked && (
                          <span className="flex items-center gap-0.5 text-[10px] font-bold" style={{ color: "var(--text-faint)" }}>
                            <Lock size={10} /> locked
                          </span>
                        )}
                      </div>
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>{TYPE_LABEL[field.type]}</span>
                    </div>
                    {!field.locked && (
                      <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button type="button" onClick={() => moveField(field.key, -1)} disabled={i === 0} className="w-6 h-6 flex items-center justify-center rounded transition-colors hover:bg-[var(--surface-3)] disabled:opacity-30 cursor-pointer" style={{ color: "var(--text-muted)" }}>↑</button>
                        <button type="button" onClick={() => moveField(field.key, 1)} disabled={i === fields.length - 1} className="w-6 h-6 flex items-center justify-center rounded transition-colors hover:bg-[var(--surface-3)] disabled:opacity-30 cursor-pointer" style={{ color: "var(--text-muted)" }}>↓</button>
                        <button type="button" onClick={() => deleteField(field.key)} className="w-6 h-6 flex items-center justify-center rounded transition-colors hover:bg-[var(--danger-soft)] cursor-pointer" style={{ color: "var(--danger)" }}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Inspector + preview */}
            <div className="sticky top-6 flex flex-col gap-4">
              {selectedField ? (
                <div className="rounded-[var(--radius-xl)] border p-5 flex flex-col gap-4" style={{ background: "var(--surface)", borderColor: "var(--border-hex,#ecedf4)", boxShadow: "var(--shadow-card)" }}>
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Field settings</span>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="field-label">Label</Label>
                    <Input id="field-label" value={selectedField.label} disabled={selectedField.locked} onChange={(e) => updateField(selectedField.key, { label: e.target.value })} />
                  </div>

                  {needsOptions(selectedField.type) && (
                    <div className="flex flex-col gap-1.5">
                      <Label>Options</Label>
                      <div className="flex flex-col gap-2">
                        {selectedField.options.map((opt, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <Input value={opt} placeholder={`Option ${i + 1}`} onChange={(e) => setOption(i, e.target.value)} />
                            <button type="button" onClick={() => removeOption(i)} className="w-8 h-8 flex items-center justify-center rounded-[var(--radius-md)] flex-shrink-0 transition-colors hover:bg-[var(--danger-soft)] cursor-pointer" style={{ color: "var(--danger)" }}>
                              <X size={13} />
                            </button>
                          </div>
                        ))}
                        <button type="button" onClick={addOption} className="flex items-center gap-1.5 text-sm font-semibold self-start px-2 py-1 rounded-[var(--radius-sm)] transition-colors hover:bg-[var(--primary-soft)] cursor-pointer" style={{ color: "var(--primary-hex,#6366f1)" }}>
                          <Plus size={13} /> Add option
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <Label>Required</Label>
                    <Switch checked={selectedField.required} disabled={selectedField.locked} onCheckedChange={(v: boolean) => updateField(selectedField.key, { required: v })} />
                  </div>

                  {selectedField.locked && (
                    <div className="flex items-center gap-2 px-3 py-2.5 rounded-[var(--radius-md)] text-xs font-semibold" style={{ background: "var(--orange-soft)", color: "var(--orange)" }}>
                      <Lock size={12} /> Email & phone are always collected and required.
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-[var(--radius-xl)] border px-5 py-8 flex flex-col items-center gap-2 text-center" style={{ background: "var(--surface)", borderColor: "var(--border-hex,#ecedf4)" }}>
                  <Eye size={20} style={{ color: "var(--text-faint)" }} />
                  <span className="text-sm" style={{ color: "var(--text-muted)" }}>Select a field to edit its properties</span>
                </div>
              )}

              {/* Live preview */}
              <div className="rounded-[var(--radius-xl)] border p-5 flex flex-col gap-4" style={{ background: "var(--surface)", borderColor: "var(--border-hex,#ecedf4)", boxShadow: "var(--shadow-card)" }}>
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Preview</span>
                {fields.map((f) => <PreviewField key={f.key} field={f} />)}
                <button disabled className="h-[42px] rounded-[var(--radius-md)] text-sm font-bold text-white border-none" style={{ background: "var(--primary-hex,#6366f1)", opacity: 0.8 }}>
                  Register
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
