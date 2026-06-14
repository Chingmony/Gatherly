"use client";

import { useState } from "react";
import { Search, UserPlus, MoreHorizontal, Edit2, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { AvatarUser } from "@/components/ui/avatar-user";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const USERS = [
  { id: "u1", name: "Patrick Hale",   email: "patrick@gatherly.io", role: "ADMIN",  status: "active",   events: 12 },
  { id: "u2", name: "Jordan Lee",     email: "jordan@gatherly.io",  role: "MEMBER", status: "active",   events: 5  },
  { id: "u3", name: "Sam Rivera",     email: "sam@gatherly.io",     role: "MEMBER", status: "active",   events: 3  },
  { id: "u4", name: "Noah Carter",    email: "noah@acme.io",        role: "MEMBER", status: "inactive", events: 0  },
  { id: "u5", name: "Isla Thompson",  email: "isla@gatherly.io",    role: "ADMIN",  status: "active",   events: 8  },
  { id: "u6", name: "Ethan Williams", email: "ethan@gatherly.io",   role: "MEMBER", status: "pending",  events: 0  },
];

const ROLE_VARIANT: Record<string, "primary" | "blue"> = { ADMIN: "primary", MEMBER: "blue" };
const STATUS_VARIANT: Record<string, "green" | "gray" | "orange"> = { active: "green", inactive: "gray", pending: "orange" };

export default function TeamPage() {
  const [search, setSearch]       = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole]  = useState("MEMBER");

  const filtered = USERS.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 view-anim">
      <PageHeader title="Team" sub="Manage users and their roles">
        <Button size="sm" onClick={() => setInviteOpen(true)}><UserPlus size={14} /> Invite user</Button>
      </PageHeader>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-5 flex flex-col gap-4">
          <div className="relative max-w-sm">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-faint)" }} />
            <input type="search" placeholder="Search users…" value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full h-[38px] pl-9 pr-3.5 rounded-[var(--radius-md)] border text-sm font-semibold transition-all focus:outline-none focus:border-[var(--primary-hex,#6366f1)]"
              style={{ background: "var(--surface)", borderColor: "var(--border-hex,#ecedf4)", color: "var(--text)" }} />
          </div>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border-hex,#ecedf4)" }}>
                      {["User", "Role", "Status", "Events", ""].map((h) => (
                        <th key={h} className="text-left text-xs font-bold uppercase tracking-wider px-5 py-3.5" style={{ color: "var(--text-muted)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((u, i) => (
                      <tr key={u.id} className="transition-colors hover:bg-[var(--surface-2)]" style={{ borderBottom: i === filtered.length - 1 ? "none" : "1px solid var(--border-hex,#ecedf4)" }}>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <AvatarUser name={u.name} size={34} />
                            <div className="flex flex-col gap-0.5">
                              <span className="font-bold text-sm" style={{ color: "var(--text-strong)" }}>{u.name}</span>
                              <span className="text-xs" style={{ color: "var(--text-muted)" }}>{u.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5"><StatusBadge variant={ROLE_VARIANT[u.role] ?? "gray"}>{u.role}</StatusBadge></td>
                        <td className="px-5 py-3.5"><StatusBadge variant={STATUS_VARIANT[u.status] ?? "gray"}>{u.status.charAt(0).toUpperCase() + u.status.slice(1)}</StatusBadge></td>
                        <td className="px-5 py-3.5 text-sm" style={{ color: "var(--text-muted)" }}>{u.events} events</td>
                        <td className="px-5 py-3.5">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon-sm"><MoreHorizontal size={15} /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem><Edit2 size={13} /> Edit role</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-[var(--danger)]"><Trash2 size={13} /> Delete user</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="mt-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              { role: "ADMIN",   variant: "primary" as const, desc: "Full platform access. Manages events, users, org settings and supply lists.", scope: "Global" },
              { role: "MEMBER",  variant: "blue" as const,    desc: "Base role. Access is entirely determined by event-scoped assignment.", scope: "Global" },
              { role: "MANAGER", variant: "teal" as const,    desc: "Sub-admin for a specific event. Manages form, guests, agenda. Cannot delete.", scope: "Event" },
              { role: "HANDLER", variant: "orange" as const,  desc: "On-the-ground volunteer. Executes tasks, operates scanner. Read-only on data.", scope: "Event" },
            ].map(({ role, variant, desc, scope }) => (
              <Card key={role}>
                <CardContent className="p-5 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <StatusBadge variant={variant}>{role}</StatusBadge>
                    <span className="text-[11px] font-bold" style={{ color: "var(--text-faint)" }}>{scope}</span>
                  </div>
                  <p className="text-[13px] leading-relaxed m-0" style={{ color: "var(--text-muted)" }}>{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite team member</DialogTitle>
            <DialogDescription>Send an invite email to add a new user.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="invite-email">Email address</Label>
              <Input id="invite-email" type="email" placeholder="colleague@company.io" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Global role</Label>
              <div className="flex gap-2">
                {["MEMBER", "ADMIN"].map((r) => (
                  <button key={r} type="button" onClick={() => setInviteRole(r)} className="px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer"
                    style={{ background: inviteRole === r ? "var(--primary-soft)" : "var(--surface-2)", borderColor: inviteRole === r ? "var(--primary-hex,#6366f1)" : "var(--border-hex,#ecedf4)", color: inviteRole === r ? "var(--primary-hex,#6366f1)" : "var(--text-muted)" }}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button onClick={() => { setInviteOpen(false); setInviteEmail(""); }}><UserPlus size={14} /> Send invite</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
