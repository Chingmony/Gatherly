"use client";

import { useEffect, useRef, useState } from "react";
import { User, ShieldCheck, Check, Lock, Camera, Loader2, Building2, Mail, Phone, ContactRound } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AvatarUser } from "@/components/ui/avatar-user";
import { StatusBadge } from "@/components/ui/status-badge";
import { getMe, updateMe, changePassword, uploadAvatar } from "@/lib/api/me";
import { getOrganization, type OrganizationResponse } from "@/lib/api/organization";
import type { UserResponse } from "@/lib/api/auth";
import type { Gender } from "@/lib/types";
import { uiRoleFromGlobal, ROLE_META } from "@/lib/roles";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function SettingsPage() {
  const [me, setMe]               = useState<UserResponse | null>(null);
  const [name, setName]           = useState("");
  const [phone, setPhone]         = useState("");
  const [gender, setGender]       = useState<Gender | "">("");
  const [dob, setDob]             = useState("");
  const [address, setAddress]     = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarBusy, setAvatarBusy]       = useState(false);
  const [avatarError, setAvatarError]     = useState("");
  const [loading, setLoading]     = useState(true);
  const [saved, setSaved]         = useState(false);
  const [saveError, setSaveError] = useState("");
  const [pwForm, setPwForm]       = useState({ current: "", next: "", confirm: "" });
  const [pwError, setPwError]     = useState("");
  const [pwSaved, setPwSaved]     = useState(false);
  // Organization profile — read-only here for every role (the matrix grants all members view).
  const [org, setOrg]             = useState<OrganizationResponse | null>(null);
  const [orgLoading, setOrgLoading] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getMe()
      .then((u) => seedFromUser(u))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Independent of the profile fetch so a slow/failed org read never blocks the profile UI.
  useEffect(() => {
    getOrganization()
      .then((o) => setOrg(o))
      .catch(() => {})
      .finally(() => setOrgLoading(false));
  }, []);

  /** Seed every editable field from a fresh UserResponse (fetch + after-save). */
  function seedFromUser(u: UserResponse | null) {
    setMe(u);
    setName(u?.fullName ?? "");
    setPhone(u?.phone ?? "");
    setGender(u?.gender ?? "");
    setDob(u?.dateOfBirth ?? "");
    setAddress(u?.address ?? "");
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarError("");
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setAvatarError("Use a PNG, JPEG, or WebP image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError("Image must be under 5 MB.");
      return;
    }
    setAvatarPreview(URL.createObjectURL(file));
    setAvatarBusy(true);
    try {
      // The API brokers the upload to storage (browser → /me/avatar → Rustfs) and returns the
      // updated profile with a viewable avatarUrl.
      const updated = await uploadAvatar(file);
      setMe(updated);
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : "Upload failed. Please try again.");
      setAvatarPreview(null);
    } finally {
      setAvatarBusy(false);
    }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaveError("");
    try {
      // Coerce empties to null so enum/date fields never send "" (which would 400).
      const updated = await updateMe({
        fullName: name || null,
        phone: phone || null,
        gender: gender || null,
        dateOfBirth: dob || null,
        address: address || null,
      });
      seedFromUser(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save profile");
    }
  }

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError("");
    if (pwForm.next.length < 8) { setPwError("Password must be at least 8 characters."); return; }
    if (pwForm.next !== pwForm.confirm) { setPwError("Passwords do not match."); return; }
    try {
      await changePassword({ currentPassword: pwForm.current, newPassword: pwForm.next });




      setPwSaved(true);
      setPwForm({ current: "", next: "", confirm: "" });
      setTimeout(() => setPwSaved(false), 2200);
    } catch (err) {
      setPwError(err instanceof Error ? err.message : "Failed to update password");
    }
  }

  const displayName  = me?.fullName ?? name;
  const displayEmail = me?.email ?? "";
  const roleMeta = me ? ROLE_META[uiRoleFromGlobal(me.globalRole)] : null;

  return (
    <div className="flex flex-col gap-6 view-anim">
      <PageHeader title="Settings" sub="Manage your profile and credentials" />

      {/* ── Profile (user info) + Organization (org info), side by side ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

      {/* ── Profile (identity) ── */}
      <Card>
        <CardContent className="px-4 md:px-6 py-6 flex flex-col gap-5">

          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "var(--primary-soft)" }}
            >
              <User size={18} style={{ color: "var(--primary-hex,#6366f1)" }} />
            </div>
            <div>
              <p className="text-sm font-extrabold m-0" style={{ color: "var(--text-strong)" }}>Profile</p>
              <p className="text-sm m-0" style={{ color: "var(--text-faint)" }}>Your account</p>
            </div>
          </div>

          {/* Avatar + identity */}
          <div className="flex items-center gap-4">
            <div className="relative flex-shrink-0">
              <AvatarUser
                name={displayName || "?"}
                imageUrl={avatarPreview ?? me?.avatarUrl ?? undefined}
                size={56}
              />
              {/* Camera button — w-7 h-7 for comfortable touch */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarBusy}
                title="Change profile photo"
                className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center cursor-pointer transition-opacity hover:opacity-90 active:opacity-70 disabled:opacity-70 disabled:cursor-not-allowed"
                style={{ background: "var(--primary-hex,#6366f1)", color: "#fff" }}
              >
                {avatarBusy ? <Loader2 size={13} className="animate-spin" /> : <Camera size={13} />}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>

            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-base font-extrabold truncate" style={{ color: "var(--text-strong)" }}>
                {loading ? "Loading…" : displayName}
              </span>
              <span className="text-sm truncate" style={{ color: "var(--text-muted)" }}>{displayEmail || "—"}</span>
              {roleMeta && (
                <span
                  className="flex items-center gap-1 text-xs font-bold mt-1 px-2 py-0.5 rounded-full self-start"
                  style={{ background: roleMeta.soft, color: roleMeta.color }}
                >
                  <ShieldCheck size={11} /> {roleMeta.label}
                </span>
              )}
            </div>
          </div>

          {avatarError && (
            <p className="text-sm font-semibold m-0" style={{ color: "var(--danger)" }}>{avatarError}</p>
          )}

          {/* Account meta */}
          <div className="flex flex-wrap items-center gap-3">
            {me && (
              <StatusBadge variant={me.status === "ACTIVE" ? "green" : "gray"} dot>
                {me.status === "ACTIVE" ? "Active" : "Inactive"}
              </StatusBadge>
            )}
            {me?.createdAt && (
              <span className="text-xs" style={{ color: "var(--text-faint)" }}>
                Member since {formatDate(me.createdAt)}
              </span>
            )}
          </div>

        </CardContent>
      </Card>

      {/* ── Organization (read-only) — sits before the user's own info ── */}
      <Card>
        <CardContent className="px-4 md:px-6 py-6 flex flex-col gap-5">

          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "var(--primary-soft)" }}
            >
              <Building2 size={18} style={{ color: "var(--primary-hex,#6366f1)" }} />
            </div>
            <div>
              <p className="text-sm font-extrabold m-0" style={{ color: "var(--text-strong)" }}>Organization</p>
              <p className="text-sm m-0" style={{ color: "var(--text-faint)" }}>Your organization profile (view only)</p>
            </div>
          </div>

          <Separator />

          {orgLoading ? (
            <div className="h-24 rounded-[var(--radius-lg)] animate-pulse" style={{ background: "var(--surface-2)" }} />
          ) : !org ? (
            <p className="text-sm m-0" style={{ color: "var(--text-faint)" }}>
              Organization profile is unavailable.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Banner */}
              {org.bannerUrl && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={org.bannerUrl}
                  alt={`${org.name} banner`}
                  className="w-full h-28 object-cover rounded-[var(--radius-lg)]"
                  style={{ background: "var(--surface-2)" }}
                />
              )}

              {/* Logo + name + description */}
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
                  style={{ background: "var(--surface-2)", border: "1px solid var(--border-hex,#ecedf4)" }}
                >
                  {org.logoUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={org.logoUrl} alt={`${org.name} logo`} className="w-full h-full object-cover" />
                  ) : (
                    <Building2 size={22} style={{ color: "var(--text-faint)" }} />
                  )}
                </div>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-base font-extrabold truncate" style={{ color: "var(--text-strong)" }}>
                    {org.name}
                  </span>
                  {org.description && (
                    <span className="text-sm" style={{ color: "var(--text-muted)" }}>{org.description}</span>
                  )}
                </div>
              </div>

              {/* Contact */}
              {(org.contactEmail || org.contactPhone) && (
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                  {org.contactEmail && (
                    <span className="flex items-center gap-1.5 text-sm" style={{ color: "var(--text-muted)" }}>
                      <Mail size={14} style={{ color: "var(--text-faint)" }} /> {org.contactEmail}
                    </span>
                  )}
                  {org.contactPhone && (
                    <span className="flex items-center gap-1.5 text-sm" style={{ color: "var(--text-muted)" }}>
                      <Phone size={14} style={{ color: "var(--text-faint)" }} /> {org.contactPhone}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

        </CardContent>
      </Card>

      </div>

      {/* ── Personal Information (editable details) ── */}
      <Card>
        <CardContent className="px-4 md:px-6 py-6 flex flex-col gap-5">

          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "var(--primary-soft)" }}
            >
              <ContactRound size={18} style={{ color: "var(--primary-hex,#6366f1)" }} />
            </div>
            <div>
              <p className="text-sm font-extrabold m-0" style={{ color: "var(--text-strong)" }}>Personal Information</p>
              <p className="text-sm m-0" style={{ color: "var(--text-faint)" }}>Your details</p>
            </div>
          </div>

          <Separator />

          <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="s-name">Full name</Label>
                {/* text-base prevents iOS Safari zoom on input focus */}
                <Input
                  id="s-name"
                  className="text-base h-11"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  disabled={loading}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="s-email">Email</Label>
                {/* Read-only display — email not editable via PUT /me */}
                <div
                  id="s-email"
                  className="h-11 px-3 flex items-center rounded-[var(--radius-md,6px)] border text-base select-all"
                  style={{
                    background:  "var(--surface-2)",
                    borderColor: "var(--border-hex,#ecedf4)",
                    color:       "var(--text-muted)",
                  }}
                >
                  {loading ? "Loading…" : (displayEmail || "—")}
                </div>
                <p className="text-sm m-0" style={{ color: "var(--text-faint)" }}>
                  Email cannot be changed.
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="s-phone">Phone</Label>
                <Input
                  id="s-phone"
                  type="tel"
                  className="text-base h-11"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +855 12 345 678"
                  disabled={loading}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="s-gender">Gender</Label>
                <select
                  id="s-gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value as Gender | "")}
                  disabled={loading}
                  className="flex w-full h-11 rounded-[var(--radius-md)] border border-[var(--border-hex,#ecedf4)] bg-[var(--surface-2)] px-3.5 text-base text-[var(--text)] transition-all focus:outline-none focus:border-[var(--primary-hex,#6366f1)] focus:bg-[var(--surface)] focus:shadow-[0_0_0_4px_var(--primary-ring)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Not specified</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="s-dob">Date of birth</Label>
                <Input
                  id="s-dob"
                  type="date"
                  className="text-base h-11"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label htmlFor="s-address">Address</Label>
                <Input
                  id="s-address"
                  className="text-base h-11"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Your address"
                  disabled={loading}
                />
              </div>

            </div>

            {saveError && (
              <p className="text-sm font-semibold m-0" style={{ color: "var(--danger)" }}>{saveError}</p>
            )}

            <div className="flex justify-end items-center gap-3">
              {saved && (
                <span className="flex items-center gap-1.5 text-sm font-bold" style={{ color: "var(--green-600)" }}>
                  <Check size={15} /> Saved
                </span>
              )}
              <Button type="submit" className="h-11" disabled={loading}>Save profile</Button>
            </div>
          </form>

        </CardContent>
      </Card>

      {/* ── Update Password ── */}
      <Card>
        <CardContent className="px-4 md:px-6 py-6 flex flex-col gap-5">

          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "var(--primary-soft)" }}
            >
              <Lock size={18} style={{ color: "var(--primary-hex,#6366f1)" }} />
            </div>
            <div>
              <p className="text-sm font-extrabold m-0" style={{ color: "var(--text-strong)" }}>Update Password</p>
              <p className="text-sm m-0" style={{ color: "var(--text-faint)" }}>Change your login credentials</p>
            </div>
          </div>

          <Separator />

          <form onSubmit={handleUpdatePassword} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pw-current">Current password</Label>
              <Input
                id="pw-current"
                type="password"
                className="text-base h-11"
                value={pwForm.current}
                onChange={(e) => setPwForm((p) => ({ ...p, current: e.target.value }))}
                placeholder="••••••••"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="pw-new">New password</Label>
                <Input
                  id="pw-new"
                  type="password"
                  className="text-base h-11"
                  value={pwForm.next}
                  onChange={(e) => { setPwForm((p) => ({ ...p, next: e.target.value })); setPwError(""); }}
                  placeholder="Min 8 characters"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="pw-confirm">Confirm new password</Label>
                <Input
                  id="pw-confirm"
                  type="password"
                  className="text-base h-11"
                  value={pwForm.confirm}
                  onChange={(e) => { setPwForm((p) => ({ ...p, confirm: e.target.value })); setPwError(""); }}
                  placeholder="Repeat new password"
                />
              </div>
            </div>

            {pwError && (
              <p className="text-sm font-semibold m-0" style={{ color: "var(--danger)" }}>{pwError}</p>
            )}

            <div className="flex justify-end items-center gap-3">
              {pwSaved && (
                <span className="flex items-center gap-1.5 text-sm font-bold" style={{ color: "var(--green-600)" }}>
                  <Check size={15} /> Password updated
                </span>
              )}
              <Button type="submit" className="h-11">Update password</Button>
            </div>
          </form>

        </CardContent>
      </Card>

    </div>
  );
}
