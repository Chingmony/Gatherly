"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ImagePlus, Calendar, MapPin, Users, X, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getEvent, updateEvent, EVENT_CATEGORIES, type EventCategory } from "@/lib/api/events";
import { uploadEventCover } from "@/lib/api/storage";
import { ApiError } from "@/lib/api/client";
import { toast } from "@/components/ui/toast";

const CATEGORY_LABEL: Record<string, string> = {
  CONFERENCE: "Conference", FESTIVAL: "Festival", NETWORKING: "Networking",
  WORKSHOP: "Workshop", GALA: "Gala", HACKATHON: "Hackathon", OTHER: "Other",
};

export default function EditEventPage() {
  const router = useRouter();
  const params = useParams();
  const id = String(params.id);

  const [form, setForm] = useState({
    name: "", description: "", date: "", time: "", location: "",
    category: "CONFERENCE" as EventCategory, hasCapacity: false, capacity: "",
  });
  const [currentCover, setCurrentCover] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: string, v: string | boolean) => setForm((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    let cancelled = false;
    getEvent(id)
      .then((ev) => {
        if (cancelled) return;
        const d = ev.startsAt ? new Date(ev.startsAt) : null;
        const pad = (n: number) => String(n).padStart(2, "0");
        setForm({
          name: ev.title,
          description: ev.description ?? "",
          date: d ? `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` : "",
          time: d ? `${pad(d.getHours())}:${pad(d.getMinutes())}` : "",
          location: ev.venue ?? "",
          category: ev.category ?? "OTHER",
          hasCapacity: ev.capacity != null,
          capacity: ev.capacity != null ? String(ev.capacity) : "",
        });
        setCurrentCover(ev.coverUrl);
      })
      .catch((e) => { if (!cancelled) setLoadError(e instanceof ApiError ? e.message : "Failed to load event."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

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
    if (!form.name.trim()) { setError("Event name is required."); return; }
    setSaving(true);
    setError(null);
    try {
      const coverKey = coverFile ? await uploadEventCover(coverFile) : undefined;
      const startsAt = form.date ? new Date(`${form.date}T${form.time || "00:00"}`).toISOString() : undefined;
      await updateEvent(id, {
        title: form.name.trim(),
        description: form.description.trim() || null,
        venue: form.location.trim() || null,
        ...(startsAt ? { startsAt } : {}),
        category: form.category,
        capacity: form.hasCapacity && form.capacity ? Number(form.capacity) : null,
        ...(coverKey ? { coverKey } : {}),
      });
      toast.success("Event updated", `"${form.name.trim()}" was saved.`);
      router.push("/events");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update event.");
      setSaving(false);
    }
  }

  const previewCover = coverPreview ?? currentCover;

  if (loading) {
    return <div className="py-24 flex items-center justify-center gap-2 text-sm" style={{ color: "var(--text-muted)" }}><Loader2 size={18} className="animate-spin" /> Loading event…</div>;
  }
  if (loadError) {
    return <div className="py-24 text-center text-sm" style={{ color: "var(--danger)" }}>{loadError}</div>;
  }

  return (
    <div className="flex flex-col gap-6 view-anim">
      <PageHeader title="Edit Event" sub="Update this event's details">
        <Button variant="ghost" size="sm" onClick={() => router.back()} disabled={saving}>Cancel</Button>
        <Button size="sm" onClick={handleSubmit} disabled={saving}>
          {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : "Save changes"}
        </Button>
      </PageHeader>

      <div className="max-w-3xl flex flex-col gap-5">
        {/* Cover */}
        <Card>
          <CardContent className="p-5">
            <Label className="mb-2 block">Event cover</Label>
            {previewCover ? (
              <div className="relative h-40 rounded-[var(--radius-md)] overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewCover} alt="cover" className="w-full h-full object-cover" />
                <label htmlFor="cover" className="absolute inset-0 cursor-pointer" title="Change cover" />
                {coverPreview && (
                  <button type="button" onClick={clearCover} aria-label="Discard new cover"
                    className="absolute top-2 right-2 flex items-center justify-center w-7 h-7 rounded-full text-white shadow z-10" style={{ background: "var(--danger)" }}>
                    <X size={15} />
                  </button>
                )}
              </div>
            ) : (
              <label htmlFor="cover"
                className="flex flex-col items-center justify-center gap-3 h-40 rounded-[var(--radius-md)] border-2 border-dashed cursor-pointer transition-colors hover:border-[var(--primary-hex,#6366f1)] hover:bg-[var(--primary-soft)]"
                style={{ borderColor: "var(--border-strong)", background: "var(--surface-2)" }}>
                <ImagePlus size={28} style={{ color: "var(--text-faint)" }} />
                <p className="text-sm font-bold" style={{ color: "var(--text-muted)" }}>Click to upload cover image</p>
              </label>
            )}
            <input id="cover" type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => pickCover(e.target.files?.[0])} />
          </CardContent>
        </Card>

        {/* Details */}
        <Card>
          <CardHeader className="px-6 pt-6 pb-2"><CardTitle>Event details</CardTitle></CardHeader>
          <CardContent className="px-6 pb-6 pt-4 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Event name *</Label>
              <Input id="name" value={form.name} onChange={(e) => set("name", e.target.value)} required />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => set("category", v)}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>{EVENT_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{CATEGORY_LABEL[c]}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="location">Location</Label>
                <div className="relative">
                  <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-faint)" }} />
                  <Input id="location" className="pl-10" value={form.location} onChange={(e) => set("location", e.target.value)} />
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="desc">Description</Label>
              <Textarea id="desc" value={form.description} onChange={(e) => set("description", e.target.value)} className="min-h-[100px]" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="date">Date</Label>
                <div className="relative">
                  <Calendar size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-faint)" }} />
                  <Input id="date" type="date" className="pl-10" value={form.date} onChange={(e) => set("date", e.target.value)} />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="time">Start time</Label>
                <Input id="time" type="time" value={form.time} onChange={(e) => set("time", e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Capacity */}
        <Card>
          <CardContent className="px-6 py-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-bold" style={{ color: "var(--text-strong)" }}>Enable capacity limit</span>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>Set a maximum number of registrations</span>
              </div>
              <button type="button" onClick={() => set("hasCapacity", !form.hasCapacity)} className="transition-colors cursor-pointer"
                style={{ width: 48, height: 27, borderRadius: 99, border: "none", background: form.hasCapacity ? "var(--primary-hex,#6366f1)" : "var(--surface-3)", position: "relative" }}>
                <span style={{ position: "absolute", top: 3, borderRadius: "50%", background: "#fff", width: 21, height: 21, left: form.hasCapacity ? 24 : 3, transition: "left .2s" }} />
              </button>
            </div>
            {form.hasCapacity && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="capacity">Max capacity</Label>
                <div className="relative">
                  <Users size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-faint)" }} />
                  <Input id="capacity" type="number" min="1" className="pl-10" value={form.capacity} onChange={(e) => set("capacity", e.target.value)} />
                </div>
              </div>
            )}
            {error && <p className="text-sm m-0" style={{ color: "var(--danger)" }}>{error}</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
