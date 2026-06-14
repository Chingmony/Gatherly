"use client";

import { QRCodeSVG } from "qrcode.react";

/**
 * On-screen QR ticket (docs/05 §5.2 fallback). Encodes the opaque {@code checkin_token}; an
 * organizer resolves it server-side on scan (M7). Rendered crisply as SVG.
 */
export function QrTicket({ token, size = 196 }: { token: string; size?: number }) {
  return (
    <div className="inline-flex flex-col items-center gap-3">
      <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-card)]">
        <QRCodeSVG value={token} size={size} level="M" marginSize={0} />
      </div>
      <code className="font-[var(--font-dm-mono)] text-[11px] tracking-wide text-[var(--text-faint)]">
        {token}
      </code>
    </div>
  );
}
