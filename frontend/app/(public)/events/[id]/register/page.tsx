"use client";

import { useState } from "react";
import { Calendar, MapPin, Users, Check, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const EVENT = {
  id: "ev1",
  name: "NorthStar Leadership Summit",
  date: "Jun 18, 2026",
  time: "9:00 AM",
  location: "Moscone Center, San Francisco, CA",
  capacity: 1000,
  registered: 842,
  cover: "#6366f1",
  organizer: "Gatherly Inc.",
};

// Simulated JSONB form schema
const FORM_FIELDS = [
  { id: "f-email", label: "Email address", type: "email",  placeholder: "your@email.com",    required: true },
  { id: "f-phone", label: "Phone number",  type: "tel",    placeholder: "+1 (555) 000-0000", required: true },
  { id: "f-first", label: "First name",    type: "text",   placeholder: "Jane",              required: true },
  { id: "f-last",  label: "Last name",     type: "text",   placeholder: "Smith",             required: true },
  { id: "f-org",   label: "Organization",  type: "text",   placeholder: "Acme Corp.",        required: false },
  { id: "f-title", label: "Job title",     type: "text",   placeholder: "CTO",               required: false },
];

type FormState = Record<string, string>;

export default function RegisterPage() {
  const [values, setValues] = useState<FormState>({});
  const [submitted, setSubmitted] = useState(false);

  function set(k: string, v: string) { setValues((p) => ({ ...p, [k]: v })); }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: "var(--bg)" }}>
        <div
          className="w-full max-w-sm rounded-[22px] border p-8 flex flex-col items-center gap-5 text-center"
          style={{ background: "var(--surface)", borderColor: "var(--border-hex,#ecedf4)", boxShadow: "var(--shadow-pop)" }}
        >
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "var(--green-soft)" }}>
            <Check size={28} style={{ color: "var(--green-600)" }} />
          </div>
          <div>
            <h2 className="text-[22px] font-extrabold m-0" style={{ color: "var(--text-strong)" }}>You&apos;re registered!</h2>
            <p className="text-sm mt-1.5 m-0" style={{ color: "var(--text-muted)" }}>
              Check your email for your ticket and QR code.
            </p>
          </div>
          <div
            className="w-full rounded-[var(--radius-lg)] p-4 flex flex-col gap-1.5 text-left"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border-hex,#ecedf4)" }}
          >
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Event</span>
            <span className="text-sm font-bold" style={{ color: "var(--text-strong)" }}>{EVENT.name}</span>
            <span className="text-xs flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
              <Calendar size={11} /> {EVENT.date} at {EVENT.time}
            </span>
            <span className="text-xs flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
              <MapPin size={11} /> {EVENT.location}
            </span>
          </div>
          <Link href="/explore">
            <Button variant="ghost" size="sm">Explore more events</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      {/* Minimal public header */}
      <header
        className="sticky top-0 z-30 h-[60px] flex items-center px-6 gap-4"
        style={{
          background: "color-mix(in srgb, var(--surface) 88%, transparent)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--border-hex,#ecedf4)",
        }}
      >
        <Logo size={28} />
        <div className="flex-1" />
        <Link href="/explore" className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>
          All events
        </Link>
      </header>

      {/* Cover */}
      <div className="h-44" style={{ background: `linear-gradient(135deg, ${EVENT.cover}, color-mix(in srgb, ${EVENT.cover} 30%, #22c55e))` }} />

      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 pb-16 -mt-10">
        {/* Two-column grid */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_360px] gap-6 items-start">
          {/* ── Left: Event info + form ── */}
          <div className="flex flex-col gap-5">
            {/* Event card header */}
            <div
              className="rounded-[22px] border px-6 py-5"
              style={{ background: "var(--surface)", borderColor: "var(--border-hex,#ecedf4)", boxShadow: "var(--shadow-card)" }}
            >
              <h1 className="text-[22px] font-extrabold m-0 leading-tight" style={{ color: "var(--text-strong)" }}>
                {EVENT.name}
              </h1>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2.5">
                <span className="flex items-center gap-1.5 text-sm" style={{ color: "var(--text-muted)" }}>
                  <Calendar size={13} /> {EVENT.date} at {EVENT.time}
                </span>
                <span className="flex items-center gap-1.5 text-sm" style={{ color: "var(--text-muted)" }}>
                  <MapPin size={13} /> {EVENT.location}
                </span>
                <span className="flex items-center gap-1.5 text-sm" style={{ color: "var(--text-muted)" }}>
                  <Users size={13} /> {EVENT.capacity - EVENT.registered} spots left
                </span>
              </div>
            </div>

            {/* Registration form */}
            <form
              onSubmit={handleSubmit}
              className="rounded-[22px] border px-6 py-6 flex flex-col gap-4"
              style={{ background: "var(--surface)", borderColor: "var(--border-hex,#ecedf4)", boxShadow: "var(--shadow-card)" }}
            >
              <h2 className="text-base font-extrabold m-0" style={{ color: "var(--text-strong)" }}>Registration details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {FORM_FIELDS.map((field) => (
                  <div key={field.id} className="flex flex-col gap-1.5">
                    <Label htmlFor={field.id}>
                      {field.label}
                      {field.required && <span style={{ color: "var(--danger)" }}> *</span>}
                    </Label>
                    <Input
                      id={field.id}
                      type={field.type}
                      placeholder={field.placeholder}
                      value={values[field.id] ?? ""}
                      onChange={(e) => set(field.id, e.target.value)}
                      required={field.required}
                    />
                  </div>
                ))}
              </div>
              <p className="text-xs m-0" style={{ color: "var(--text-faint)" }}>
                By registering you agree to Gatherly&apos;s terms of service. Your ticket will be emailed with a unique QR code.
              </p>
              <Button type="submit" size="block" className="h-[50px] mt-1">
                Complete registration <ChevronRight size={15} />
              </Button>
            </form>
          </div>

          {/* ── Right: Ticket summary card (sticky) ── */}
          <div
            className="rounded-[22px] border overflow-hidden sticky top-20 hidden md:block"
            style={{ background: "var(--surface)", borderColor: "var(--border-hex,#ecedf4)", boxShadow: "var(--shadow-card)" }}
          >
            {/* Gradient header */}
            <div
              className="h-24 flex items-end px-5 pb-4"
              style={{ background: `linear-gradient(135deg, ${EVENT.cover}, color-mix(in srgb, ${EVENT.cover} 30%, #22c55e))` }}
            >
              <span className="text-white font-extrabold text-sm">Your Ticket</span>
            </div>

            <div className="px-5 py-5 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <span className="text-[15px] font-extrabold" style={{ color: "var(--text-strong)" }}>{EVENT.name}</span>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>by {EVENT.organizer}</span>
              </div>

              <div className="flex flex-col gap-2.5 py-3 border-y" style={{ borderColor: "var(--border-hex,#ecedf4)" }}>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar size={13} style={{ color: "var(--primary-hex,#6366f1)", flexShrink: 0 }} />
                  <span style={{ color: "var(--text)" }}>{EVENT.date} at {EVENT.time}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin size={13} style={{ color: "var(--primary-hex,#6366f1)", flexShrink: 0 }} />
                  <span style={{ color: "var(--text)" }}>{EVENT.location}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users size={13} style={{ color: "var(--primary-hex,#6366f1)", flexShrink: 0 }} />
                  <span style={{ color: "var(--text)" }}>{EVENT.capacity - EVENT.registered} spots remaining</span>
                </div>
              </div>

              {/* QR placeholder */}
              <div
                className="rounded-[var(--radius-md)] flex flex-col items-center justify-center py-6 gap-2"
                style={{ background: "var(--surface-2)", border: "1.5px dashed var(--border-hex,#ecedf4)" }}
              >
                <div className="w-16 h-16 rounded-lg" style={{ background: "var(--surface-3)" }} />
                <span className="text-xs" style={{ color: "var(--text-faint)" }}>QR code generated after registration</span>
              </div>

              <p className="text-[11.5px] text-center m-0" style={{ color: "var(--text-faint)" }}>
                Ticket will be emailed upon successful registration.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
