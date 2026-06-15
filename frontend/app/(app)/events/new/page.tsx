"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Calendar, MapPin, Users, Eye, X, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createEvent, publishEvent, EVENT_CATEGORIES, type EventCategory } from "@/lib/api/events";
import { uploadEventCover } from "@/lib/api/storage";
import { ApiError } from "@/lib/api/client";
import { toast } from "@/components/ui/toast";

const STATUSES = ["draft", "published"] as const;
const CATEGORY_LABEL: Record<string, string> = {
  CONFERENCE: "Conference", FESTIVAL: "Festival", NETWORKING: "Networking",
  WORKSHOP: "Workshop", GALA: "Gala", HACKATHON: "Hackathon", OTHER: "Other",
};
const CATEGORY_GRADIENT: Record<string, string> = {
  CONFERENCE: "linear-gradient(135deg, #8e7bf2, #7c5cf5)",
  FESTIVAL:   "linear-gradient(135deg, #f2607e, #f59345)",
  NETWORKING: "linear-gradient(135deg, #28b7b0, #3b7fd4)",
  WORKSHOP:   "linear-gradient(135deg, #34c777, #1fa86a)",
  GALA:       "linear-gradient(135deg, #f5a13d, #ec5c8a)",
  HACKATHON:  "linear-gradient(135deg, #5b8df0, #4f63ef)",
  OTHER:      "linear-gradient(135deg, #6366f1, #8b5cf6)",
};

export default function CreateEventPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    description: "",
    date: "",
    time: "",
    endDate: "",
    endTime: "",
    checkinDate: "",
    checkinTime: "",
    location: "",
    category: "CONFERENCE" as EventCategory,
    status: "draft" as "draft" | "published",
    hasCapacity: false,
    capacity: "",
  });
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: string, v: string | boolean) => setForm((p) => ({ ...p, [k]: v }));

  function pickCover(file: File | undefined) {
    if (!file) return;
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  }
  function clearCover() {
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverFile(null);
    setCoverPreview(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Event name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const coverKey = coverFile ? await uploadEventCover(coverFile) : null;
      const toIso = (d: string, t: string) => (d ? new Date(`${d}T${t || "00:00"}`).toISOString() : null);
      const startsAt = toIso(form.date, form.time);
      const endsAt = toIso(form.endDate, form.endTime);
      const checkinOpensAt = toIso(form.checkinDate, form.checkinTime);
      if (startsAt && endsAt && new Date(endsAt) < new Date(startsAt)) {
        setError("End date/time must be after the start.");
        setSaving(false);
        return;
      }
      const created = await createEvent({
        title: form.name.trim(),
        description: form.description.trim() || null,
        venue: form.location.trim() || null,
        startsAt,
        endsAt,
        checkinOpensAt,
        category: form.category,
        capacity: form.hasCapacity && form.capacity ? Number(form.capacity) : null,
        coverKey,
      });
      if (form.status === "published") {
        await publishEvent(created.id);
      }
      toast.success("Event created", `"${created.title}" was created.`);
      router.push("/events");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create event.");
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 view-anim">
      <PageHeader title="Create Event" sub="Set up a new event from scratch">
        <Button variant="ghost" size="sm" onClick={() => router.back()} disabled={saving}>Cancel</Button>
        <Button size="sm" onClick={handleSubmit} disabled={saving}>
          {saving ? <><Loader2 size={14} className="animate-spin" /> Creating…</> : "Create event"}
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6 items-start">
        {/* ── Left: Form ── */}
        <div className="flex flex-col gap-5">
          {/* Cover image */}
          <Card>
            <CardContent className="p-5">
              <Label className="mb-2 block">Event cover</Label>
              {coverPreview ? (
                <div className="relative h-40 rounded-[var(--radius-md)] overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={coverPreview} alt="cover preview" className="w-full h-full object-cover" />
                  <button type="button" onClick={clearCover} aria-label="Remove cover"
                    className="absolute top-2 right-2 flex items-center justify-center w-7 h-7 rounded-full text-white shadow"
                    style={{ background: "var(--danger)" }}>
                    <X size={15} />
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="cover"
                  className="flex flex-col items-center justify-center gap-3 h-40 rounded-[var(--radius-md)] border-2 border-dashed cursor-pointer transition-colors hover:border-[var(--primary-hex,#6366f1)] hover:bg-[var(--primary-soft)]"
                  style={{ borderColor: "var(--border-strong)", background: "var(--surface-2)" }}
                >
                  <ImagePlus size={28} style={{ color: "var(--text-faint)" }} />
                  <div className="text-center">
                    <p className="text-sm font-bold" style={{ color: "var(--text-muted)" }}>Click to upload cover image</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-faint)" }}>PNG, JPG, WEBP up to 5 MB</p>
                  </div>
                </label>
              )}
              <input id="cover" type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => pickCover(e.target.files?.[0])} />
            </CardContent>
          </Card>

          {/* Core details */}
          <Card>
            <CardHeader className="px-6 pt-6 pb-2">
              <CardTitle>Event details</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-4 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name">Event name *</Label>
                <Input id="name" placeholder="e.g. NorthStar Tech Summit" value={form.name} onChange={(e) => set("name", e.target.value)} required />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={(v) => set("category", v)}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {EVENT_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{CATEGORY_LABEL[c]}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="location">Location</Label>
                  <div className="relative">
                    <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-faint)" }} />
                    <Input id="location" placeholder="Venue or city" className="pl-10" value={form.location} onChange={(e) => set("location", e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="desc">Description</Label>
                <Textarea id="desc" placeholder="What is this event about?" value={form.description} onChange={(e) => set("description", e.target.value)} className="min-h-[100px]" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="date">Start date</Label>
                  <Input id="date" type="date" value={form.date} onChange={(e) => set("date", e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="time">Start time</Label>
                  <Input id="time" type="time" value={form.time} onChange={(e) => set("time", e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="endDate">End date</Label>
                  <Input id="endDate" type="date" value={form.endDate} onChange={(e) => set("endDate", e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="endTime">End time</Label>
                  <Input id="endTime" type="time" value={form.endTime} onChange={(e) => set("endTime", e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="checkinDate">Check-in opens — date</Label>
                  <Input id="checkinDate" type="date" value={form.checkinDate} onChange={(e) => set("checkinDate", e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="checkinTime">Check-in opens — time</Label>
                  <Input id="checkinTime" type="time" value={form.checkinTime} onChange={(e) => set("checkinTime", e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Capacity & status */}
          <Card>
            <CardContent className="px-6 py-5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-bold" style={{ color: "var(--text-strong)" }}>Enable capacity limit</span>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>Set a maximum number of registrations</span>
                </div>
                <button
                  type="button"
                  onClick={() => set("hasCapacity", !form.hasCapacity)}
                  className="transition-colors cursor-pointer"
                  style={{ width: 48, height: 27, borderRadius: 99, border: "none", background: form.hasCapacity ? "var(--primary-hex,#6366f1)" : "var(--surface-3)", position: "relative" }}
                >
                  <span style={{ position: "absolute", top: 3, borderRadius: "50%", background: "#fff", width: 21, height: 21, left: form.hasCapacity ? 24 : 3, transition: "left .2s" }} />
                </button>
              </div>

              {form.hasCapacity && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="capacity">Max capacity</Label>
                  <div className="relative">
                    <Users size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-faint)" }} />
                    <Input id="capacity" type="number" min="1" placeholder="500" className="pl-10" value={form.capacity} onChange={(e) => set("capacity", e.target.value)} />
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <Label>Status</Label>
                <div className="flex items-center gap-2">
                  {STATUSES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => set("status", s)}
                      className="px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer"
                      style={{
                        background: form.status === s ? "var(--primary-soft)" : "var(--surface-2)",
                        borderColor: form.status === s ? "var(--primary-hex,#6366f1)" : "var(--border-hex,#ecedf4)",
                        color: form.status === s ? "var(--primary-hex,#6366f1)" : "var(--text-muted)",
                      }}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {error && <p className="text-sm m-0" style={{ color: "var(--danger)" }}>{error}</p>}
            </CardContent>
          </Card>
        </div>

        {/* ── Right: Preview ── */}
        <div
          className="rounded-[var(--radius-xl)] border overflow-hidden sticky top-6"
          style={{ background: "var(--surface)", borderColor: "var(--border-hex, #ecedf4)", boxShadow: "var(--shadow-card)" }}
        >
          <div className="flex items-center gap-2 px-5 py-4 border-b" style={{ borderColor: "var(--border-hex, #ecedf4)" }}>
            <Eye size={16} style={{ color: "var(--primary-hex, #6366f1)" }} />
            <span className="text-sm font-extrabold" style={{ color: "var(--text-strong)" }}>Live preview</span>
          </div>

          <div
            className="relative h-28 flex items-end px-5 pb-4"
            style={
              coverPreview
                ? { backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.15), rgba(0,0,0,0.3)), url(${coverPreview})`, backgroundSize: "cover", backgroundPosition: "center" }
                : { background: CATEGORY_GRADIENT[form.category] }
            }
          >
            <span className="absolute top-3 left-4 text-xs font-bold px-2.5 py-1 rounded-full text-white" style={{ background: "rgba(0,0,0,0.22)" }}>
              {CATEGORY_LABEL[form.category]}
            </span>
            {form.status && (
              <StatusBadge variant={form.status === "published" ? "green" : "gray"}>
                {form.status.charAt(0).toUpperCase() + form.status.slice(1)}
              </StatusBadge>
            )}
          </div>

          <div className="p-5 flex flex-col gap-3">
            <h3 className="text-base font-extrabold leading-tight m-0" style={{ color: "var(--text-strong)" }}>
              {form.name || <span style={{ color: "var(--text-faint)" }}>Event name</span>}
            </h3>
            {form.description && <p className="text-sm leading-relaxed m-0" style={{ color: "var(--text-muted)" }}>{form.description}</p>}
            <div className="flex flex-col gap-1.5">
              {form.date && (
                <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                  <Calendar size={13} /> {form.date} {form.time && `at ${form.time}`}
                </div>
              )}
              {form.location && (
                <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                  <MapPin size={13} /> {form.location}
                </div>
              )}
              {form.hasCapacity && form.capacity && (
                <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                  <Users size={13} /> Max {form.capacity} guests
                </div>
              )}
            </div>
            <Button size="block" className="mt-2">Register now</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
