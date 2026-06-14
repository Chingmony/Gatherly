"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { inviteUser, deactivateUser } from "@/lib/api/users";
import { ApiError } from "@/lib/api/client";
import { displayRole, type InviteRole, type UserResponse, type UserStatus } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";

const STATUS_LABEL: Record<UserStatus, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  PENDING_ACTIVATION: "Pending",
};

export function UsersManager({ initialUsers }: { initialUsers: UserResponse[] }) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<InviteRole>("SUB_ADMIN");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function openModal() {
    setFullName("");
    setEmail("");
    setRole("SUB_ADMIN");
    setError(null);
    setModalOpen(true);
  }

  async function onInvite(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await inviteUser({ fullName, email, role });
      setModalOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not add user.");
    } finally {
      setPending(false);
    }
  }

  async function onDeactivate(id: string) {
    try {
      await deactivateUser(id);
      router.refresh();
    } catch {
      // ignore — list reflects actual state on refresh
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openModal}>Add User</Button>
      </div>

      <div className="overflow-hidden rounded-[var(--r)] border border-[var(--bo)] bg-[var(--ca)] shadow-[var(--sh)]">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[var(--bo)] text-[10.5px] font-semibold uppercase tracking-[0.06em] text-[var(--t3)]">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Active Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {initialUsers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-[13px] text-[var(--t3)]">
                  No users yet.
                </td>
              </tr>
            )}
            {initialUsers.map((u) => {
              const roleLabel = displayRole(u);
              const roleAccent = roleLabel === "Admin" || roleLabel === "Sub-admin";
              return (
                <tr key={u.id} className="border-b border-[var(--bo)] last:border-0 transition-colors hover:bg-[var(--sidebar-hover)]">
                  <td className="px-4 py-3 text-[13px] font-medium text-[var(--t1)]">{u.fullName}</td>
                  <td className="px-4 py-3 text-[13px] text-[var(--t2)]">{u.email}</td>
                  <td className="px-4 py-3">
                    <Badge variant={roleAccent ? "accent" : "neutral"}>{roleLabel}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={u.status === "ACTIVE" ? "accent" : "neutral"}>
                      {STATUS_LABEL[u.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" disabled={u.status === "INACTIVE"}
                            onClick={() => onDeactivate(u.id)}>
                      Deactivate
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} titleId="add-user-title">
        <h2 id="add-user-title" className="text-[15px] font-bold tracking-[-0.01em] text-[var(--t1)]">
          Add User
        </h2>
        <p className="mt-1 text-[13px] text-[var(--t2)]">
          They’ll receive an email to set their own password.
        </p>
        <form onSubmit={onInvite} className="mt-4 space-y-4">
          <div>
            <Label htmlFor="fullName">Name</Label>
            <Input id="fullName" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="role">Role</Label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as InviteRole)}
              className="w-full rounded-[var(--rs)] border border-[var(--bo)] bg-[var(--ca)] px-3.5 py-2.5 text-[14px] text-[var(--t1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ac)] focus-visible:border-[var(--ac)]"
            >
              <option value="SUB_ADMIN">Sub-admin</option>
              <option value="HANDLER">Handler</option>
            </select>
          </div>
          {error && (
            <p className="text-[13px] font-medium text-[var(--ac-2)]" role="alert">{error}</p>
          )}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Adding…" : "Add User"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
