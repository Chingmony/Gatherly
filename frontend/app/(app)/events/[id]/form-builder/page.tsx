"use client";

import { useState } from "react";
import { Lock, Plus, Trash2, GripVertical, Eye, Check } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

// ── Types ────────────────────────────────────────────────────────────────────
type FieldType = "text" | "email" | "phone" | "number" | "textarea" | "select" | "checkbox" | "date";

interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  locked?: boolean;
}

const PALETTE_TYPES: { type: FieldType; label: string; icon: string }[] = [
  { type: "text",     label: "Short text",  icon: "T" },
  { type: "textarea", label: "Long text",   icon: "¶" },
  { type: "number",   label: "Number",      icon: "#" },
  { type: "select",   label: "Dropdown",    icon: "▾" },
  { type: "checkbox", label: "Checkbox",    icon: "✓" },
  { type: "date",     label: "Date",        icon: "📅" },
];

const INITIAL_FIELDS: FormField[] = [
  { id: "f-email", type: "email", label: "Email address", placeholder: "your@email.com", required: true, locked: true },
  { id: "f-phone", type: "phone", label: "Phone number",  placeholder: "+1 (555) 000-0000", required: true, locked: true },
];

let counter = 10;
function uid() { return `f-${++counter}`; }

// ── Fake preview renderer ────────────────────────────────────────────────────
function PreviewField({ field }: { field: FormField }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="flex items-center gap-1">
        {field.label}
        {field.required && <span style={{ color: "var(--danger)" }}>*</span>}
      </Label>
      {field.type === "textarea" ? (
        <textarea
          disabled
          placeholder={field.placeholder ?? "Your answer…"}
          className="h-20 px-3 py-2.5 rounded-[var(--radius-md)] border resize-none text-sm"
          style={{ background: "var(--surface-2)", borderColor: "var(--border-hex,#ecedf4)", color: "var(--text-faint)" }}
        />
      ) : field.type === "checkbox" ? (
        <div className="flex items-center gap-2">
          <input type="checkbox" disabled className="w-4 h-4" />
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>{field.label}</span>
        </div>
      ) : field.type === "select" ? (
        <select
          disabled
          className="h-[42px] px-3 rounded-[var(--radius-md)] border text-sm"
          style={{ background: "var(--surface-2)", borderColor: "var(--border-hex,#ecedf4)", color: "var(--text-faint)" }}
        >
          <option>Select an option…</option>
        </select>
      ) : (
        <input
          type={field.type === "email" ? "email" : field.type === "phone" ? "tel" : field.type === "date" ? "date" : "text"}
          disabled
          placeholder={field.placeholder ?? "Your answer…"}
          className="h-[42px] px-3 rounded-[var(--radius-md)] border text-sm"
          style={{ background: "var(--surface-2)", borderColor: "var(--border-hex,#ecedf4)", color: "var(--text-faint)" }}
        />
      )}
    </div>
  );
}

export default function FormBuilderPage() {
  const [fields, setFields] = useState<FormField[]>(INITIAL_FIELDS);
  const [selected, setSelected] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const selectedField = fields.find((f) => f.id === selected);

  function addField(type: FieldType) {
    const newField: FormField = {
      id: uid(),
      type,
      label: PALETTE_TYPES.find((p) => p.type === type)?.label ?? "Field",
      placeholder: "",
      required: false,
    };
    setFields((prev) => [...prev, newField]);
    setSelected(newField.id);
  }

  function updateField(id: string, patch: Partial<FormField>) {
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }

  function deleteField(id: string) {
    setFields((prev) => prev.filter((f) => f.id !== id));
    if (selected === id) setSelected(null);
  }

  function moveField(id: string, dir: -1 | 1) {
    setFields((prev) => {
      const idx = prev.findIndex((f) => f.id === id);
      const next = idx + dir;
      if (next < 0 || next >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx], copy[next]] = [copy[next], copy[idx]];
      return copy;
    });
  }

  function handlePublish() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="flex flex-col gap-5 view-anim">
      <PageHeader title="Form Builder" sub="Design the registration form for this event">
        <Button size="sm" onClick={handlePublish}>
          {saved ? <><Check size={13} /> Saved!</> : "Publish form"}
        </Button>
      </PageHeader>

      {/* ── 3-panel grid ── */}
      <div className="grid grid-cols-[210px_1fr_320px] gap-4 items-start min-h-[60vh]">

        {/* Palette */}
        <div
          className="rounded-[var(--radius-xl)] border p-4 flex flex-col gap-2"
          style={{ background: "var(--surface)", borderColor: "var(--border-hex,#ecedf4)", boxShadow: "var(--shadow-card)" }}
        >
          <span className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>Field types</span>
          {PALETTE_TYPES.map(({ type, label, icon }) => (
            <button
              key={type}
              type="button"
              onClick={() => addField(type)}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-[var(--radius-md)] text-sm font-semibold text-left transition-all hover:bg-[var(--primary-soft)] cursor-pointer border"
              style={{
                borderColor: "var(--border-hex,#ecedf4)",
                background: "var(--surface-2)",
                color: "var(--text-strong)",
              }}
            >
              <span className="text-base w-5 text-center flex-shrink-0">{icon}</span>
              {label}
              <Plus size={12} className="ml-auto" style={{ color: "var(--text-faint)" }} />
            </button>
          ))}
        </div>

        {/* Canvas */}
        <div
          className="rounded-[var(--radius-xl)] border p-5 flex flex-col gap-3"
          style={{ background: "var(--surface)", borderColor: "var(--border-hex,#ecedf4)", boxShadow: "var(--shadow-card)", minHeight: 420 }}
        >
          <span className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>Form canvas</span>
          {fields.length === 0 && (
            <div className="flex-1 flex items-center justify-center py-16">
              <span className="text-sm" style={{ color: "var(--text-faint)" }}>Add fields from the palette</span>
            </div>
          )}
          {fields.map((field, i) => {
            const isSelected = selected === field.id;
            return (
              <div
                key={field.id}
                onClick={() => setSelected(field.id)}
                className="flex items-center gap-3 px-4 py-3.5 rounded-[var(--radius-md)] border cursor-pointer transition-all"
                style={{
                  borderColor: isSelected ? "var(--primary-hex,#6366f1)" : "var(--border-hex,#ecedf4)",
                  background: isSelected ? "var(--primary-soft)" : "var(--surface-2)",
                  boxShadow: isSelected ? "0 0 0 3px var(--primary-ring)" : "none",
                }}
              >
                {/* Drag grip */}
                <GripVertical size={14} style={{ color: "var(--text-faint)", flexShrink: 0 }} />

                {/* Field info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold" style={{ color: "var(--text-strong)" }}>{field.label}</span>
                    {field.required && <span className="text-[10px] font-bold" style={{ color: "var(--danger)" }}>required</span>}
                    {field.locked && (
                      <span className="flex items-center gap-0.5 text-[10px] font-bold" style={{ color: "var(--text-faint)" }}>
                        <Lock size={10} /> locked
                      </span>
                    )}
                  </div>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>{field.type}</span>
                </div>

                {/* Actions */}
                {!field.locked && (
                  <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => moveField(field.id, -1)}
                      disabled={i === 0}
                      className="w-6 h-6 flex items-center justify-center rounded transition-colors hover:bg-[var(--surface-3)] disabled:opacity-30 cursor-pointer"
                      style={{ color: "var(--text-muted)" }}
                    >↑</button>
                    <button
                      type="button"
                      onClick={() => moveField(field.id, 1)}
                      disabled={i === fields.length - 1}
                      className="w-6 h-6 flex items-center justify-center rounded transition-colors hover:bg-[var(--surface-3)] disabled:opacity-30 cursor-pointer"
                      style={{ color: "var(--text-muted)" }}
                    >↓</button>
                    <button
                      type="button"
                      onClick={() => deleteField(field.id)}
                      className="w-6 h-6 flex items-center justify-center rounded transition-colors hover:bg-[var(--danger-soft)] cursor-pointer"
                      style={{ color: "var(--danger)" }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Properties / Preview */}
        <div className="sticky top-6 flex flex-col gap-4">
          {/* Properties inspector */}
          {selectedField ? (
            <div
              className="rounded-[var(--radius-xl)] border p-5 flex flex-col gap-4"
              style={{ background: "var(--surface)", borderColor: "var(--border-hex,#ecedf4)", boxShadow: "var(--shadow-card)" }}
            >
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Field settings</span>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="field-label">Label</Label>
                <Input
                  id="field-label"
                  value={selectedField.label}
                  disabled={selectedField.locked}
                  onChange={(e) => updateField(selectedField.id, { label: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="field-ph">Placeholder</Label>
                <Input
                  id="field-ph"
                  value={selectedField.placeholder ?? ""}
                  disabled={selectedField.locked}
                  onChange={(e) => updateField(selectedField.id, { placeholder: e.target.value })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Required</Label>
                <Switch
                  checked={selectedField.required}
                  disabled={selectedField.locked}
                  onCheckedChange={(v: boolean) => updateField(selectedField.id, { required: v })}
                />
              </div>
              {selectedField.locked && (
                <div
                  className="flex items-center gap-2 px-3 py-2.5 rounded-[var(--radius-md)] text-xs font-semibold"
                  style={{ background: "var(--orange-soft)", color: "var(--orange)" }}
                >
                  <Lock size={12} /> This field is locked and always required.
                </div>
              )}
            </div>
          ) : (
            <div
              className="rounded-[var(--radius-xl)] border px-5 py-8 flex flex-col items-center gap-2 text-center"
              style={{ background: "var(--surface)", borderColor: "var(--border-hex,#ecedf4)" }}
            >
              <Eye size={20} style={{ color: "var(--text-faint)" }} />
              <span className="text-sm" style={{ color: "var(--text-muted)" }}>Select a field to edit its properties</span>
            </div>
          )}

          {/* Live preview */}
          <div
            className="rounded-[var(--radius-xl)] border p-5 flex flex-col gap-4"
            style={{ background: "var(--surface)", borderColor: "var(--border-hex,#ecedf4)", boxShadow: "var(--shadow-card)" }}
          >
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Preview</span>
            {fields.map((f) => <PreviewField key={f.id} field={f} />)}
            {fields.length > 0 && (
              <button
                disabled
                className="h-[42px] rounded-[var(--radius-md)] text-sm font-bold text-white border-none"
                style={{ background: "var(--primary-hex,#6366f1)", opacity: 0.8 }}
              >
                Register
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
