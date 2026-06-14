"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Calendar, MapPin, Users, Eye } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import type { Metadata } from "next";

const STATUSES = ["draft", "published"] as const;

export default function CreateEventPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    description: "",
    date: "",
    time: "",
    location: "",
    status: "draft" as "draft" | "published",
    hasCapacity: false,
    capacity: "",
  });

  const set = (k: string, v: string | boolean) => setForm((p) => ({ ...p, [k]: v }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    router.push("/events");
  }

  return (
    <div className="flex flex-col gap-6 view-anim">
      <PageHeader title="Create Event" sub="Set up a new event from scratch">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>Cancel</Button>
        <Button size="sm" onClick={handleSubmit}>Create event</Button>
      </PageHeader>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6 items-start">
        {/* ── Left: Form ── */}
        <div className="flex flex-col gap-5">
          {/* Cover image placeholder */}
          <Card>
            <CardContent className="p-5">
              <Label className="mb-2 block">Event cover</Label>
              <div
                className="flex flex-col items-center justify-center gap-3 h-40 rounded-[var(--radius-md)] border-2 border-dashed cursor-pointer transition-colors hover:border-[var(--primary-hex,#6366f1)] hover:bg-[var(--primary-soft)]"
                style={{ borderColor: "var(--border-strong)", background: "var(--surface-2)" }}
                onClick={() => alert("Upload not yet available in v1.")}
              >
                <ImagePlus size={28} style={{ color: "var(--text-faint)" }} />
                <div className="text-center">
                  <p className="text-sm font-bold" style={{ color: "var(--text-muted)" }}>
                    Click to upload cover image
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-faint)" }}>
                    PNG, JPG up to 4 MB — upload available in next release
                  </p>
                </div>
              </div>
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
                <Input
                  id="name"
                  placeholder="e.g. NorthStar Leadership Summit"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="desc">Description</Label>
                <Textarea
                  id="desc"
                  placeholder="What is this event about?"
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  className="min-h-[100px]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="date">Date *</Label>
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

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="location">Location</Label>
                <div className="relative">
                  <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-faint)" }} />
                  <Input id="location" placeholder="Venue or city" className="pl-10" value={form.location} onChange={(e) => set("location", e.target.value)} />
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
                  style={{
                    width: 48, height: 27, borderRadius: 99, border: "none",
                    background: form.hasCapacity ? "var(--primary-hex,#6366f1)" : "var(--surface-3)",
                    position: "relative",
                  }}
                >
                  <span
                    style={{
                      position: "absolute", top: 3, borderRadius: "50%", background: "#fff",
                      width: 21, height: 21,
                      left: form.hasCapacity ? 24 : 3,
                      transition: "left .2s",
                    }}
                  />
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

          {/* Cover area */}
          <div
            className="h-28 flex items-end px-5 pb-4"
            style={{
              background: "linear-gradient(135deg, var(--primary-hex,#6366f1), color-mix(in srgb, var(--primary-hex,#6366f1) 50%, #22c55e))",
            }}
          >
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
            {form.description && (
              <p className="text-sm leading-relaxed m-0" style={{ color: "var(--text-muted)" }}>
                {form.description}
              </p>
            )}
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
