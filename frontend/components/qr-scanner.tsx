"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { scan } from "@/lib/api/attendance";
import { ApiError } from "@/lib/api/client";
import type { CheckinResult } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/**
 * Organizer QR scanner (docs/05 §6). Decodes the guest's QR with the native {@code BarcodeDetector}
 * when available and falls back to manual token entry otherwise (the documented fallback). Each
 * decode POSTs to {@code /events/{id}/attendance/scan}; result states mirror the API contract
 * (201 / 409 ALREADY_CHECKED_IN / 409 TICKET_INVALID / 404 / 403). Keeps a session tally + recent
 * feed and debounces rapid duplicate decodes of the same code.
 *
 * <p>Online-only in v1 (docs/05 §6.1): a scan needs a network round-trip; an offline banner shows
 * when connectivity drops. The richer {@code @zxing/browser} Web-Worker decode is a documented
 * fast-follow.
 */
type Outcome = "ok" | "already" | "invalid" | "denied" | "offline";

interface ScanLine {
  key: string;
  outcome: Outcome;
  label: string;
  detail?: string;
  at: number;
}

interface DetectedBarcode {
  rawValue: string;
}
interface BarcodeDetectorLike {
  detect(source: CanvasImageSource): Promise<DetectedBarcode[]>;
}
type BarcodeDetectorCtor = new (opts?: { formats?: string[] }) => BarcodeDetectorLike;

type Tint = "green" | "orange" | "danger" | "neutral";

const OUTCOME: Record<Outcome, { tint: Tint; title: string; bg: string; fg: string }> = {
  ok: { tint: "green", title: "Checked in", bg: "var(--green-soft)", fg: "var(--green-600)" },
  already: { tint: "orange", title: "Already checked in", bg: "var(--orange-soft)", fg: "var(--orange)" },
  invalid: { tint: "danger", title: "Invalid or revoked ticket", bg: "var(--danger-soft)", fg: "var(--danger)" },
  denied: { tint: "danger", title: "Not authorized for this event", bg: "var(--danger-soft)", fg: "var(--danger)" },
  offline: { tint: "neutral", title: "You're offline — scanning needs a connection", bg: "var(--surface-2)", fg: "var(--text-muted)" },
};

const DEDUPE_MS = 3000;

export function QrScanner({ eventId }: { eventId: string }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastDecode = useRef<{ token: string; at: number }>({ token: "", at: 0 });
  const inFlight = useRef(false);
  const seq = useRef(0);

  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [hasDetector] = useState(() => typeof window !== "undefined" && "BarcodeDetector" in window);
  const [online, setOnline] = useState(() => typeof navigator === "undefined" || navigator.onLine);
  const [manual, setManual] = useState("");
  const [last, setLast] = useState<ScanLine | null>(null);
  const [feed, setFeed] = useState<ScanLine[]>([]);
  const [tally, setTally] = useState({ ok: 0, already: 0, invalid: 0 });

  // Fold one scan result into the session (last banner + feed + tally). Stable across renders.
  const record = useCallback(
    (outcome: Outcome, label: string, detail?: string, result?: CheckinResult) => {
      const line: ScanLine = {
        key: `${seq.current++}`,
        outcome,
        label: result?.guestName || label,
        detail,
        at: Date.now(),
      };
      setLast(line);
      setFeed((f) => [line, ...f].slice(0, 25));
      if (outcome === "ok" || outcome === "already" || outcome === "invalid") {
        setTally((s) => ({ ...s, [outcome]: s[outcome] + 1 }));
      }
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(outcome === "ok" ? 60 : [40, 40, 40]);
      }
    },
    [],
  );

  // Submit a decoded/typed token to the scan endpoint and fold the result into the session.
  const submit = useCallback(
    async (token: string, fromCamera: boolean) => {
      const t = token.trim();
      if (!t || inFlight.current) return;
      if (fromCamera) {
        const now = Date.now();
        if (t === lastDecode.current.token && now - lastDecode.current.at < DEDUPE_MS) return;
        lastDecode.current = { token: t, at: now };
      }
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        record("offline", "—");
        return;
      }
      inFlight.current = true;
      try {
        const r: CheckinResult = await scan(eventId, t);
        record("ok", r.guestName || r.guestPhone || "Guest", undefined, r);
      } catch (e) {
        if (e instanceof ApiError) {
          if (e.code === "ALREADY_CHECKED_IN") record("already", "Guest", e.message);
          else if (e.code === "TICKET_INVALID" || e.status === 404) record("invalid", "Ticket", e.message);
          else if (e.status === 403) record("denied", "Ticket", e.message);
          else record("invalid", "Ticket", e.message);
        } else {
          record("invalid", "Ticket", "Could not reach the server.");
        }
      } finally {
        inFlight.current = false;
      }
    },
    [eventId, record],
  );

  // Connectivity banner (docs/05 §6.1). Initial value is read lazily into state above; the effect
  // only subscribes to later online/offline transitions.
  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, []);

  // Camera + decode loop. Prefers the native BarcodeDetector; manual entry is the fallback.
  useEffect(() => {
    if (!cameraOn) return;
    const Detector = (window as unknown as { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector;
    if (!Detector) return; // guarded by `hasDetector` — the Start button is hidden without it
    let stream: MediaStream | null = null;
    let raf = 0;
    let cancelled = false;
    const detector = new Detector({ formats: ["qr_code"] });

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (cancelled) return;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();

        const tick = async () => {
          if (cancelled) return;
          const v = videoRef.current;
          const c = canvasRef.current;
          if (v && c && v.readyState >= 2) {
            c.width = v.videoWidth;
            c.height = v.videoHeight;
            const ctx = c.getContext("2d");
            if (ctx) {
              ctx.drawImage(v, 0, 0, c.width, c.height);
              try {
                const codes = await detector.detect(c);
                if (codes[0]?.rawValue) await submit(codes[0].rawValue, true);
              } catch {
                /* transient decode error — keep scanning */
              }
            }
          }
          raf = requestAnimationFrame(() => void tick());
        };
        raf = requestAnimationFrame(() => void tick());
      } catch {
        if (!cancelled) {
          setCameraError("Camera unavailable — use manual entry below.");
          setCameraOn(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      if (raf) cancelAnimationFrame(raf);
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [cameraOn, submit]);

  const CARD =
    "rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]";

  return (
    <div className="space-y-5">
      {!online && (
        <div role="status" className="rounded-[var(--radius-md)] bg-[var(--surface-3)] px-4 py-3 text-[13px] font-semibold text-[var(--text-muted)]">
          You’re offline — scanning needs a connection.
        </div>
      )}

      <div className={CARD}>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[15px] font-bold text-[var(--text-strong)]">Scan guest QR</h2>
          <div className="flex gap-1.5 text-[12px] font-bold">
            <Badge variant="green" dot={false}>{tally.ok} in</Badge>
            <Badge variant="orange" dot={false}>{tally.already} dup</Badge>
            <Badge variant="danger" dot={false}>{tally.invalid} bad</Badge>
          </div>
        </div>

        <div className="relative mt-4 aspect-square w-full max-w-[360px] overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-black/80">
          <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
          <canvas ref={canvasRef} className="hidden" />
          {!cameraOn && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center text-[13px] text-white/80">
              <p className="px-6">{hasDetector ? "Point the camera at a guest’s QR ticket." : "QR camera isn’t supported on this device — use manual entry."}</p>
              {hasDetector && <Button size="sm" onClick={() => { setCameraError(null); setCameraOn(true); }}>Start camera</Button>}
            </div>
          )}
          {cameraOn && (
            <button
              onClick={() => setCameraOn(false)}
              className="absolute right-2 top-2 rounded-[var(--radius-sm)] bg-black/50 px-2.5 py-1 text-[12px] font-bold text-white"
            >
              Stop
            </button>
          )}
        </div>
        {cameraError && <p role="alert" className="mt-2 text-[13px] font-semibold text-[var(--danger)]">{cameraError}</p>}

        {/* Manual entry — the required fallback (docs/05 §6). */}
        <form
          className="mt-4 flex flex-wrap items-end gap-2"
          onSubmit={(e) => { e.preventDefault(); void submit(manual, false).then(() => setManual("")); }}
        >
          <div className="min-w-[200px] flex-1">
            <label htmlFor="manual-token" className="mb-1.5 block text-[12px] font-bold text-[var(--text)]">Enter token manually</label>
            <input
              id="manual-token"
              value={manual}
              onChange={(e) => setManual(e.target.value)}
              placeholder="tkt_…"
              className="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 font-[var(--font-dm-mono)] text-[13px] text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
            />
          </div>
          <Button size="sm" type="submit" disabled={!manual.trim()}>Check in</Button>
        </form>
      </div>

      {last && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-[var(--radius-xl)] border border-[var(--border)] p-5 text-center"
          style={{ background: OUTCOME[last.outcome].bg }}
        >
          <p className="text-[18px] font-extrabold" style={{ color: OUTCOME[last.outcome].fg }}>
            {OUTCOME[last.outcome].title}
          </p>
          <p className="mt-1 text-[14px] font-semibold text-[var(--text)]">{last.label}</p>
          {last.detail && <p className="mt-0.5 text-[12px] text-[var(--text-muted)]">{last.detail}</p>}
        </div>
      )}

      {feed.length > 0 && (
        <div className={CARD}>
          <h3 className="mb-3 text-[12px] font-bold uppercase tracking-[0.06em] text-[var(--text-muted)]">This session</h3>
          <ul className="space-y-1.5">
            {feed.map((s) => (
              <li key={s.key} className="flex items-center justify-between gap-3 text-[13px]">
                <span className="font-semibold text-[var(--text)]">{s.label}</span>
                <Badge variant={OUTCOME[s.outcome].tint} dot={false}>{OUTCOME[s.outcome].title}</Badge>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
