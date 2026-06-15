"use client";

import type { FormField } from "@/lib/api/types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { DateField } from "@/components/ui/date-field";

const FIELD =
  "w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-2.5 text-[14px] text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:border-[var(--primary)]";

/**
 * One schema, one renderer (docs/05 §5.2): renders a JSONB field array into live inputs, ordered by
 * `order`. Controlled — the parent owns values + server `fieldErrors`. Used by the public register
 * form and the builder's live preview.
 */
export function FormFields({
  fields,
  values,
  errors = {},
  onChange,
  disabled = false,
}: {
  fields: FormField[];
  values: Record<string, unknown>;
  errors?: Record<string, string>;
  onChange: (key: string, value: unknown) => void;
  disabled?: boolean;
}) {
  const ordered = [...fields].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <div className="space-y-4">
      {ordered.map((f) => {
        const id = `f_${f.key}`;
        const err = errors[f.key];
        const val = values[f.key];
        return (
          <div key={f.key}>
            <Label htmlFor={id}>
              {f.label}
              {f.required && <span className="ml-0.5 text-[var(--danger)]">*</span>}
            </Label>

            {renderControl(f, id, val, onChange, disabled, FIELD, !!err)}

            {err && (
              <p id={`${id}_err`} role="alert" className="mt-1 text-[12px] font-medium text-[var(--danger)]">
                {err}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function renderControl(
  f: FormField,
  id: string,
  val: unknown,
  onChange: (key: string, value: unknown) => void,
  disabled: boolean,
  field: string,
  invalid: boolean,
) {
  const common = {
    id,
    disabled,
    "aria-invalid": invalid,
    "aria-describedby": invalid ? `${id}_err` : undefined,
  } as const;

  switch (f.type) {
    case "textarea":
      return (
        <textarea
          {...common}
          rows={3}
          className={field}
          placeholder={f.placeholder}
          value={(val as string) ?? ""}
          onChange={(e) => onChange(f.key, e.target.value)}
        />
      );
    case "select":
      return (
        <Select
          id={id}
          disabled={disabled}
          aria-invalid={invalid}
          aria-label={f.label}
          value={(val as string) ?? ""}
          onChange={(v) => onChange(f.key, v)}
          placeholder={f.placeholder ?? "Select…"}
          options={[
            { value: "", label: f.placeholder ?? "Select…" },
            ...(f.options ?? []).map((o) => ({ value: o, label: o })),
          ]}
        />
      );
    case "multiselect": {
      const arr = Array.isArray(val) ? (val as string[]) : [];
      return (
        <div className="flex flex-wrap gap-2 pt-1">
          {(f.options ?? []).map((o) => {
            const on = arr.includes(o);
            return (
              <button
                type="button"
                key={o}
                disabled={disabled}
                aria-pressed={on}
                onClick={() => onChange(f.key, on ? arr.filter((x) => x !== o) : [...arr, o])}
                className="rounded-full border px-3 py-1.5 text-[13px] font-semibold transition-colors"
                style={
                  on
                    ? { background: "var(--primary-soft)", color: "var(--primary)", borderColor: "var(--primary-ring)" }
                    : { background: "var(--surface-2)", color: "var(--text-muted)", borderColor: "var(--border)" }
                }
              >
                {o}
              </button>
            );
          })}
        </div>
      );
    }
    case "checkbox":
      return (
        <label className="mt-1 inline-flex items-center gap-2 text-[13px] text-[var(--text)]">
          <input
            type="checkbox"
            {...common}
            checked={!!val}
            onChange={(e) => onChange(f.key, e.target.checked)}
          />
          Yes
        </label>
      );
    case "date":
      return (
        <DateField
          id={id}
          disabled={disabled}
          aria-label={f.label}
          withTime={false}
          placeholder={f.placeholder ?? "Pick a date"}
          value={(val as string) ?? ""}
          onChange={(v) => onChange(f.key, v)}
        />
      );
    default: {
      const type = f.type === "phone" ? "tel" : f.type === "number" ? "number" : f.type;
      return (
        <Input
          {...common}
          type={type}
          placeholder={f.placeholder}
          value={(val as string) ?? ""}
          onChange={(e) => onChange(f.key, e.target.value)}
        />
      );
    }
  }
}
