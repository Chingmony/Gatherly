"use client";

import { useState } from "react";
import { registerForEvent } from "@/lib/api/public";
import { ApiError } from "@/lib/api/client";
import { validateAnswers } from "@/lib/forms/build-zod-schema";
import type { FormField, RegisterResponse } from "@/lib/api/types";
import { FormFields } from "@/components/form-renderer";
import { QrTicket } from "@/components/qr-ticket";
import { Button } from "@/components/ui/button";

/**
 * Guest registration (docs/05 §5.2): renders the schema, submits to the public register endpoint,
 * maps server `fieldErrors` back onto fields, and on success shows the on-screen QR ticket.
 */
export function PublicRegisterForm({
  eventId,
  title,
  schema,
}: {
  eventId: string;
  title: string;
  schema: FormField[];
}) {
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [ticket, setTicket] = useState<RegisterResponse | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setFormError(null);

    // Client-side mirror of the server schema validation (docs/05 §5.2) — instant inline feedback
    // before the round-trip; the server stays authoritative on submit.
    const clientErrors = validateAnswers(schema, values);
    if (Object.keys(clientErrors).length) {
      setErrors(clientErrors);
      setFormError("Please fix the highlighted fields.");
      return;
    }

    setPending(true);
    try {
      const res = await registerForEvent(eventId, values);
      setTicket(res);
    } catch (err) {
      if (err instanceof ApiError && err.body.fieldErrors?.length) {
        const map: Record<string, string> = {};
        for (const fe of err.body.fieldErrors) map[fe.field] = fe.message;
        setErrors(map);
        setFormError("Please fix the highlighted fields.");
      } else {
        setFormError(err instanceof ApiError ? err.message : "Could not register. Please try again.");
      }
    } finally {
      setPending(false);
    }
  }

  if (ticket) {
    return (
      <div className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-8 text-center shadow-[var(--shadow-card)]">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--green-soft)] text-[22px] text-[var(--green-600)]">✓</div>
        <h2 className="text-[18px] font-extrabold text-[var(--text-strong)]">You’re registered!</h2>
        <p className="mx-auto mt-1 max-w-md text-[13px] text-[var(--text-muted)]">{ticket.message}</p>
        <div className="mt-6 flex justify-center">
          <QrTicket token={ticket.checkinToken} />
        </div>
        <a
          href={`/tickets/${ticket.checkinToken}`}
          className="mt-6 inline-block text-[13px] font-bold text-[var(--primary)] hover:underline"
        >
          View your ticket →
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)] sm:p-8">
      <h2 className="text-[16px] font-extrabold text-[var(--text-strong)]">{title || "Register"}</h2>
      <p className="mt-1 mb-5 text-[13px] text-[var(--text-muted)]">Fields marked * are required.</p>

      <FormFields fields={schema} values={values} errors={errors} disabled={pending}
        onChange={(k, v) => setValues((s) => ({ ...s, [k]: v }))} />

      {formError && (
        <p role="alert" className="mt-4 text-[13px] font-semibold text-[var(--danger)]">{formError}</p>
      )}

      <div className="mt-6">
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Registering…" : "Complete registration"}
        </Button>
      </div>
    </form>
  );
}
