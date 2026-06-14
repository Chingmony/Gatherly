"use client";

import { useEffect, useRef, useState } from "react";
import { User, ShieldCheck, Check, Lock, Camera } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AvatarUser } from "@/components/ui/avatar-user";
import { apiFetch } from "@/lib/api/client";
import type { UserResponse } from "@/lib/types";

export default function SettingsPage() {
  const [me, setMe]               = useState<UserResponse | null>(null);
  const [name, setName]           = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading]     = useState(true);
  const [saved, setSaved]         = useState(false);
  const [saveError, setSaveError] = useState("");
  const [pwForm, setPwForm]       = useState({ current: "", next: "", confirm: "" });
  const [pwError, setPwError]     = useState("");
  const [pwSaved, setPwSaved]     = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    apiFetch<UserResponse>("/me")
      .then((res) => {
        setMe(res);
        setName(res?.fullName ?? "");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaveError("");
    try {
      const res = await apiFetch<UserResponse>("/me", {
        method: "PUT",
        body: { fullName: name },
      });
      setMe(res);
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
      await apiFetch("/me/password", {
        method: "PUT",
        body: { currentPassword: pwForm.current, newPassword: pwForm.next },
      });
      setPwSaved(true);
      setPwForm({ current: "", next: "", confirm: "" });
      setTimeout(() => setPwSaved(false), 2200);
    } catch (err) {
      setPwError(err instanceof Error ? err.message : "Failed to update password");
    }
  }

  const displayName  = me?.fullName ?? name;
  const displayEmail = me?.email ?? "";

  return (
    <div className="flex flex-col gap-6 view-anim">
      <PageHeader title="Settings" sub="Manage your profile and credentials" />

      {/* ── Profile ── */}
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
                imageUrl={avatarPreview ?? undefined}
                size={56}
              />
              {/* Camera button — w-7 h-7 for comfortable touch */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Change profile photo"
                className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center cursor-pointer transition-opacity hover:opacity-90 active:opacity-70"
                style={{ background: "var(--primary-hex,#6366f1)", color: "#fff" }}
              >
                <Camera size={13} />
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
              <span
                className="flex items-center gap-1 text-xs font-bold mt-1 px-2 py-0.5 rounded-full self-start"
                style={{ background: "var(--green-soft)", color: "var(--green-600)" }}
              >
                <ShieldCheck size={11} /> Handler
              </span>
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
