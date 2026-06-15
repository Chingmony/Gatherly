"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, Pencil, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { inviteUser, updateUser, deleteUser } from "@/lib/api/users";
import { ApiError } from "@/lib/api/client";
import {
  displayRole,
  type GlobalRole,
  type InviteRole,
  type UserResponse,
  type UserStatus,
} from "@/lib/api/types";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";

/** The Role column's three displayed tiers, mapped to (globalRole, defaultEventRole) on save. */
type RoleChoice = "ADMIN" | "SUB_ADMIN" | "HANDLER";

const FIELD =
  "w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-2.5 text-[14px] text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:border-[var(--primary)]";

export function UsersManager({
  initialUsers,
  currentUserId,
}: {
  initialUsers: UserResponse[];
  currentUserId: string | null;
}) {
  const router = useRouter();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [viewUser, setViewUser] = useState<UserResponse | null>(null);
  const [editUser, setEditUser] = useState<UserResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserResponse | null>(null);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-extrabold tracking-[-0.02em] text-[var(--text-strong)]">Team &amp; Roles</h1>
          <p className="mt-0.5 text-[13.5px] font-medium text-[var(--text-muted)]">
            Manage who can do what across the organization
          </p>
        </div>
        <Button onClick={() => setInviteOpen(true)}>
          <Plus className="h-4 w-4" /> Invite member
        </Button>
      </div>

      {/* Members card */}
      <div className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)]">
        <h2 className="px-6 pb-3 pt-5 text-[16px] font-extrabold text-[var(--text-strong)]">Members</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead>
              <tr className="border-y border-[var(--border)] text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--text-faint)]">
                <th className="px-6 py-2.5 font-bold">Member</th>
                <th className="px-4 py-2.5 font-bold">Role</th>
                <th className="px-4 py-2.5 font-bold">Scope</th>
                <th className="px-4 py-2.5 font-bold">Status</th>
                <th className="px-6 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {initialUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-[13px] text-[var(--text-faint)]">
                    No members yet.
                  </td>
                </tr>
              )}
              {initialUsers.map((u) => (
                <tr key={u.id} className="border-b border-[var(--border)] last:border-0 transition-colors hover:bg-[var(--surface-2)]">
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <Avatar name={u.fullName} size={38} />
                      <div className="min-w-0">
                        <p className="truncate text-[13.5px] font-bold text-[var(--text-strong)]">{u.fullName}</p>
                        <p className="truncate text-[12.5px] text-[var(--text-muted)]">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <RoleBadge user={u} />
                  </td>
                  <td className="px-4 py-3.5 text-[13px] font-medium text-[var(--text-muted)]">{scopeLabel(u)}</td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={u.status} />
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="flex items-center justify-end gap-1.5">
                      <IconAction label={`View ${u.fullName}`} onClick={() => setViewUser(u)}>
                        <Eye className="h-[17px] w-[17px]" />
                      </IconAction>
                      <IconAction label={`Edit ${u.fullName}`} onClick={() => setEditUser(u)}>
                        <Pencil className="h-[16px] w-[16px]" />
                      </IconAction>
                      <IconAction
                        label={u.id === currentUserId ? "You can’t delete your own account" : `Delete ${u.fullName}`}
                        onClick={() => setDeleteTarget(u)}
                        disabled={u.id === currentUserId}
                        danger
                      >
                        <Trash2 className="h-[16px] w-[16px]" />
                      </IconAction>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {inviteOpen && <InviteDialog onClose={() => setInviteOpen(false)} onDone={() => { setInviteOpen(false); router.refresh(); }} />}
      {viewUser && <ViewDialog user={viewUser} onClose={() => setViewUser(null)} />}
      {editUser && <EditDialog user={editUser} onClose={() => setEditUser(null)} onDone={() => { setEditUser(null); router.refresh(); }} />}
      {deleteTarget && <DeleteDialog user={deleteTarget} onClose={() => setDeleteTarget(null)} onDone={() => { setDeleteTarget(null); router.refresh(); }} />}
    </div>
  );
}

// ---- Cells -----------------------------------------------------------------

function RoleBadge({ user }: { user: UserResponse }) {
  const label = displayRole(user);
  const variant = label === "Handler" ? "teal" : label === "Member" ? "gray" : "primary";
  return (
    <Badge variant={variant} dot={false}>
      <ShieldCheck className="h-3.5 w-3.5" aria-hidden /> {label}
    </Badge>
  );
}

const STATUS: Record<UserStatus, { label: string; variant: "green" | "orange" | "gray" }> = {
  ACTIVE: { label: "Active", variant: "green" },
  PENDING_ACTIVATION: { label: "Invited", variant: "orange" },
  INACTIVE: { label: "Inactive", variant: "gray" },
};

function StatusBadge({ status }: { status: UserStatus }) {
  const s = STATUS[status];
  return <Badge variant={s.variant}>{s.label}</Badge>;
}

/** Scope text per the mockup: Admins cover all; otherwise the single event name or an "N assigned" count. */
function scopeLabel(u: UserResponse): string {
  if (u.globalRole === "ADMIN") return "All events";
  const n = u.assignedEventCount ?? 0;
  if (n === 0) return "—";
  if (n === 1) return u.assignedEventName ?? "1 assigned";
  return `${n} assigned`;
}

function IconAction({
  children,
  label,
  onClick,
  disabled,
  danger,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={`grid h-9 w-9 place-items-center rounded-[var(--radius-md)] border transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        danger
          ? "border-[var(--danger-soft)] bg-[var(--danger-soft)] text-[var(--danger)] hover:enabled:bg-[var(--danger)] hover:enabled:text-white"
          : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:enabled:border-[var(--primary-ring)] hover:enabled:text-[var(--primary)]"
      }`}
    >
      {children}
    </button>
  );
}

// ---- Invite ----------------------------------------------------------------

function InviteDialog({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<InviteRole>("SUB_ADMIN");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await inviteUser({ fullName, email, role });
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not invite member.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open onClose={onClose} titleId="invite-title">
      <h2 id="invite-title" className="text-[16px] font-extrabold tracking-[-0.01em] text-[var(--text-strong)]">Invite member</h2>
      <p className="mt-1 text-[13px] text-[var(--text-muted)]">They’ll receive an email to set their own password.</p>
      <form onSubmit={onSubmit} className="mt-4 space-y-4">
        <div>
          <Label htmlFor="i-name">Full name</Label>
          <Input id="i-name" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="i-email">Email</Label>
          <Input id="i-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="i-role">Role</Label>
          <select id="i-role" value={role} onChange={(e) => setRole(e.target.value as InviteRole)} className={FIELD}>
            <option value="SUB_ADMIN">Sub-admin</option>
            <option value="HANDLER">Handler</option>
          </select>
        </div>
        {error && <p className="text-[13px] font-semibold text-[var(--danger)]" role="alert">{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={pending}>{pending ? "Inviting…" : "Send invite"}</Button>
        </div>
      </form>
    </Dialog>
  );
}

// ---- View ------------------------------------------------------------------

function ViewDialog({ user, onClose }: { user: UserResponse; onClose: () => void }) {
  return (
    <Dialog open onClose={onClose} titleId="view-title">
      <div className="flex items-center gap-3">
        <Avatar name={user.fullName} size={48} />
        <div className="min-w-0">
          <h2 id="view-title" className="truncate text-[16px] font-extrabold text-[var(--text-strong)]">{user.fullName}</h2>
          <p className="truncate text-[13px] text-[var(--text-muted)]">{user.email}</p>
        </div>
      </div>
      <dl className="mt-5 space-y-3 text-[13px]">
        <Row label="Role"><RoleBadge user={user} /></Row>
        <Row label="Scope"><span className="font-semibold text-[var(--text)]">{scopeLabel(user)}</span></Row>
        <Row label="Status"><StatusBadge status={user.status} /></Row>
        {user.phone && <Row label="Phone"><span className="font-semibold text-[var(--text)]">{user.phone}</span></Row>}
        <Row label="Joined"><span className="font-semibold text-[var(--text)]">{formatDate(user.createdAt)}</span></Row>
      </dl>
      <div className="mt-6 flex justify-end">
        <Button variant="secondary" onClick={onClose}>Close</Button>
      </div>
    </Dialog>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-[var(--text-muted)]">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

// ---- Edit ------------------------------------------------------------------

function roleChoiceOf(u: UserResponse): RoleChoice {
  if (u.globalRole === "ADMIN") return "ADMIN";
  return u.defaultEventRole === "HANDLER" ? "HANDLER" : "SUB_ADMIN";
}

function EditDialog({ user, onClose, onDone }: { user: UserResponse; onClose: () => void; onDone: () => void }) {
  const [fullName, setFullName] = useState(user.fullName);
  const [roleChoice, setRoleChoice] = useState<RoleChoice>(roleChoiceOf(user));
  const [status, setStatus] = useState<UserStatus>(user.status);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const globalRole: GlobalRole = roleChoice === "ADMIN" ? "ADMIN" : "MEMBER";
    const defaultEventRole = roleChoice === "ADMIN" ? null : roleChoice === "HANDLER" ? "HANDLER" : "MANAGER";
    try {
      // Preserve fields not shown in this form so the update doesn't wipe them.
      await updateUser(user.id, {
        fullName,
        phone: user.phone,
        gender: user.gender,
        dateOfBirth: user.dateOfBirth,
        address: user.address,
        globalRole,
        defaultEventRole,
        status,
      });
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save changes.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open onClose={onClose} titleId="edit-title">
      <h2 id="edit-title" className="text-[16px] font-extrabold tracking-[-0.01em] text-[var(--text-strong)]">Edit member</h2>
      <p className="mt-1 text-[13px] text-[var(--text-muted)]">{user.email}</p>
      <form onSubmit={onSubmit} className="mt-4 space-y-4">
        <div>
          <Label htmlFor="e-name">Full name</Label>
          <Input id="e-name" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="e-role">Role</Label>
          <select id="e-role" value={roleChoice} onChange={(e) => setRoleChoice(e.target.value as RoleChoice)} className={FIELD}>
            <option value="ADMIN">Admin</option>
            <option value="SUB_ADMIN">Sub-admin</option>
            <option value="HANDLER">Handler</option>
          </select>
          {roleChoice === "ADMIN" && (
            <p className="mt-1 text-[12px] text-[var(--text-faint)]">Admins have full control of every event and the organization.</p>
          )}
        </div>
        <div>
          <Label htmlFor="e-status">Status</Label>
          <select id="e-status" value={status} onChange={(e) => setStatus(e.target.value as UserStatus)} className={FIELD}>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            {user.status === "PENDING_ACTIVATION" && <option value="PENDING_ACTIVATION">Invited (pending activation)</option>}
          </select>
        </div>
        {error && <p className="text-[13px] font-semibold text-[var(--danger)]" role="alert">{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save changes"}</Button>
        </div>
      </form>
    </Dialog>
  );
}

// ---- Delete ----------------------------------------------------------------

function DeleteDialog({ user, onClose, onDone }: { user: UserResponse; onClose: () => void; onDone: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onConfirm() {
    setError(null);
    setPending(true);
    try {
      await deleteUser(user.id);
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not delete this member.");
      setPending(false);
    }
  }

  return (
    <Dialog open onClose={onClose} titleId="delete-title">
      <h2 id="delete-title" className="text-[16px] font-extrabold tracking-[-0.01em] text-[var(--text-strong)]">Delete member?</h2>
      <p className="mt-1.5 text-[13px] text-[var(--text-muted)]">
        This permanently removes <span className="font-semibold text-[var(--text)]">{user.fullName}</span> ({user.email}).
        This can’t be undone. If they’re still assigned to events, deletion is blocked — deactivate them instead.
      </p>
      {error && <p className="mt-3 text-[13px] font-semibold text-[var(--danger)]" role="alert">{error}</p>}
      <div className="mt-5 flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="button" variant="danger" onClick={onConfirm} disabled={pending}>
          {pending ? "Deleting…" : "Delete member"}
        </Button>
      </div>
    </Dialog>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}
