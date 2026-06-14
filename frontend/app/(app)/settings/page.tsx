"use client";

import { useState } from "react";
import { User, Bell, Shield, Palette, Camera, LogOut, Monitor, Moon, Sun, Check } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AvatarUser } from "@/components/ui/avatar-user";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

const NOTIF_ITEMS = [
  { id: "reg",      label: "New registrations",       sub: "When a guest registers for your event",       defaultOn: true  },
  { id: "checkin",  label: "Check-in activity",        sub: "Real-time QR scan events",                    defaultOn: false },
  { id: "task",     label: "Task assignments",         sub: "When a task is assigned or updated",          defaultOn: true  },
  { id: "capacity", label: "Capacity alerts",          sub: "When fill rate exceeds 80% or 100%",          defaultOn: true  },
  { id: "team",     label: "Team changes",             sub: "When a member joins or is removed",           defaultOn: false },
  { id: "weekly",   label: "Weekly digest",            sub: "Summary of all events every Monday morning",  defaultOn: true  },
];

const SESSIONS = [
  { device: "Chrome on macOS",       location: "Phnom Penh, KH", last: "Active now",  current: true  },
  { device: "Safari on iPhone 15",   location: "Phnom Penh, KH", last: "2 hours ago", current: false },
  { device: "Firefox on Windows 11", location: "Singapore, SG",  last: "3 days ago",  current: false },
];

type Theme = "light" | "dark" | "system";

export default function SettingsPage() {
  const [name, setName]     = useState("Patrick Hale");
  const [email, setEmail]   = useState("patrick@gatherly.io");
  const [bio, setBio]       = useState("Event operations lead at Gatherly. Building seamless attendee experiences.");
  const [phone, setPhone]   = useState("+1 (415) 555-0142");
  const [saved, setSaved]   = useState(false);

  const [notifs, setNotifs] = useState<Record<string, boolean>>(
    Object.fromEntries(NOTIF_ITEMS.map((n) => [n.id, n.defaultOn]))
  );

  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [theme, setTheme]   = useState<Theme>("light");

  function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  }

  function handleSavePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwForm({ current: "", next: "", confirm: "" });
  }

  return (
    <div className="flex flex-col gap-6 view-anim">
      <PageHeader title="Settings" sub="Manage your account, notifications, and preferences" />

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile"><User size={14} />Profile</TabsTrigger>
          <TabsTrigger value="notifications"><Bell size={14} />Notifications</TabsTrigger>
          <TabsTrigger value="security"><Shield size={14} />Security</TabsTrigger>
          <TabsTrigger value="appearance"><Palette size={14} />Appearance</TabsTrigger>
        </TabsList>

        {/* ── Profile ── */}
        <TabsContent value="profile" className="mt-6">
          <form onSubmit={handleSaveProfile} className="flex flex-col gap-5 max-w-[640px]">
            <Card>
              <CardHeader className="px-6 pt-6 pb-3"><CardTitle>Personal information</CardTitle></CardHeader>
              <CardContent className="px-6 pb-6 flex flex-col gap-5">
                {/* Avatar row */}
                <div className="flex items-center gap-5">
                  <div className="relative flex-shrink-0">
                    <AvatarUser name={name} size={72} />
                    <button
                      type="button"
                      onClick={() => alert("Avatar upload not yet available in v1.")}
                      className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center border-2 cursor-pointer transition-colors hover:opacity-90"
                      style={{ background: "var(--primary-hex,#6366f1)", borderColor: "var(--surface)", color: "#fff" }}
                    >
                      <Camera size={13} />
                    </button>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-extrabold" style={{ color: "var(--text-strong)" }}>{name || "Your name"}</span>
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>{email}</span>
                    <span className="text-xs font-bold mt-1 px-2 py-0.5 rounded-full inline-block" style={{ background: "var(--primary-soft)", color: "var(--primary-hex,#6366f1)" }}>Admin</span>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="s-name">Full name</Label>
                    <Input id="s-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="s-phone">Phone</Label>
                    <Input id="s-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="s-email">Email address</Label>
                  <Input id="s-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="s-bio">Bio</Label>
                  <textarea
                    id="s-bio"
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="A short bio about yourself…"
                    className="w-full px-4 py-3 rounded-[var(--radius-md)] border text-sm font-semibold resize-none focus:outline-none focus:border-[var(--primary-hex,#6366f1)] transition-all"
                    style={{ background: "var(--surface-2)", borderColor: "var(--border-hex,#ecedf4)", color: "var(--text)" }}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center gap-3 justify-end">
              {saved && (
                <span className="flex items-center gap-1.5 text-sm font-bold" style={{ color: "var(--green-600)" }}>
                  <Check size={15} /> Saved
                </span>
              )}
              <Button type="submit" size="sm">Save profile</Button>
            </div>
          </form>
        </TabsContent>

        {/* ── Notifications ── */}
        <TabsContent value="notifications" className="mt-6 max-w-[640px]">
          <Card>
            <CardHeader className="px-6 pt-6 pb-3"><CardTitle>Email notifications</CardTitle></CardHeader>
            <CardContent className="px-6 pb-2 flex flex-col">
              {NOTIF_ITEMS.map((item, i) => (
                <div key={item.id}>
                  <div className="flex items-center justify-between py-4">
                    <div className="flex flex-col gap-0.5 pr-4">
                      <span className="text-sm font-bold" style={{ color: "var(--text-strong)" }}>{item.label}</span>
                      <span className="text-[12.5px]" style={{ color: "var(--text-muted)" }}>{item.sub}</span>
                    </div>
                    <Switch
                      checked={notifs[item.id]}
                      onCheckedChange={(v: boolean) => setNotifs((p) => ({ ...p, [item.id]: v }))}
                    />
                  </div>
                  {i < NOTIF_ITEMS.length - 1 && <Separator />}
                </div>
              ))}
              <div className="pb-4 pt-2 flex justify-end">
                <Button size="sm" onClick={() => {}}>Save preferences</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Security ── */}
        <TabsContent value="security" className="mt-6 flex flex-col gap-5 max-w-[640px]">
          <Card>
            <CardHeader className="px-6 pt-6 pb-3"><CardTitle>Change password</CardTitle></CardHeader>
            <CardContent className="px-6 pb-6">
              <form onSubmit={handleSavePassword} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="pw-current">Current password</Label>
                  <Input id="pw-current" type="password" value={pwForm.current} onChange={(e) => setPwForm((p) => ({ ...p, current: e.target.value }))} placeholder="••••••••" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="pw-new">New password</Label>
                  <Input id="pw-new" type="password" value={pwForm.next} onChange={(e) => setPwForm((p) => ({ ...p, next: e.target.value }))} placeholder="Min 8 characters" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="pw-confirm">Confirm new password</Label>
                  <Input id="pw-confirm" type="password" value={pwForm.confirm} onChange={(e) => setPwForm((p) => ({ ...p, confirm: e.target.value }))} placeholder="Repeat new password" />
                </div>
                <div className="flex justify-end pt-1">
                  <Button type="submit" size="sm">Update password</Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="px-6 pt-6 pb-3"><CardTitle>Active sessions</CardTitle></CardHeader>
            <CardContent className="px-6 pb-4 flex flex-col">
              {SESSIONS.map((s, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between py-4">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold" style={{ color: "var(--text-strong)" }}>{s.device}</span>
                        {s.current && (
                          <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "var(--green-soft)", color: "var(--green-600)" }}>Current</span>
                        )}
                      </div>
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>{s.location} · {s.last}</span>
                    </div>
                    {!s.current && (
                      <Button variant="ghost" size="sm" className="text-[var(--danger)] hover:bg-[var(--danger-soft)]">
                        <LogOut size={13} /> Revoke
                      </Button>
                    )}
                  </div>
                  {i < SESSIONS.length - 1 && <Separator />}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Appearance ── */}
        <TabsContent value="appearance" className="mt-6 max-w-[640px]">
          <Card>
            <CardHeader className="px-6 pt-6 pb-3"><CardTitle>Theme</CardTitle></CardHeader>
            <CardContent className="px-6 pb-6 flex flex-col gap-4">
              <p className="text-sm m-0" style={{ color: "var(--text-muted)" }}>Choose how Gatherly looks for you.</p>
              <div className="grid grid-cols-3 gap-3">
                {([
                  { id: "light",  label: "Light",  Icon: Sun    },
                  { id: "dark",   label: "Dark",   Icon: Moon   },
                  { id: "system", label: "System", Icon: Monitor },
                ] as { id: Theme; label: string; Icon: React.ComponentType<{ size?: number }> }[]).map(({ id, label, Icon }) => {
                  const active = theme === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setTheme(id)}
                      className="flex flex-col items-center gap-2.5 py-5 rounded-[var(--radius-lg)] border cursor-pointer transition-all"
                      style={{
                        background:   active ? "var(--primary-soft)" : "var(--surface-2)",
                        borderColor:  active ? "var(--primary-hex,#6366f1)" : "var(--border-hex,#ecedf4)",
                        boxShadow:    active ? "0 0 0 3px color-mix(in srgb, var(--primary-hex,#6366f1) 16%, transparent)" : "none",
                        color:        active ? "var(--primary-hex,#6366f1)" : "var(--text-muted)",
                      }}
                    >
                      <Icon size={22} />
                      <span className="text-[13px] font-bold">{label}</span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="mt-5">
            <CardHeader className="px-6 pt-6 pb-3"><CardTitle>Language &amp; region</CardTitle></CardHeader>
            <CardContent className="px-6 pb-6 flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label>Language</Label>
                  <select
                    defaultValue="en"
                    className="h-[42px] px-3 rounded-[var(--radius-md)] border text-sm font-semibold focus:outline-none transition-all"
                    style={{ background: "var(--surface-2)", borderColor: "var(--border-hex,#ecedf4)", color: "var(--text)" }}
                  >
                    <option value="en">English (US)</option>
                    <option value="km">ភាសាខ្មែរ</option>
                    <option value="fr">Français</option>
                    <option value="zh">中文</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Time zone</Label>
                  <select
                    defaultValue="asia_pp"
                    className="h-[42px] px-3 rounded-[var(--radius-md)] border text-sm font-semibold focus:outline-none transition-all"
                    style={{ background: "var(--surface-2)", borderColor: "var(--border-hex,#ecedf4)", color: "var(--text)" }}
                  >
                    <option value="asia_pp">Asia/Phnom_Penh (UTC+7)</option>
                    <option value="utc">UTC</option>
                    <option value="us_eastern">US/Eastern (UTC-5)</option>
                    <option value="us_pacific">US/Pacific (UTC-8)</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end">
                <Button size="sm">Save preferences</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
