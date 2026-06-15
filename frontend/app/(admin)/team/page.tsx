"use client";

import { useEffect, useState } from "react";
import { Search, UserPlus, Plus, MoreHorizontal, Edit2, Trash2, ShieldCheck, User, Loader2, Camera, X, UserCog } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { AvatarUser } from "@/components/ui/avatar-user";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listUsers, createUser, deleteUser as apiDeleteUser, updateUser, type UserResponse } from "@/lib/api/users";
import { uploadAvatar } from "@/lib/api/storage";
import { ApiError } from "@/lib/api/client";
import { toast } from "@/components/ui/toast";

const GENDERS = ["Male", "Female", "Other"];
const ROLES = ["Admin", "Sub-admin", "User"];

/** Row shape the table renders — projected from the backend `UserResponse`. */
interface MemberRow {
  id: string;          // UUID (used for API calls)
  code: number;        // display sequence number
  name: string;
  gender: string;      // display label
  phone: string;
  email: string;
  role: string;        // display label
  createdAt: string;   // ISO
  hue: number;
  avatarUrl: string | null; // presigned GET URL, or null
  // Raw values needed to prefill the edit form
  dateOfBirth: string; // "YYYY-MM-DD" or ""
  address: string;
  status: string;      // "Active" | "Inactive"
}

const ROLE_VARIANT: Record<string, "violet" | "teal"> = { Admin: "violet", "Sub-admin": "violet", User: "teal" };

const GENDER_LABEL: Record<string, string> = { MALE: "Male", FEMALE: "Female", OTHER: "Other" };
const GENDER_ENUM: Record<string, "MALE" | "FEMALE" | "OTHER"> = { Male: "MALE", Female: "FEMALE", Other: "OTHER" };
const ROLE_LABEL: Record<string, string> = { ADMIN: "Admin", SUB_ADMIN: "Sub-admin", USER: "User" };
const ROLE_ENUM: Record<string, "ADMIN" | "SUB_ADMIN" | "USER"> = { Admin: "ADMIN", "Sub-admin": "SUB_ADMIN", User: "USER" };
const STATUS_LABEL: Record<string, string> = { ACTIVE: "Active", INACTIVE: "Inactive" };
const STATUS_ENUM: Record<string, "ACTIVE" | "INACTIVE"> = { Active: "ACTIVE", Inactive: "INACTIVE" };
const STATUSES = ["Active", "Inactive"];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

/** Stable hue from a name so each avatar keeps a consistent color. */
function hueFromName(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return h;
}

function toRow(u: UserResponse, index: number): MemberRow {
  return {
    id: u.id,
    code: index + 1,
    name: u.fullName,
    gender: u.gender ? GENDER_LABEL[u.gender] ?? u.gender : "—",
    phone: u.phone ?? "—",
    email: u.email,
    role: ROLE_LABEL[u.globalRole] ?? u.globalRole,
    createdAt: u.createdAt,
    hue: hueFromName(u.fullName || u.email),
    avatarUrl: u.avatarUrl ?? null,
    dateOfBirth: u.dateOfBirth ?? "",
    address: u.address ?? "",
    status: STATUS_LABEL[u.status] ?? u.status,
  };
}

export default function TeamPage() {
  const [search, setSearch]       = useState("");
  const [members, setMembers]     = useState<MemberRow[]>([]);
  const [loading, setLoading]     = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole]  = useState("MEMBER");

  // Edit
  const [editUser, setEditUser] = useState<MemberRow | null>(null);
  const [editForm, setEditForm] = useState({ name: "", gender: "Male", phone: "", role: "User", address: "", dateOfBirth: "", status: "Active" });
  const [editAvatar, setEditAvatar] = useState<string | null>(null);
  const [editAvatarFile, setEditAvatarFile] = useState<File | null>(null);
  const [saving, setSaving]     = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  // Delete
  const [deleteUser, setDeleteUser] = useState<MemberRow | null>(null);
  const [deleting, setDeleting]     = useState(false);
  // Create
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", email: "", phone: "", role: "User" });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [creating, setCreating]     = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  function pickAvatar(file: File | undefined) {
    if (!file) return;
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview(URL.createObjectURL(file));
    setAvatarFile(file);
  }

  function clearAvatar() {
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview(null);
    setAvatarFile(null);
  }

  function resetCreate() {
    clearAvatar();
    setCreateForm({ name: "", email: "", phone: "", role: "User" });
    setCreateError(null);
  }

  async function submitCreate() {
    setCreating(true);
    setCreateError(null);
    try {
      // Temp password (16 chars, mixed) — emailed to the member by the backend.
      const tempPassword = Array.from(crypto.getRandomValues(new Uint8Array(12)))
        .map((b) => "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$"[b % 60])
        .join("");
      // Upload the chosen profile image to Rustfs first, then persist its key on the new user.
      const avatarKey = avatarFile ? await uploadAvatar(avatarFile) : null;
      const created = await createUser({
        email: createForm.email.trim(),
        password: tempPassword,
        fullName: createForm.name.trim(),
        phone: createForm.phone.trim() || null,
        globalRole: ROLE_ENUM[createForm.role],
        avatarKey,
      });
      setMembers((prev) => [...prev, toRow(created, prev.length)]);
      setCreateOpen(false);
      resetCreate();
      toast.success("Member created", `A set-password link was emailed to ${created.email}.`);
    } catch (e) {
      setCreateError(e instanceof ApiError ? e.message : "Failed to create member.");
    } finally {
      setCreating(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    listUsers()
      .then((users) => { if (!cancelled) setMembers(users.map(toRow)); })
      .catch((e) => { if (!cancelled) setLoadError(e instanceof ApiError ? e.message : "Failed to load members."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  function openEdit(u: MemberRow) {
    setEditUser(u);
    setEditError(null);
    if (editAvatar) URL.revokeObjectURL(editAvatar);
    setEditAvatar(null);
    setEditAvatarFile(null);
    setEditForm({
      name: u.name,
      gender: u.gender === "—" ? "Male" : u.gender,
      phone: u.phone === "—" ? "" : u.phone,
      role: u.role,
      address: u.address,
      dateOfBirth: u.dateOfBirth,
      status: u.status === "Inactive" ? "Inactive" : "Active",
    });
  }

  function pickEditAvatar(file: File | undefined) {
    if (!file) return;
    if (editAvatar) URL.revokeObjectURL(editAvatar);
    setEditAvatar(URL.createObjectURL(file));
    setEditAvatarFile(file);
  }

  function clearEditAvatar() {
    if (editAvatar) URL.revokeObjectURL(editAvatar);
    setEditAvatar(null);
    setEditAvatarFile(null);
  }

  async function saveEdit() {
    if (!editUser) return;
    setSaving(true);
    setEditError(null);
    try {
      // If a new image was chosen, upload it to Rustfs first and persist its key.
      const avatarKey = editAvatarFile ? await uploadAvatar(editAvatarFile) : undefined;
      const updated = await updateUser(editUser.id, {
        fullName: editForm.name.trim(),
        phone: editForm.phone.trim() || null,
        gender: GENDER_ENUM[editForm.gender] ?? null,
        dateOfBirth: editForm.dateOfBirth || null,
        address: editForm.address.trim() || null,
        globalRole: ROLE_ENUM[editForm.role],
        status: STATUS_ENUM[editForm.status],
        ...(avatarKey ? { avatarKey } : {}),
      });
      setMembers((prev) => prev.map((m) => (m.id === editUser.id ? { ...m, ...toRow(updated, m.code - 1) } : m)));
      clearEditAvatar();
      setEditUser(null);
      toast.success("User updated", `${updated.fullName}'s details were saved.`);
    } catch (e) {
      setEditError(e instanceof ApiError ? e.message : "Failed to update member.");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteUser) return;
    setDeleting(true);
    try {
      const removed = deleteUser.name;
      await apiDeleteUser(deleteUser.id);
      setMembers((prev) => prev.filter((m) => m.id !== deleteUser.id));
      setDeleteUser(null);
      toast.success("User removed", `${removed} was removed from the organization.`);
    } catch (e) {
      setLoadError(e instanceof ApiError ? e.message : "Failed to delete member.");
    } finally {
      setDeleting(false);
    }
  }

  const filtered = members.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 view-anim">
      <PageHeader title="Members" sub="Manage who can do what across the organization">
        <Button size="sm" variant="ghost" onClick={() => setCreateOpen(true)}><Plus size={14} /> Create new member</Button>
        <Button size="sm" onClick={() => setInviteOpen(true)}><Plus size={14} /> Invite member</Button>
      </PageHeader>

      <div className="flex flex-col gap-4">
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
                      {["ID", "Full Name", "Gender", "Phone Number", "Email", "Role", "Created At", ""].map((h) => (
                        <th key={h} className="text-left text-xs font-bold uppercase tracking-wider px-6 py-3.5 whitespace-nowrap" style={{ color: "var(--text-muted)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading && (
                      <tr><td colSpan={8} className="px-6 py-14 text-center">
                        <span className="inline-flex items-center gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
                          <Loader2 size={16} className="animate-spin" /> Loading members…
                        </span>
                      </td></tr>
                    )}
                    {!loading && loadError && (
                      <tr><td colSpan={8} className="px-6 py-14 text-center text-sm" style={{ color: "var(--danger)" }}>{loadError}</td></tr>
                    )}
                    {!loading && !loadError && filtered.length === 0 && (
                      <tr><td colSpan={8} className="px-6 py-14 text-center text-sm" style={{ color: "var(--text-muted)" }}>No members found.</td></tr>
                    )}
                    {!loading && !loadError && filtered.map((u, i) => (
                      <tr key={u.id} className="transition-colors hover:bg-[var(--surface-2)]" style={{ borderBottom: i === filtered.length - 1 ? "none" : "1px solid var(--border-hex,#ecedf4)" }}>
                        <td className="px-6 py-3.5 text-sm font-semibold" style={{ color: "var(--text-muted)" }}>{u.code}</td>
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-3">
                            <AvatarUser name={u.name} hue={u.hue} size={38} imageUrl={u.avatarUrl ?? undefined} />
                            <span className="font-bold text-sm whitespace-nowrap" style={{ color: "var(--text-strong)" }}>{u.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-3.5 text-sm" style={{ color: "var(--text-muted)" }}>{u.gender}</td>
                        <td className="px-6 py-3.5 text-sm whitespace-nowrap" style={{ color: "var(--text-muted)" }}>{u.phone}</td>
                        <td className="px-6 py-3.5 text-sm" style={{ color: "var(--text-muted)" }}>{u.email}</td>
                        <td className="px-6 py-3.5">
                          <StatusBadge variant={ROLE_VARIANT[u.role] ?? "gray"}><ShieldCheck size={13} /> {u.role}</StatusBadge>
                        </td>
                        <td className="px-6 py-3.5 text-sm whitespace-nowrap" style={{ color: "var(--text-muted)" }}>{formatDate(u.createdAt)}</td>
                        <td className="px-6 py-3.5 text-right">
                          {u.role !== "Admin" && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon-sm" className="border" style={{ borderColor: "var(--border-hex,#ecedf4)" }}><MoreHorizontal size={15} /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onSelect={() => openEdit(u)}><Edit2 size={13} /> Edit user</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-[var(--danger)]" onSelect={() => setDeleteUser(u)}><Trash2 size={13} /> Remove member</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
      </div>

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

      {/* Create new member */}
      <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) resetCreate(); }}>
        <DialogContent>
          <DialogHeader className="flex-row items-center gap-3 mb-0 pb-5 border-b" style={{ borderColor: "var(--border-hex,#ecedf4)" }}>
            <span
              className="flex items-center justify-center w-10 h-10 rounded-[var(--radius-md)] flex-shrink-0"
              style={{ background: "var(--primary-soft)", color: "var(--primary-hex,#6366f1)" }}
            >
              <UserCog size={18} />
            </span>
            <div className="flex flex-col gap-0.5">
              <DialogTitle>Create new member</DialogTitle>
              <DialogDescription>A temporary password &amp; setup link will be emailed to them</DialogDescription>
            </div>
          </DialogHeader>
          <div className="flex flex-col gap-4 pt-5 pb-2">
            {/* Avatar uploader — circular, preview only */}
            <div className="flex flex-col items-center gap-2">
              <div className="relative">
                <label
                  htmlFor="create-avatar"
                  className="group flex items-center justify-center overflow-hidden rounded-full cursor-pointer transition-all"
                  style={{ width: 88, height: 88, background: "var(--surface-2)", border: "2px dashed var(--border-hex,#ecedf4)" }}
                >
                  {avatarPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarPreview} alt="avatar preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="flex flex-col items-center gap-1" style={{ color: "var(--text-faint)" }}>
                      <Camera size={20} />
                      <span className="text-[10px] font-bold">Upload</span>
                    </span>
                  )}
                </label>
                {avatarPreview && (
                  <button
                    type="button"
                    onClick={clearAvatar}
                    className="absolute -top-1 -right-1 flex items-center justify-center w-6 h-6 rounded-full text-white shadow"
                    style={{ background: "var(--danger)" }}
                    aria-label="Remove image"
                  >
                    <X size={13} />
                  </button>
                )}
                <input id="create-avatar" type="file" accept="image/*" className="hidden" onChange={(e) => pickAvatar(e.target.files?.[0])} />
              </div>
              <span className="text-[11px]" style={{ color: "var(--text-faint)" }}>Optional profile photo</span>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="create-name">Full name</Label>
              <Input id="create-name" value={createForm.name} onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))} placeholder="Jane Doe" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="create-email">Email</Label>
              <Input id="create-email" type="email" value={createForm.email} onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))} placeholder="jane@company.io" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="create-phone">Phone number</Label>
              <Input id="create-phone" value={createForm.phone} onChange={(e) => setCreateForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+1 555 0100" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Role</Label>
              <Select value={createForm.role} onValueChange={(v) => setCreateForm((f) => ({ ...f, role: v }))}>
                <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sub-admin">Sub admin</SelectItem>
                  <SelectItem value="User">User</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {createError && <p className="text-sm m-0" style={{ color: "var(--danger)" }}>{createError}</p>}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setCreateOpen(false); resetCreate(); }} disabled={creating}>Cancel</Button>
            <Button onClick={submitCreate} disabled={creating || !createForm.name.trim() || !createForm.email.trim()}>
              {creating ? <><Loader2 size={14} className="animate-spin" /> Creating…</> : <><Plus size={14} /> Create member</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit member */}
      <Dialog open={!!editUser} onOpenChange={(o) => !o && setEditUser(null)}>
        <DialogContent>
          <DialogHeader className="flex-row items-center gap-3 mb-0 pb-5 border-b" style={{ borderColor: "var(--border-hex,#ecedf4)" }}>
            <span
              className="flex items-center justify-center w-10 h-10 rounded-[var(--radius-md)] flex-shrink-0"
              style={{ background: "var(--primary-soft)", color: "var(--primary-hex,#6366f1)" }}
            >
              <User size={18} />
            </span>
            <div className="flex flex-col gap-0.5">
              <DialogTitle>Edit user</DialogTitle>
              <DialogDescription>Update this member’s details &amp; access</DialogDescription>
            </div>
          </DialogHeader>
          <div className="flex flex-col gap-4 pt-5 pb-2 max-h-[60vh] overflow-y-auto pr-1">
            {/* Avatar — circular, preview only (not persisted) */}
            <div className="flex flex-col items-center gap-2">
              <div className="relative">
                <label
                  htmlFor="edit-avatar"
                  className="flex items-center justify-center overflow-hidden rounded-full cursor-pointer"
                  style={{ width: 80, height: 80, background: "var(--surface-2)", border: "2px dashed var(--border-hex,#ecedf4)" }}
                >
                  {editAvatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={editAvatar} alt="avatar preview" className="w-full h-full object-cover" />
                  ) : editUser ? (
                    <AvatarUser name={editUser.name} hue={editUser.hue} size={80} imageUrl={editUser.avatarUrl ?? undefined} />
                  ) : null}
                </label>
                {editAvatar && (
                  <button type="button" onClick={clearEditAvatar} aria-label="Remove image"
                    className="absolute -top-1 -right-1 flex items-center justify-center w-6 h-6 rounded-full text-white shadow"
                    style={{ background: "var(--danger)" }}>
                    <X size={13} />
                  </button>
                )}
                <span className="absolute -bottom-1 -right-1 flex items-center justify-center w-7 h-7 rounded-full text-white shadow" style={{ background: "var(--primary-hex,#6366f1)" }}>
                  <Camera size={13} />
                </span>
                <input id="edit-avatar" type="file" accept="image/*" className="hidden" onChange={(e) => pickEditAvatar(e.target.files?.[0])} />
              </div>
              <span className="text-[11px]" style={{ color: "var(--text-faint)" }}>Profile photo (preview only)</span>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-name">Full name</Label>
              <Input id="edit-name" value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} placeholder="Jane Doe" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Gender</Label>
                <Select value={editForm.gender} onValueChange={(v) => setEditForm((f) => ({ ...f, gender: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                  <SelectContent>
                    {GENDERS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-dob">Date of birth</Label>
                <Input id="edit-dob" type="date" value={editForm.dateOfBirth} onChange={(e) => setEditForm((f) => ({ ...f, dateOfBirth: e.target.value }))} />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-phone">Phone number</Label>
              <Input id="edit-phone" value={editForm.phone} onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+1 555 0100" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-address">Address</Label>
              <Input id="edit-address" value={editForm.address} onChange={(e) => setEditForm((f) => ({ ...f, address: e.target.value }))} placeholder="123 Main St, City" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Role</Label>
                <Select value={editForm.role} onValueChange={(v) => setEditForm((f) => ({ ...f, role: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Status</Label>
                <Select value={editForm.status} onValueChange={(v) => setEditForm((f) => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {editError && <p className="text-sm m-0" style={{ color: "var(--danger)" }}>{editError}</p>}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditUser(null)} disabled={saving}>Cancel</Button>
            <Button onClick={saveEdit} disabled={saving || !editForm.name.trim()}>
              {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteUser} onOpenChange={(o) => !o && setDeleteUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader className="flex-row items-center gap-3 mb-0 pb-5 border-b" style={{ borderColor: "var(--border-hex,#ecedf4)" }}>
            <span
              className="flex items-center justify-center w-10 h-10 rounded-[var(--radius-md)] flex-shrink-0"
              style={{ background: "var(--danger-soft)", color: "var(--danger)" }}
            >
              <Trash2 size={18} />
            </span>
            <DialogTitle>Delete user?</DialogTitle>
          </DialogHeader>
          <DialogDescription className="py-5">
            “{deleteUser?.name}” will be removed from the organization. This can’t be undone.
          </DialogDescription>
          <DialogFooter className="mt-0">
            <Button variant="ghost" onClick={() => setDeleteUser(null)} disabled={deleting}>Cancel</Button>
            <Button onClick={confirmDelete} disabled={deleting} style={{ background: "var(--danger)", color: "#fff" }}>
              {deleting ? <><Loader2 size={14} className="animate-spin" /> Deleting…</> : "Delete user"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
