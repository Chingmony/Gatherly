"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/**
 * "Find your ticket" entry point (docs/03 §4.9). Tickets are reached by an opaque bearer token from
 * the emailed link; there is no guest login. This accepts either the full ticket link or just the
 * token, extracts it, and routes to `/tickets/{token}` where the live QR + status render.
 */
export function TicketFinder() {
  const router = useRouter();
  const [value, setValue] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  function open(e: React.FormEvent) {
    e.preventDefault();
    const token = extractToken(value);
    if (!token) {
      setError("Paste your ticket link or code to continue.");
      return;
    }
    setError(null);
    router.push(`/tickets/${encodeURIComponent(token)}`);
  }

  return (
    <form onSubmit={open} className="space-y-3" noValidate>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (error) setError(null);
          }}
          placeholder="Paste your ticket link or code"
          aria-label="Ticket link or code"
          aria-invalid={error ? true : undefined}
          autoComplete="off"
          spellCheck={false}
        />
        <Button type="submit" className="shrink-0 sm:w-auto">
          View ticket
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-[13px] font-semibold text-[var(--danger)]">
          {error}
        </p>
      )}
    </form>
  );
}

/** Pull the token from a pasted ticket URL (`…/tickets/<token>`), or treat the input as the raw token. */
function extractToken(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const fromUrl = trimmed.match(/\/tickets\/([^/?#\s]+)/);
  if (fromUrl) return decodeURIComponent(fromUrl[1]);
  // Otherwise assume a bare token — strip any stray query/hash a paste might carry.
  return trimmed.split(/[?#\s]/)[0] || null;
}
