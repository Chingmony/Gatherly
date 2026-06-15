"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  MapPin,
  ChevronRight,
  ChevronLeft,
  PencilLine,
  Radio,
  ImageIcon,
  ImagePlus,
  ShieldCheck,
  AlertCircle,
  Loader2,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChipIco } from "@/components/ui/chip-ico";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApiError } from "@/lib/api/client";
import { createEvent, publishEvent, type EventCreateInput } from "@/lib/api/events";

const CATEGORIES = ["Conference", "Workshop", "Festival", "Meetup", "Webinar", "Summit"] as const;

const STATUSES = ["draft", "published"] as const;

const COVERS = [
  { id: "violet", from: "#6366f1", to: "#8b5cf6" },
  { id: "orange", from: "#f59e0b", to: "#f97316" },
  { id: "teal", from: "#14b8a6", to: "#06b6d4" },
  { id: "green", from: "#22c55e", to: "#10b981" },
  { id: "amber", from: "#f97316", to: "#ec4899" },
  { id: "blue", from: "#3b82f6", to: "#6366f1" },
] as const;

function fmtDate(d: string) {
  if (!d) return "Date TBD";
  const dt = new Date(`${d}T00:00:00`);
  if (Number.isNaN(dt.getTime())) return "Date TBD";
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function fmtTime(t: string) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const ap = h < 12 ? "AM" : "PM";
  const hh = ((h + 11) % 12) + 1;
  return `${hh}:${String(m).padStart(2, "0")} ${ap}`;
}

export default function CreateEventPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    category: "Conference" as (typeof CATEGORIES)[number],
    capacity: "",
    date: "",
    time: "09:00",
    venue: "",
    description: "",
    cover: "violet" as (typeof COVERS)[number]["id"],
    coverImage: null as string | null,
    status: "draft" as (typeof STATUSES)[number],
  });

  const fileRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState<null | "draft" | "publish">(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const cover = COVERS.find((c) => c.id === form.cover) ?? COVERS[0];
  const coverGradient = `linear-gradient(135deg, ${cover.from}, ${cover.to})`;
  const coverStyle: React.CSSProperties = form.coverImage
    ? { backgroundImage: `url(${form.coverImage})`, backgroundSize: "cover", backgroundPosition: "center" }
    : { background: coverGradient };

  function handlePickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setForm((p) => {
      if (p.coverImage) URL.revokeObjectURL(p.coverImage);
      return { ...p, coverImage: URL.createObjectURL(file) };
    });
    e.target.value = "";
  }

  function removeImage() {
    setForm((p) => {
      if (p.coverImage) URL.revokeObjectURL(p.coverImage);
      return { ...p, coverImage: null };
    });
  }

  function buildPayload(): EventCreateInput {
    const title = form.name.trim();
    const capacity = form.capacity.trim() === "" ? null : Number(form.capacity);
    // Combine the date + time inputs into an ISO-8601 instant; null when no date is set.
    let startsAt: string | null = null;
    if (form.date) {
      const dt = new Date(`${form.date}T${form.time || "00:00"}`);
      if (!Number.isNaN(dt.getTime())) startsAt = dt.toISOString();
    }
    return {
      title,
      category: form.category,
      capacity: capacity != null && Number.isFinite(capacity) ? capacity : null,
      description: form.description.trim() || null,
      venue: form.venue.trim() || null,
      // Cover image upload goes through Rustfs (out of scope here); persist the chosen color theme.
      coverColor: form.cover,
      coverImageUrl: null,
      startsAt,
    };
  }

  async function submit(mode: "draft" | "publish") {
    if (submitting) return;
    setError(null);
    setFieldErrors([]);
    if (!form.name.trim()) {
      setError("Event name is required.");
      return;
    }
    setSubmitting(mode);
    try {
      const created = await createEvent(buildPayload());
      if (mode === "publish") {
        await publishEvent(created.id);
      }
      router.push("/events");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || "Couldn't create the event. Please review your details.");
        setFieldErrors(err.fieldErrors.map((fe) => fe.message).filter(Boolean));
      } else {
        setError("Something went wrong. Please try again.");
      }
      setSubmitting(null);
    }
  }

  function handlePublish(e: React.FormEvent) {
    e.preventDefault();
    void submit("publish");
  }

  function handleDraft() {
    void submit("draft");
  }

  return (
    <div className="flex flex-col gap-5 view-anim">
      {/* ── Breadcrumb ── */}
      <nav className="flex items-center gap-1.5 text-[13px] font-semibold" style={{ color: "var(--text-muted)" }}>
        <ChevronLeft size={15} style={{ color: "var(--text-faint)" }} />
        <Link href="/events" className="transition-colors hover:text-[var(--primary-hex,#6366f1)]">
          Events
        </Link>
        <ChevronRight size={14} style={{ color: "var(--text-faint)" }} />
        <span style={{ color: "var(--text-strong)" }}>New event</span>
      </nav>

      <PageHeader title="Create Event" sub="Set up a new event, then publish it when you're ready">
        <Button variant="ghost" size="sm" onClick={handleDraft} disabled={submitting !== null}>
          {submitting === "draft" ? <Loader2 size={15} className="animate-spin" /> : <PencilLine size={15} />}
          Save draft
        </Button>
        <Button size="sm" onClick={handlePublish} disabled={submitting !== null}>
          {submitting === "publish" ? <Loader2 size={15} className="animate-spin" /> : <Radio size={15} />}
          Create &amp; publish
        </Button>
      </PageHeader>

      {error && (
        <div
          className="flex flex-col gap-1 rounded-[var(--radius-md)] border px-3.5 py-3"
          style={{ background: "var(--danger-soft)", borderColor: "var(--danger)" }}
          role="alert"
        >
          <span className="inline-flex items-center gap-2 text-sm font-bold" style={{ color: "var(--danger)" }}>
            <AlertCircle size={15} /> {error}
          </span>
          {fieldErrors.length > 0 && (
            <ul className="list-disc pl-8 m-0 text-xs" style={{ color: "var(--text)" }}>
              {fieldErrors.map((m, i) => <li key={i}>{m}</li>)}
            </ul>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-6 items-start">
        {/* ── Left: Form ── */}
        <form onSubmit={handlePublish} className="flex flex-col gap-6">
          {/* Event details */}
          <Card>
            <CardHeader className="gap-3">
              <ChipIco variant="primary" size={44} radius={13}>
                <Calendar size={20} />
              </ChipIco>
              <div className="flex flex-col gap-0.5">
                <CardTitle>Event Details</CardTitle>
                <CardDescription>The basics</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-4 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name">Event name</Label>
                <Input
                  id="name"
                  placeholder="e.g. NorthStar Tech Summit"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="category">Category</Label>
                  <Select value={form.category} onValueChange={(v) => set("category", v)}>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="capacity">
                    Capacity <span style={{ color: "var(--text-faint)" }}>(optional)</span>
                  </Label>
                  <Input
                    id="capacity"
                    type="number"
                    min="1"
                    placeholder="Unlimited"
                    value={form.capacity}
                    onChange={(e) => set("capacity", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="date">Date</Label>
                  <div className="relative">
                    <Calendar size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-faint)" }} />
                    <Input
                      id="date"
                      type="date"
                      value={form.date}
                      onChange={(e) => set("date", e.target.value)}
                      className="pl-10 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="time">Start time</Label>
                  <div className="relative">
                    <Clock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-faint)" }} />
                    <Input
                      id="time"
                      type="time"
                      value={form.time}
                      onChange={(e) => set("time", e.target.value)}
                      className="pl-10 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="venue">Venue</Label>
                <Input
                  id="venue"
                  placeholder="Pier 48, San Francisco"
                  value={form.venue}
                  onChange={(e) => set("venue", e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="desc">Description</Label>
                <Textarea
                  id="desc"
                  placeholder="What's this event about?"
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Appearance */}
          <Card>
            <CardHeader className="gap-3">
              <ChipIco variant="violet" size={44} radius={13}>
                <ImageIcon size={20} />
              </ChipIco>
              <div className="flex flex-col gap-0.5">
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Cover &amp; status</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-4 flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <Label>Cover image</Label>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handlePickImage}
                />
                {form.coverImage ? (
                  <div
                    className="relative h-40 rounded-[var(--radius-md)] overflow-hidden border"
                    style={{ borderColor: "var(--border-hex,#ecedf4)" }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={form.coverImage} alt="Event cover preview" className="w-full h-full object-cover" />
                    <div className="absolute top-2 right-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        className="text-xs font-bold px-2.5 py-1 rounded-full backdrop-blur-sm cursor-pointer"
                        style={{ background: "rgba(17,20,42,0.55)", color: "#fff" }}
                      >
                        Replace
                      </button>
                      <button
                        type="button"
                        onClick={removeImage}
                        aria-label="Remove cover image"
                        className="flex items-center justify-center w-7 h-7 rounded-full backdrop-blur-sm cursor-pointer"
                        style={{ background: "rgba(17,20,42,0.55)", color: "#fff" }}
                      >
                        <X size={15} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="flex flex-col items-center justify-center gap-2.5 h-40 rounded-[var(--radius-md)] border-2 border-dashed cursor-pointer transition-colors hover:border-[var(--primary-hex,#6366f1)] hover:bg-[var(--primary-soft)]"
                    style={{ borderColor: "var(--border-strong)", background: "var(--surface-2)" }}
                  >
                    <ImagePlus size={26} style={{ color: "var(--text-faint)" }} />
                    <div className="text-center">
                      <p className="text-sm font-bold m-0" style={{ color: "var(--text-muted)" }}>
                        Click to upload cover image
                      </p>
                      <p className="text-xs mt-0.5 m-0" style={{ color: "var(--text-faint)" }}>
                        PNG, JPG or WEBP up to 4 MB
                      </p>
                    </div>
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label>{form.coverImage ? "Fallback color" : "Or pick a color"}</Label>
                <div className="flex flex-wrap items-center gap-2.5">
                  {COVERS.map((c) => {
                    const active = form.cover === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        aria-label={`Cover ${c.id}`}
                        onClick={() => set("cover", c.id)}
                        className="h-9 w-14 rounded-[var(--radius-sm)] cursor-pointer transition-transform active:scale-95"
                        style={{
                          background: `linear-gradient(135deg, ${c.from}, ${c.to})`,
                          boxShadow: active
                            ? "0 0 0 2px var(--surface), 0 0 0 4px var(--primary-hex,#6366f1)"
                            : "var(--shadow-sm)",
                        }}
                      />
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label>Status</Label>
                <div className="flex items-center gap-2">
                  {STATUSES.map((s) => {
                    const active = form.status === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => set("status", s)}
                        className="px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer"
                        style={{
                          background: active ? "var(--primary-soft)" : "var(--surface-2)",
                          borderColor: active ? "var(--primary-hex,#6366f1)" : "var(--border-hex,#ecedf4)",
                          color: active ? "var(--primary-hex,#6366f1)" : "var(--text-muted)",
                        }}
                      >
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </button>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </form>

        {/* ── Right: Live preview ── */}
        <div className="flex flex-col gap-4 xl:sticky xl:top-6">
          <Card>
            <CardContent className="p-5 flex flex-col gap-4">
              <h3 className="text-[17px] font-extrabold tracking-tight m-0" style={{ color: "var(--text-strong)" }}>
                Live Preview
              </h3>

              {/* Event preview card */}
              <div
                className="rounded-[var(--radius-lg)] border overflow-hidden"
                style={{ borderColor: "var(--border-hex,#ecedf4)", background: "var(--surface)" }}
              >
                {/* Cover */}
                <div className="relative h-36 flex items-start justify-between p-3" style={coverStyle}>
                  <span
                    className="text-[11px] font-bold px-2.5 py-1 rounded-full backdrop-blur-sm"
                    style={{ background: "rgba(255,255,255,0.22)", color: "#fff" }}
                  >
                    {form.category}
                  </span>
                  <span
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full backdrop-blur-sm"
                    style={{ background: "rgba(17,20,42,0.42)", color: "#fff" }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: form.status === "published" ? "var(--green)" : "#cbd2e0" }}
                    />
                    {form.status.charAt(0).toUpperCase() + form.status.slice(1)}
                  </span>
                </div>

                {/* Body */}
                <div className="p-4 flex flex-col gap-3">
                  <h4 className="text-[17px] font-extrabold leading-tight m-0" style={{ color: "var(--text-strong)" }}>
                    {form.name || "Untitled event"}
                  </h4>

                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px]" style={{ color: "var(--text-muted)" }}>
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar size={13} />
                      {fmtDate(form.date)}
                      {form.date && form.time ? ` · ${fmtTime(form.time)}` : ""}
                    </span>
                    <span style={{ color: "var(--text-faint)" }}>·</span>
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin size={13} />
                      {form.venue || "Venue TBD"}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1.5 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold" style={{ color: "var(--text-muted)" }}>
                        Registration
                      </span>
                      <span className="text-xs font-extrabold" style={{ color: "var(--text-strong)" }}>
                        0 / {form.capacity || "Unlimited"}
                      </span>
                    </div>
                    <Progress value={0} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Info banner */}
          <div
            className="flex items-start gap-3 p-4 rounded-[var(--radius-lg)] border"
            style={{ background: "var(--primary-soft)", borderColor: "var(--primary-ring)" }}
          >
            <ShieldCheck size={18} className="flex-shrink-0 mt-0.5" style={{ color: "var(--primary-hex,#6366f1)" }} />
            <p className="text-sm font-semibold leading-relaxed m-0" style={{ color: "var(--text)" }}>
              Only Admins can create events. New events start as drafts until you publish them.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
