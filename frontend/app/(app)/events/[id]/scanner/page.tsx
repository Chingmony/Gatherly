"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { BrowserQRCodeReader } from "@zxing/browser";
import type { IScannerControls } from "@zxing/browser";
import { QrCode, CheckCircle2, XCircle, AlertTriangle, Info, Hash } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch, ApiError } from "@/lib/api/client";

interface CheckinResponse {
  guestName: string;
}

type ScanResult =
  | { type: "success";      token: string; name: string }
  | { type: "already_used"; token: string }
  | { type: "invalid";      token: string }
  | { type: "unauthorized"; token: string };

type ScanEntry = ScanResult & { time: string };

function now() {
  return new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

const RESULT_STYLE: Record<ScanResult["type"], { bg: string; border: string; color: string; icon: React.ReactNode; label: string }> = {
  success:      { bg: "var(--green-soft)",  border: "var(--green-600)", color: "var(--green-600)", icon: <CheckCircle2 size={28} />,  label: "Check-in success!" },
  already_used: { bg: "var(--orange-soft)", border: "var(--orange)",    color: "var(--orange)",    icon: <AlertTriangle size={28} />, label: "Already checked in" },
  invalid:      { bg: "var(--danger-soft)", border: "var(--danger)",    color: "var(--danger)",    icon: <XCircle size={28} />,       label: "Invalid ticket" },
  unauthorized: { bg: "var(--blue-soft)",   border: "var(--blue)",      color: "var(--blue)",      icon: <Info size={28} />,          label: "Unauthorized" },
};

export default function ScannerPage() {
  const { id: eventId } = useParams<{ id: string }>();

  const [active, setActive]           = useState(false);
  const [lastResult, setLastResult]   = useState<ScanResult | null>(null);
  const [history, setHistory]         = useState<ScanEntry[]>([]);
  const [manualToken, setManualToken] = useState("");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [counts, setCounts]           = useState({ success: 0, already_used: 0, invalid: 0, unauthorized: 0 });

  const videoRef       = useRef<HTMLVideoElement>(null);
  const codeReaderRef  = useRef<BrowserQRCodeReader | null>(null);
  const controlsRef    = useRef<IScannerControls | null>(null);
  const lastTokenRef   = useRef<{ token: string; time: number } | null>(null);
  const clearRef       = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleScan(result: ScanResult) {
    const entry: ScanEntry = { ...result, time: now() };
    setLastResult(result);
    setHistory((prev) => [entry, ...prev].slice(0, 20));
    setCounts((prev) => ({ ...prev, [result.type]: prev[result.type] + 1 }));
    if (clearRef.current) clearTimeout(clearRef.current);
    clearRef.current = setTimeout(() => setLastResult(null), 3500);
  }

  const submitToken = useCallback(async (token: string) => {
    const last = lastTokenRef.current;
    if (last && last.token === token && Date.now() - last.time < 1500) return;
    lastTokenRef.current = { token, time: Date.now() };

    try {
      const res = await apiFetch<CheckinResponse>(`/events/${eventId}/attendance/scan`, {
        method: "POST",
        body: { checkinToken: token },
      });
      handleScan({ type: "success", token, name: res.guestName });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === "ALREADY_CHECKED_IN") {
          handleScan({ type: "already_used", token });
        } else if (err.code === "FORBIDDEN") {
          handleScan({ type: "unauthorized", token });
        } else {
          handleScan({ type: "invalid", token });
        }
      } else {
        handleScan({ type: "invalid", token });
      }
    }
  }, [eventId]);

  useEffect(() => {
    if (!active) {
      controlsRef.current?.stop();
      controlsRef.current = null;
      codeReaderRef.current = null;
      setCameraError(null);
      return;
    }

    if (!videoRef.current) return;

    const reader = new BrowserQRCodeReader();
    codeReaderRef.current = reader;

    reader
      .decodeFromConstraints(
        { video: { facingMode: "environment" } },
        videoRef.current,
        (result) => {
          if (result) submitToken(result.getText());
        },
      )
      .then((controls) => {
        controlsRef.current = controls;
      })
      .catch((err: unknown) => {
        setCameraError(err instanceof Error ? err.message : "Camera unavailable");
        setActive(false);
      });

    return () => {
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, [active, submitToken]);

  function handleManual(e: React.FormEvent) {
    e.preventDefault();
    const token = manualToken.trim();
    if (!token) return;
    void submitToken(token);
    setManualToken("");
  }

  const style = lastResult ? RESULT_STYLE[lastResult.type] : null;

  return (
    <div className="flex flex-col gap-5 view-anim">
      <PageHeader title="QR Scanner" sub="Scan guest tickets to check in attendees" />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-5 items-start">
        {/* ── Camera viewfinder ── */}
        <div className="flex flex-col gap-4">
          <div
            className="relative rounded-[var(--radius-xl)] overflow-hidden"
            style={{
              background: "#0f1117",
              aspectRatio: "4/3",
              maxHeight: 420,
              boxShadow: "var(--shadow-pop)",
            }}
          >
            {/* Live video feed */}
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
              style={{ display: active && !cameraError ? "block" : "none" }}
            />

            {/* Scan line animation */}
            {active && !cameraError && (
              <div
                className="absolute left-0 right-0 h-0.5 z-10"
                style={{
                  background: "var(--primary-hex,#6366f1)",
                  boxShadow: "0 0 8px var(--primary-hex,#6366f1)",
                  animation: "scanLine 2.4s linear infinite",
                }}
              />
            )}

            {/* Corner guides */}
            <div className="absolute inset-10 pointer-events-none z-10">
              {(["tl", "tr", "bl", "br"] as const).map((c) => (
                <div
                  key={c}
                  className="absolute w-10 h-10"
                  style={{
                    borderColor: active && !cameraError ? "var(--primary-hex,#6366f1)" : "#444",
                    borderStyle: "solid",
                    borderWidth: 0,
                    ...(c === "tl" ? { top: 0, left: 0,    borderTopWidth: 3, borderLeftWidth: 3 }   : {}),
                    ...(c === "tr" ? { top: 0, right: 0,   borderTopWidth: 3, borderRightWidth: 3 }  : {}),
                    ...(c === "bl" ? { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 } : {}),
                    ...(c === "br" ? { bottom: 0, right: 0,borderBottomWidth: 3, borderRightWidth: 3 }: {}),
                  }}
                />
              ))}
            </div>

            {/* Idle state */}
            {!active && !cameraError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                <QrCode size={52} style={{ color: "#555" }} />
                <p className="text-sm font-semibold" style={{ color: "#888" }}>Camera is off</p>
              </div>
            )}

            {/* Camera error */}
            {cameraError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 text-center">
                <XCircle size={36} style={{ color: "var(--danger)" }} />
                <p className="text-sm font-semibold text-white">Camera unavailable</p>
                <p className="text-xs" style={{ color: "#aaa" }}>Use manual token entry below</p>
              </div>
            )}

            {/* Result overlay */}
            {lastResult && style && (
              <div
                className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 text-center z-20"
                style={{ background: "rgba(15,17,23,0.85)", backdropFilter: "blur(4px)" }}
              >
                <div style={{ color: style.color }}>{style.icon}</div>
                <p className="text-lg font-extrabold text-white m-0">{style.label}</p>
                {lastResult.type === "success" && (
                  <p className="text-sm font-semibold m-0" style={{ color: "#ccc" }}>{lastResult.name}</p>
                )}
                <code className="text-xs px-2 py-1 rounded" style={{ background: "rgba(255,255,255,.08)", color: "#aaa" }}>
                  {lastResult.token}
                </code>
              </div>
            )}
          </div>

          {/* Control buttons */}
          <div className="flex items-center gap-3">
            <Button
              size="block"
              onClick={() => setActive((v) => !v)}
              style={{ background: active ? "var(--danger)" : "var(--primary-hex,#6366f1)" }}
            >
              <QrCode size={15} /> {active ? "Stop camera" : "Start camera"}
            </Button>
          </div>

          {/* Manual entry */}
          <form onSubmit={handleManual} className="flex flex-col gap-2">
            <Label htmlFor="manual-token">Manual token entry</Label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Hash size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-faint)" }} />
                <Input
                  id="manual-token"
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  placeholder="TKT-XXXXXXXXX"
                  className="pl-9 font-mono"
                />
              </div>
              <Button type="submit" size="sm">Check in</Button>
            </div>
          </form>
        </div>

        {/* ── Right panel: tally + history ── */}
        <div className="flex flex-col gap-4">
          {/* Session tally */}
          <div
            className="rounded-[var(--radius-xl)] border p-5 flex flex-col gap-3"
            style={{ background: "var(--surface)", borderColor: "var(--border-hex,#ecedf4)", boxShadow: "var(--shadow-card)" }}
          >
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Session tally</span>
            <div className="grid grid-cols-3 gap-3">
              {([
                { key: "success",      label: "Checked in", color: "var(--green-600)" },
                { key: "already_used", label: "Duplicate",  color: "var(--orange)" },
                { key: "invalid",      label: "Invalid",    color: "var(--danger)" },
              ] as const).map(({ key, label, color }) => (
                <div key={key} className="flex flex-col items-center gap-0.5 py-2">
                  <span className="text-2xl font-extrabold" style={{ color }}>{counts[key]}</span>
                  <span className="text-[11px] font-semibold" style={{ color: "var(--text-muted)" }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent scans */}
          <div
            className="rounded-[var(--radius-xl)] border p-5 flex flex-col gap-3"
            style={{ background: "var(--surface)", borderColor: "var(--border-hex,#ecedf4)", boxShadow: "var(--shadow-card)" }}
          >
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Recent scans</span>
            {history.length === 0 ? (
              <span className="text-sm text-center py-4" style={{ color: "var(--text-faint)" }}>No scans yet</span>
            ) : (
              <div className="flex flex-col gap-2 max-h-[360px] overflow-y-auto pr-1">
                {history.map((entry, i) => {
                  const s = RESULT_STYLE[entry.type];
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)]"
                      style={{ background: s.bg }}
                    >
                      <div style={{ color: s.color, flexShrink: 0 }}>{s.icon}</div>
                      <div className="flex-1 min-w-0">
                        {entry.type === "success" && (
                          <div className="text-sm font-bold truncate" style={{ color: "var(--text-strong)" }}>{entry.name}</div>
                        )}
                        <code className="text-[11px]" style={{ color: "var(--text-muted)" }}>{entry.token}</code>
                      </div>
                      <span className="text-[11px] flex-shrink-0" style={{ color: "var(--text-faint)" }}>{entry.time}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
