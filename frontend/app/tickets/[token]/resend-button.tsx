"use client";

import { useState } from "react";
import { resendTicket } from "@/lib/api/public";
import { ApiError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";

/**
 * Resend the QR-ticket email (docs/05 §7 guest ticket page). The backend returns 202 regardless of
 * mail outcome (delivery internals are never surfaced, docs/04 §2.3); only a checked-in/revoked
 * ticket (409) or unknown token (404) is an error.
 */
export function ResendButton({ token }: { token: string }) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onResend() {
    setState("sending");
    setError(null);
    try {
      await resendTicket(token);
      setState("sent");
    } catch (e) {
      setState("idle");
      setError(e instanceof ApiError ? e.message : "Could not resend the ticket. Please try again.");
    }
  }

  return (
    <div className="mt-4">
      <Button variant="ghost" size="sm" disabled={state !== "idle"} onClick={onResend}>
        {state === "sending" ? "Sending…" : state === "sent" ? "✓ Email sent" : "Resend ticket email"}
      </Button>
      {error && (
        <p role="alert" className="mt-2 text-[12px] font-semibold text-[var(--danger)]">{error}</p>
      )}
    </div>
  );
}
