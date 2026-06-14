"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateOrganization } from "@/lib/api/organization";
import { uploadAsset } from "@/lib/api/storage";
import { ApiError } from "@/lib/api/client";
import type { OrganizationResponse, StoragePurpose } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Org profile editor (docs/05 §7). Logo/banner upload follows the presign flow (docs/04 §4.4):
 * the file PUTs straight to Rustfs and only the returned object key is committed via PUT /organization.
 */
export function OrganizationForm({ initial }: { initial: OrganizationResponse }) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [description, setDescription] = useState(initial.description ?? "");
  const [contactEmail, setContactEmail] = useState(initial.contactEmail ?? "");
  const [contactPhone, setContactPhone] = useState(initial.contactPhone ?? "");
  const [logoKey, setLogoKey] = useState(initial.logoKey ?? "");
  const [bannerKey, setBannerKey] = useState(initial.bannerKey ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);
  const [uploading, setUploading] = useState<StoragePurpose | null>(null);

  async function onUpload(purpose: StoragePurpose, file: File | undefined) {
    if (!file) return;
    setError(null);
    setUploading(purpose);
    try {
      const key = await uploadAsset(file, purpose);
      if (purpose === "ORG_LOGO") setLogoKey(key);
      else setBannerKey(key);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Upload failed.");
    } finally {
      setUploading(null);
    }
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setPending(true);
    try {
      await updateOrganization({
        name,
        description: description || undefined,
        contactEmail: contactEmail || undefined,
        contactPhone: contactPhone || undefined,
        logoKey: logoKey || undefined,
        bannerKey: bannerKey || undefined,
      });
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save changes.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={onSave}
      className="space-y-5 rounded-[var(--r)] border border-[var(--bo)] bg-[var(--ca)] p-6 shadow-[var(--sh)]"
    >
      <div>
        <Label htmlFor="name">Name</Label>
        <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full rounded-[var(--rs)] border border-[var(--bo)] bg-[var(--ca)] px-3.5 py-2.5 text-[14px] text-[var(--t1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ac)] focus-visible:border-[var(--ac)]"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="contactEmail">Contact email</Label>
          <Input id="contactEmail" type="email" value={contactEmail}
                 onChange={(e) => setContactEmail(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="contactPhone">Contact phone</Label>
          <Input id="contactPhone" value={contactPhone}
                 onChange={(e) => setContactPhone(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="logo">Logo</Label>
          <input id="logo" type="file" accept="image/png,image/jpeg,image/webp"
                 onChange={(e) => onUpload("ORG_LOGO", e.target.files?.[0])}
                 className="block w-full text-[12px] text-[var(--t2)] file:mr-3 file:rounded-[var(--rs)] file:border file:border-[var(--bo)] file:bg-[var(--ca)] file:px-3 file:py-1.5 file:text-[12px] file:font-semibold file:text-[var(--t1)]" />
          <p className="mt-1 truncate text-[11px] text-[var(--t3)]">
            {uploading === "ORG_LOGO" ? "Uploading…" : logoKey || "No logo set"}
          </p>
        </div>
        <div>
          <Label htmlFor="banner">Banner</Label>
          <input id="banner" type="file" accept="image/png,image/jpeg,image/webp"
                 onChange={(e) => onUpload("ORG_BANNER", e.target.files?.[0])}
                 className="block w-full text-[12px] text-[var(--t2)] file:mr-3 file:rounded-[var(--rs)] file:border file:border-[var(--bo)] file:bg-[var(--ca)] file:px-3 file:py-1.5 file:text-[12px] file:font-semibold file:text-[var(--t1)]" />
          <p className="mt-1 truncate text-[11px] text-[var(--t3)]">
            {uploading === "ORG_BANNER" ? "Uploading…" : bannerKey || "No banner set"}
          </p>
        </div>
      </div>

      {error && <p className="text-[13px] font-medium text-[var(--ac-2)]" role="alert">{error}</p>}
      {saved && <p className="text-[13px] font-medium text-[var(--ac)]" role="status">Saved.</p>}

      <div className="flex justify-end">
        <Button type="submit" disabled={pending || uploading !== null}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
