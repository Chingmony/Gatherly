"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createEvent } from "@/lib/api/events";
import { uploadAsset } from "@/lib/api/storage";
import { ApiError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { DateField } from "@/components/ui/date-field";
import { coverGradient, COVER_KEYS } from "@/lib/covers";

type CoverMode = "color" | "custom" | "image";

// Preset gradient stop pairs — matches covers.ts a–f
const PRESET_GRADIENTS: Record<string, [string, string]> = {
  a: ["#6d6bf5", "#8b5cf6"],
  b: ["#ec4899", "#f59e0b"],
  c: ["#14b8a6", "#3b82f6"],
  d: ["#22c55e", "#14b8a6"],
  e: ["#f59e0b", "#ec4899"],
  f: ["#3b82f6", "#6366f1"],
};

function buildGradient(from: string, to: string) {
  return `linear-gradient(135deg, ${from}, ${to})`;
}

function formatDate(iso?: string): string {
  if (!iso) return "Date TBD";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function CreateEventForm() {
  const router = useRouter();

  // ── form fields ──────────────────────────────────────────────────────────
  const [title, setTitle] = useState("");
  const [venue, setVenue] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [capacity, setCapacity] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");

  // ── cover state ───────────────────────────────────────────────────────────
  const [coverMode, setCoverMode] = useState<CoverMode>("color");
  const [preset, setPreset] = useState<string>("a");            // preset key a–f
  const [customFrom, setCustomFrom] = useState("#6366f1");      // custom gradient from
  const [customTo, setCustomTo] = useState("#8b5cf6");          // custom gradient to
  const [coverImageKey, setCoverImageKey] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);

  // ── submission ────────────────────────────────────────────────────────────
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Revoke object URL on unmount to avoid memory leaks
  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  // ── derived cover CSS for the preview ────────────────────────────────────
  const previewBackground =
    coverMode === "image" && imagePreview
      ? undefined
      : coverMode === "custom"
      ? buildGradient(customFrom, customTo)
      : coverGradient(preset);

  // ── image upload ──────────────────────────────────────────────────────────
  const handleFile = useCallback(async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setUploading(true);
    const localUrl = URL.createObjectURL(file);
    setImagePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return localUrl;
    });
    setCoverMode("image");
    try {
      const key = await uploadAsset(file, "EVENT_COVER");
      setCoverImageKey(key);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Cover upload failed.");
      setImagePreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setCoverMode("color");
    } finally {
      setUploading(false);
    }
  }, []);

  function removeImage() {
    setImagePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setCoverImageKey("");
    setCoverMode("color");
  }

  // Drag-and-drop handlers
  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragging(true);
  }
  function onDragLeave() {
    setDragging(false);
  }
  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  }

  // ── submit ────────────────────────────────────────────────────────────────
  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const resolvedGradient =
        coverMode === "custom"
          ? `custom:${customFrom}:${customTo}`
          : coverMode === "image"
          ? preset
          : preset;

      await createEvent({
        title,
        venue: venue || undefined,
        description: description || undefined,
        category: category || undefined,
        capacity: capacity ? Number(capacity) : undefined,
        coverGradient: resolvedGradient,
        coverImageKey:
          coverMode === "image" && coverImageKey ? coverImageKey : undefined,
        startsAt: startsAt ? new Date(startsAt).toISOString() : undefined,
        endsAt: endsAt ? new Date(endsAt).toISOString() : undefined,
      });
      router.push("/events");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create event.");
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={onCreate}
      className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]"
    >
      {/* ══════════════════════════════════════════════════════════════════════
          LEFT — input panel
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="space-y-5 rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)]">

        {/* Basic info */}
        <section className="space-y-4">
          <SectionLabel>Event Details</SectionLabel>

          <div>
            <Label htmlFor="title">Title <Required /></Label>
            <Input
              id="title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Annual Summit 2026"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="venue">Venue</Label>
              <Input
                id="venue"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="Grand Hall, Jakarta"
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Conference"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="capacity">Capacity</Label>
            <Input
              id="capacity"
              type="number"
              min={0}
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              placeholder="Unlimited"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Tell attendees what to expect…"
              className="w-full resize-none rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-[14px] text-[var(--text)] placeholder:text-[var(--text-faint)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:border-[var(--primary)]"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="startsAt">Starts</Label>
              <DateField id="startsAt" value={startsAt} onChange={setStartsAt} />
            </div>
            <div>
              <Label htmlFor="endsAt">Ends</Label>
              <DateField id="endsAt" value={endsAt} onChange={setEndsAt} />
            </div>
          </div>
        </section>

        <Divider />

        {/* Cover picker */}
        <section className="space-y-3">
          <SectionLabel>Cover</SectionLabel>

          {/* Mode tabs */}
          <div
            role="group"
            aria-label="Cover type"
            className="inline-flex items-center gap-0.5 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-2)] p-0.5"
          >
            {(["color", "custom", "image"] as CoverMode[]).map((m) => (
              <CoverTab
                key={m}
                active={coverMode === m}
                onClick={() => setCoverMode(m)}
              >
                {m === "color" ? "Presets" : m === "custom" ? "Custom" : "Image"}
              </CoverTab>
            ))}
          </div>

          {/* Preset swatches */}
          {coverMode === "color" && (
            <div className="space-y-2">
              <p className="text-[11.5px] text-[var(--text-muted)]">
                Choose a gradient theme for your event card.
              </p>
              <div className="flex flex-wrap gap-2">
                {COVER_KEYS.map((k) => {
                  const [from, to] = PRESET_GRADIENTS[k];
                  return (
                    <button
                      key={k}
                      type="button"
                      aria-label={`Preset ${k}`}
                      aria-pressed={preset === k}
                      onClick={() => setPreset(k)}
                      className="relative h-10 w-16 overflow-hidden rounded-[10px] transition-all hover:scale-105"
                      style={{
                        background: buildGradient(from, to),
                        boxShadow:
                          preset === k
                            ? `0 0 0 2px var(--surface), 0 0 0 4px var(--primary)`
                            : undefined,
                      }}
                    >
                      {preset === k && (
                        <span className="absolute inset-0 flex items-center justify-center">
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            className="drop-shadow"
                          >
                            <path
                              d="M5 13l4 4L19 7"
                              stroke="white"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Custom gradient builder */}
          {coverMode === "custom" && (
            <div className="space-y-3">
              <p className="text-[11.5px] text-[var(--text-muted)]">
                Pick two colors to build your own gradient.
              </p>
              <div className="flex items-center gap-4">
                <ColorSwatch
                  label="From"
                  value={customFrom}
                  onChange={setCustomFrom}
                />
                {/* Arrow between swatches */}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="shrink-0 text-[var(--text-faint)]">
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <ColorSwatch
                  label="To"
                  value={customTo}
                  onChange={setCustomTo}
                />
              </div>
              <div
                className="h-8 w-full rounded-[8px]"
                style={{ background: buildGradient(customFrom, customTo) }}
              />
            </div>
          )}

          {/* Image upload */}
          {coverMode === "image" && (
            <div className="space-y-2">
              {imagePreview ? (
                <div className="relative overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)]" style={{ height: 140 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreview}
                    alt="Cover preview"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-end justify-end p-2">
                    <button
                      type="button"
                      onClick={removeImage}
                      className="rounded-full bg-black/60 px-3 py-1.5 text-[12px] font-semibold text-white backdrop-blur hover:bg-black/80"
                    >
                      Remove
                    </button>
                  </div>
                  {uploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                      <span className="text-[13px] font-semibold text-white">Uploading…</span>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                  className={`flex w-full flex-col items-center justify-center gap-2 rounded-[var(--radius-md)] border-2 border-dashed py-8 transition-colors ${
                    dragging
                      ? "border-[var(--primary)] bg-[var(--primary-soft)]"
                      : "border-[var(--border)] bg-[var(--surface-2)] hover:border-[var(--primary)] hover:bg-[var(--primary-soft)]"
                  }`}
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-[var(--text-muted)]">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"
                      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="text-[13px] font-semibold text-[var(--text-muted)]">
                    {dragging ? "Drop to upload" : "Click or drag image here"}
                  </span>
                  <span className="text-[11px] text-[var(--text-faint)]">PNG, JPG, WEBP</span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
            </div>
          )}
        </section>

        {error && (
          <p className="rounded-[var(--radius-sm)] bg-[var(--danger-soft)] px-3.5 py-2.5 text-[13px] font-medium text-[var(--danger)]" role="alert">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={() => router.push("/events")}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending || uploading}>
            {pending ? "Creating…" : "Create Event"}
          </Button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          RIGHT — live preview
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="lg:sticky lg:top-6 lg:self-start space-y-3">
        <p className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-[var(--text-faint)]">
          Live Preview
        </p>

        {/* Event card */}
        <div className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)]">

          {/* Cover */}
          <div className="relative" style={{ height: 180 }}>
            {coverMode === "image" && imagePreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imagePreview}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div
                aria-hidden
                className="absolute inset-0 transition-all duration-500"
                style={{ background: previewBackground }}
              />
            )}

            {/* Bottom fade overlay */}
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, transparent 40%, rgba(13,10,40,.55) 100%)",
              }}
            />

            {/* Status badge */}
            <span className="absolute left-3 top-3">
              <Badge variant="neutral">Draft</Badge>
            </span>

            {/* Category chip */}
            {category && (
              <span className="absolute right-3 top-3 rounded-full bg-black/30 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-sm">
                {category}
              </span>
            )}

            {/* Title over cover */}
            <div className="absolute inset-x-0 bottom-0 px-4 pb-3">
              <p className="truncate text-[16px] font-bold leading-tight text-white drop-shadow">
                {title || "Untitled Event"}
              </p>
              {(startsAt || venue) && (
                <p className="mt-0.5 truncate text-[12px] font-medium text-white/80">
                  {formatDate(startsAt)}
                  {venue ? ` · ${venue}` : ""}
                </p>
              )}
            </div>
          </div>

          {/* Card body */}
          <div className="p-4 space-y-3">
            {description ? (
              <p className="line-clamp-3 text-[13px] leading-relaxed text-[var(--text-muted)]">
                {description}
              </p>
            ) : (
              <p className="text-[13px] italic text-[var(--text-faint)]">
                No description yet.
              </p>
            )}

            <div className="flex items-center gap-2 pt-1 flex-wrap">
              {capacity && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--surface-2)] px-2.5 py-1 text-[11.5px] font-semibold text-[var(--text-muted)]">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
                      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {Number(capacity).toLocaleString()} seats
                </span>
              )}
              {endsAt && startsAt && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--surface-2)] px-2.5 py-1 text-[11.5px] font-semibold text-[var(--text-muted)]">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                  Ends {formatDate(endsAt)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Color swatch hint under card */}
        {coverMode !== "image" && (
          <div className="flex items-center gap-2 px-1">
            <div
              className="h-3 w-3 rounded-full shrink-0"
              style={{ background: previewBackground }}
            />
            <p className="text-[11px] text-[var(--text-faint)]">
              {coverMode === "custom"
                ? `${customFrom} → ${customTo}`
                : `Preset "${preset}"`}
            </p>
          </div>
        )}

        <p className="px-1 text-[11px] text-[var(--text-faint)]">
          This is how the event card will appear in the admin console.
        </p>
      </div>
    </form>
  );
}

// ── small sub-components ──────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold uppercase tracking-[0.07em] text-[var(--text-faint)]">
      {children}
    </p>
  );
}

function Divider() {
  return <hr className="border-[var(--border)]" />;
}

function Required() {
  return <span className="ml-0.5 text-[var(--danger)]">*</span>;
}

function CoverTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-[calc(var(--radius-sm)-2px)] px-3.5 py-1.5 text-[12.5px] font-semibold transition-all ${
        active
          ? "bg-[var(--primary)] text-white shadow-[var(--shadow-sm)]"
          : "text-[var(--text-muted)] hover:text-[var(--text)]"
      }`}
    >
      {children}
    </button>
  );
}

function ColorSwatch({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="flex flex-col items-center gap-1.5">
      <p className="text-[11px] font-semibold text-[var(--text-muted)]">{label}</p>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="h-10 w-10 rounded-full border-2 border-[var(--border)] shadow-[var(--shadow-sm)] transition-transform hover:scale-110"
        style={{ background: value }}
        aria-label={`${label} color: ${value}`}
      />
      <p className="font-mono text-[10.5px] text-[var(--text-faint)]">{value}</p>
      <input
        ref={inputRef}
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="sr-only"
      />
    </div>
  );
}
