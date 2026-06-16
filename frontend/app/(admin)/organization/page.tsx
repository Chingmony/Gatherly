"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/ui/logo";
import { toast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api/client";
import { getOrganization, updateOrganization, type Organization } from "@/lib/api/organization";
import { uploadOrgLogo, uploadOrgBanner } from "@/lib/api/storage";

type AssetKind = "logo" | "banner";
const ACCEPT_IMAGE = "image/png,image/jpeg,image/webp";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

interface OrgForm {
  name: string;
  description: string;
  contactEmail: string;
  contactPhone: string;
}

function toForm(o: Organization): OrgForm {
  return {
    name: o.name ?? "",
    description: o.description ?? "",
    contactEmail: o.contactEmail ?? "",
    contactPhone: o.contactPhone ?? "",
  };
}

export default function OrganizationPage() {
  const [org, setOrg]         = useState<Organization | null>(null);
  const [form, setForm]       = useState<OrgForm>({ name: "", description: "", contactEmail: "", contactPhone: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [saving, setSaving]   = useState(false);
  const [uploading, setUploading] = useState<AssetKind | null>(null);
  const logoInputRef   = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback((signal?: AbortSignal) =>
    getOrganization(signal)
      .then((o) => { setOrg(o); setForm(toForm(o)); })
      .catch((e) => { if (!signal?.aborted) setError(e instanceof ApiError ? e.message : "Failed to load organization."); }),
  []);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    load(ctrl.signal).finally(() => { if (!ctrl.signal.aborted) setLoading(false); });
    return () => ctrl.abort();
  }, [load]);

  const dirty = org != null && (
    form.name !== (org.name ?? "") ||
    form.description !== (org.description ?? "") ||
    form.contactEmail !== (org.contactEmail ?? "") ||
    form.contactPhone !== (org.contactPhone ?? "")
  );
  const canSave = dirty && form.name.trim().length > 0 && !saving;

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    try {
      const updated = await updateOrganization({
        name: form.name.trim(),
        description: form.description.trim(),
        contactEmail: form.contactEmail.trim(),
        contactPhone: form.contactPhone.trim(),
      });
      setOrg(updated);
      setForm(toForm(updated));
      toast.success("Organization saved");
    } catch (e) {
      // 403 if a sub-admin reaches this; the catalog edit is ADMIN-only.
      const msg = e instanceof ApiError
        ? (e.status === 403 ? "Only an admin can edit the organization profile." : e.message)
        : undefined;
      toast.error("Couldn't save changes", msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleUpload(kind: AssetKind, file: File | undefined) {
    if (!file || uploading) return;
    if (!ACCEPT_IMAGE.split(",").includes(file.type)) {
      toast.error("Unsupported file", "Use a PNG, JPEG, or WebP image.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("Image too large", "Max size is 5 MB.");
      return;
    }
    setUploading(kind);
    try {
      const objectKey = kind === "logo" ? await uploadOrgLogo(file) : await uploadOrgBanner(file);
      const updated = await updateOrganization(kind === "logo" ? { logoKey: objectKey } : { bannerKey: objectKey });
      setOrg(updated);
      toast.success(kind === "logo" ? "Logo updated" : "Banner updated");
    } catch (e) {
      const msg = e instanceof ApiError
        ? (e.status === 403 ? "Only an admin can upload organization assets." : e.message)
        : e instanceof Error ? e.message : undefined;
      toast.error("Upload failed", msg);
    } finally {
      setUploading(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24" style={{ color: "var(--text-muted)" }}>
        <Loader2 size={22} className="animate-spin" />
      </div>
    );
  }
  if (error) {
    return (
      <Card><CardContent className="p-10 text-center text-sm font-semibold" style={{ color: "var(--danger)" }}>{error}</CardContent></Card>
    );
  }

  return (
    <div className="flex flex-col gap-6 view-anim">
      <PageHeader title="Organization" sub="Branding & identity settings">
        <Button size="sm" onClick={handleSave} disabled={!canSave}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : null} Save changes
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6 items-start">
        <div className="flex flex-col gap-5">
          <Card>
            <CardHeader className="px-6 pt-6 pb-2"><CardTitle>Brand assets</CardTitle></CardHeader>
            <CardContent className="px-6 pb-6 pt-4 flex flex-col gap-4">
              {([
                { kind: "logo" as AssetKind,   label: "Organization logo", url: org?.logoUrl,   h: "h-24", ref: logoInputRef },
                { kind: "banner" as AssetKind, label: "Event banner",      url: org?.bannerUrl, h: "h-16", ref: bannerInputRef },
              ]).map(({ kind, label, url, h, ref }) => {
                const busy = uploading === kind;
                return (
                  <div key={kind} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <Label>{label}</Label>
                      {url && !busy && (
                        <button type="button" onClick={() => ref.current?.click()} className="text-xs font-bold cursor-pointer" style={{ color: "var(--primary-hex,#6366f1)", background: "none", border: "none" }}>Change</button>
                      )}
                    </div>
                    <input ref={ref} type="file" accept={ACCEPT_IMAGE} className="hidden"
                      onChange={(e) => { handleUpload(kind, e.target.files?.[0]); e.target.value = ""; }} />
                    <button
                      type="button"
                      onClick={() => !busy && ref.current?.click()}
                      disabled={busy}
                      className={`relative flex items-center justify-center gap-2 ${h} w-full rounded-[var(--radius-md)] overflow-hidden transition-colors ${url ? "border" : "border-2 border-dashed hover:bg-[var(--primary-soft)]"} ${busy ? "cursor-wait" : "cursor-pointer"}`}
                      style={{ borderColor: url ? "var(--border-hex,#ecedf4)" : "var(--border-strong)", background: url ? "var(--surface)" : "var(--surface-2)" }}
                    >
                      {url && <Image src={url} alt={label} fill className="object-cover" />}
                      {busy ? (
                        <span className="relative z-10 flex items-center gap-2 px-2 py-1 rounded-[var(--radius-sm)]" style={{ background: "var(--surface)", color: "var(--text-muted)" }}>
                          <Loader2 size={16} className="animate-spin" /> <span className="text-sm font-semibold">Uploading…</span>
                        </span>
                      ) : !url && (
                        <>
                          <ImagePlus size={18} style={{ color: "var(--text-faint)" }} />
                          <span className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>Click to upload — PNG, JPEG, WebP (max 5 MB)</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="px-6 pt-6 pb-2"><CardTitle>Identity</CardTitle></CardHeader>
            <CardContent className="px-6 pb-6 pt-4 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="org-name">Organization name <span style={{ color: "var(--danger)" }}>*</span></Label>
                <Input id="org-name" maxLength={200} value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="org-desc">Description</Label>
                <Textarea id="org-desc" rows={3} maxLength={2000} placeholder="A short description of your organization" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="org-email">Support email</Label>
                  <Input id="org-email" type="email" maxLength={255} value={form.contactEmail} onChange={(e) => setForm((p) => ({ ...p, contactEmail: e.target.value }))} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="org-phone">Contact phone</Label>
                  <Input id="org-phone" type="tel" maxLength={25} value={form.contactPhone} onChange={(e) => setForm((p) => ({ ...p, contactPhone: e.target.value }))} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="rounded-[var(--radius-xl)] border overflow-hidden sticky top-6" style={{ background: "var(--surface)", borderColor: "var(--border-hex,#ecedf4)", boxShadow: "var(--shadow-card)" }}>
          <div className="px-5 py-4 border-b" style={{ borderColor: "var(--border-hex,#ecedf4)" }}>
            <span className="text-sm font-extrabold" style={{ color: "var(--text-strong)" }}>Live preview</span>
          </div>
          <div className="relative h-[84px]" style={{ background: "linear-gradient(120deg, var(--primary-hex,#6366f1), color-mix(in srgb, var(--primary-hex,#6366f1) 55%, #22c55e))" }}>
            {org?.bannerUrl && <Image src={org.bannerUrl} alt="Banner" fill className="object-cover" />}
            <div className="absolute left-4 -bottom-6 w-14 h-14 rounded-xl flex items-center justify-center border-4 overflow-hidden" style={{ background: "var(--surface)", borderColor: "var(--surface)", boxShadow: "var(--shadow-sm)" }}>
              {org?.logoUrl ? <Image src={org.logoUrl} alt="Logo" width={56} height={56} className="object-cover" /> : <Logo size={26} showText={false} />}
            </div>
          </div>
          <div className="px-5 pt-9 pb-5 flex flex-col gap-1.5">
            <span className="text-[15px] font-extrabold" style={{ color: "var(--text-strong)" }}>{form.name || "Your organization"}</span>
            {form.description && <span className="text-[12.5px]" style={{ color: "var(--text-muted)" }}>{form.description}</span>}
            {form.contactEmail && <span className="text-[12.5px]" style={{ color: "var(--text-muted)" }}>{form.contactEmail}</span>}
            <Button size="sm" className="mt-3 self-start">Register now</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
