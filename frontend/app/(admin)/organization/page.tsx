"use client";

import { useState } from "react";
import { ImagePlus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/ui/logo";

const ACCENTS = ["#6366f1", "#8b5cf6", "#14b8a6", "#3b82f6", "#ec4899", "#22c55e"];

export default function OrganizationPage() {
  const [name, setName]     = useState("Gatherly Inc.");
  const [slug, setSlug]     = useState("gatherly-co");
  const [email, setEmail]   = useState("hello@gatherly.io");
  const [phone, setPhone]   = useState("+1 (415) 555-0142");
  const [accent, setAccent] = useState("#6366f1");

  return (
    <div className="flex flex-col gap-6 view-anim">
      <PageHeader title="Organization" sub="Branding & identity settings">
        <Button size="sm">Save changes</Button>
      </PageHeader>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6 items-start">
        <div className="flex flex-col gap-5">
          <Card>
            <CardHeader className="px-6 pt-6 pb-2"><CardTitle>Brand assets</CardTitle></CardHeader>
            <CardContent className="px-6 pb-6 pt-4 flex flex-col gap-4">
              {[{ label: "Organization logo", h: "h-24" }, { label: "Event banner", h: "h-16" }].map(({ label, h }) => (
                <div key={label} className="flex flex-col gap-1.5">
                  <Label>{label}</Label>
                  <div
                    className={`flex items-center justify-center gap-2 ${h} rounded-[var(--radius-md)] border-2 border-dashed cursor-pointer transition-colors hover:bg-[var(--primary-soft)]`}
                    style={{ borderColor: "var(--border-strong)", background: "var(--surface-2)" }}
                    onClick={() => alert("Upload not yet available in v1.")}
                  >
                    <ImagePlus size={18} style={{ color: "var(--text-faint)" }} />
                    <span className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>Upload — available in next release</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="px-6 pt-6 pb-2"><CardTitle>Identity</CardTitle></CardHeader>
            <CardContent className="px-6 pb-6 pt-4 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="org-name">Organization name</Label>
                <Input id="org-name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="org-slug">Public URL</Label>
                <div className="flex">
                  <span className="flex items-center px-3 text-sm rounded-l-[var(--radius-md)] border border-r-0 font-semibold" style={{ background: "var(--surface-3)", borderColor: "var(--border-hex,#ecedf4)", color: "var(--text-muted)" }}>
                    gatherly.io/
                  </span>
                  <Input id="org-slug" value={slug} onChange={(e) => setSlug(e.target.value)} className="rounded-l-none" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="org-email">Support email</Label>
                  <Input id="org-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="org-phone">Contact phone</Label>
                  <Input id="org-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Brand accent</Label>
                <div className="flex items-center gap-2.5">
                  {ACCENTS.map((c) => (
                    <button key={c} type="button" onClick={() => setAccent(c)} className="cursor-pointer transition-all" style={{ width: 34, height: 34, borderRadius: 10, background: c, border: "none", outline: accent === c ? `3px solid var(--surface)` : "3px solid transparent", boxShadow: accent === c ? `0 0 0 2px ${c}` : "none" }} />
                  ))}
                  <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>{accent}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="rounded-[var(--radius-xl)] border overflow-hidden sticky top-6" style={{ background: "var(--surface)", borderColor: "var(--border-hex,#ecedf4)", boxShadow: "var(--shadow-card)" }}>
          <div className="px-5 py-4 border-b" style={{ borderColor: "var(--border-hex,#ecedf4)" }}>
            <span className="text-sm font-extrabold" style={{ color: "var(--text-strong)" }}>Live preview</span>
          </div>
          <div className="relative h-[84px]" style={{ background: `linear-gradient(120deg, ${accent}, color-mix(in srgb, ${accent} 50%, #22c55e))` }}>
            <div className="absolute left-4 -bottom-6 w-14 h-14 rounded-xl flex items-center justify-center border-4" style={{ background: "var(--surface)", borderColor: "var(--surface)", boxShadow: "var(--shadow-sm)" }}>
              <Logo size={26} showText={false} />
            </div>
          </div>
          <div className="px-5 pt-9 pb-5 flex flex-col gap-1.5">
            <span className="text-[15px] font-extrabold" style={{ color: "var(--text-strong)" }}>{name}</span>
            <span className="text-[12.5px]" style={{ color: "var(--text-muted)" }}>gatherly.io/{slug}</span>
            <Button size="sm" className="mt-3 self-start" style={{ background: accent }}>Register now</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
