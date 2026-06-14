import { z } from "zod";
import type { FormField } from "@/lib/api/types";

/**
 * One schema, one renderer (docs/05 §5.2): derive a Zod schema at runtime from the JSONB field
 * definitions so the public renderer's client-side validation matches the server exactly. The
 * authority is still {@code FormSchemaValidator} on the backend (docs/02 §6, docs/07 §3) — this is a
 * faithful mirror of those rules (same messages) for instant inline feedback. Pure + unit-testable.
 */

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const PHONE = /^[0-9+\-\s]{7,20}$/;

function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

function labelOf(field: FormField): string {
  return field.label && field.label.trim() ? field.label : "This field";
}

function isNumeric(s: string): boolean {
  if (!s.trim()) return false;
  return !Number.isNaN(Number(s));
}

/**
 * Build a Zod schema over the guest's `answers` map ({@code { [key]: value }}). Empties are skipped
 * for optional fields and rejected for required ones — mirroring the server's aggregate validation.
 */
export function buildZodSchema(fields: FormField[]) {
  return z.record(z.string(), z.unknown()).superRefine((values, ctx) => {
    const answers = values as Record<string, unknown>;
    for (const field of fields) {
      const value = answers[field.key];
      const empty = isEmpty(value);
      const add = (message: string) =>
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: [field.key], message });

      if (field.required && empty) {
        add(`${labelOf(field)} is required.`);
        continue;
      }
      if (empty) continue; // optional + absent → fine

      validateType(field, value, add);
      validateConstraints(field, value, add);
    }
  });
}

function validateType(field: FormField, value: unknown, add: (m: string) => void): void {
  switch (field.type) {
    case "email":
      if (!EMAIL.test(String(value))) add("Enter a valid email address.");
      break;
    case "phone":
      if (!PHONE.test(String(value))) add("Enter a valid phone number.");
      break;
    case "number":
      if (typeof value !== "number" && !isNumeric(String(value))) {
        add(`${labelOf(field)} must be a number.`);
      }
      break;
    case "select":
      if (!(field.options ?? []).includes(String(value))) add("Choose a valid option.");
      break;
    case "multiselect":
      if (Array.isArray(value)) {
        const options = field.options ?? [];
        if (value.some((v) => !options.includes(String(v)))) add("Choose valid options.");
      } else {
        add("Expected a list of options.");
      }
      break;
    default:
      // text / textarea / date / checkbox — accepted as-is (date format kept lenient in v1)
      break;
  }
}

function validateConstraints(field: FormField, value: unknown, add: (m: string) => void): void {
  const v = field.validation;
  if (!v) return;
  const s = typeof value === "string" ? value : String(value ?? "");

  if (v.minLength != null && s.length < v.minLength) add("Too short.");
  if (v.maxLength != null && s.length > v.maxLength) add("Too long.");
  if (v.pattern && s !== "") {
    try {
      if (!new RegExp(v.pattern).test(s)) add("Invalid format.");
    } catch {
      // a malformed schema pattern never blocks the guest (mirrors the server)
    }
  }

  if (field.type === "number") {
    const num = typeof value === "number" ? value : Number(s);
    if (!Number.isNaN(num)) {
      if (v.min != null && num < v.min) add("Too small.");
      if (v.max != null && num > v.max) add("Too large.");
    }
  }
}

/**
 * Validate an answers map against the schema and return first-error-per-field, shaped for the
 * {@code FormFields} renderer's `errors` prop. Empty result = valid.
 */
export function validateAnswers(
  fields: FormField[],
  values: Record<string, unknown>,
): Record<string, string> {
  const result = buildZodSchema(fields).safeParse(values);
  const errors: Record<string, string> = {};
  if (!result.success) {
    for (const issue of result.error.issues) {
      const key = String(issue.path[0] ?? "");
      if (key && !errors[key]) errors[key] = issue.message;
    }
  }
  return errors;
}
