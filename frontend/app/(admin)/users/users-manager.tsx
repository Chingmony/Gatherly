"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUser, deactivateUser } from "@/lib/api/users";
import { ApiError } from "@/lib/api/client";
import type { GlobalRole, UserResponse } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

export function UsersManager({ initialUsers }: { initialUsers: UserResponse[] }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<GlobalRole>("MEMBER");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await createUser({ email, password, fullName, globalRole: role });
      setEmail("");
      setFullName("");
      setPassword("");
      setRole("MEMBER");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create user.");
    } finally {
      setPending(false);
    }
  }

  async function onDeactivate(id: string) {
    try {
      await deactivateUser(id);
      router.refresh();
    } catch {
      // ignore — list will reflect actual state on refresh
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Create user</CardTitle>
        </CardHeader>
        <form onSubmit={onCreate} className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email}
                   onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="fullName">Full name</Label>
            <Input id="fullName" required value={fullName}
                   onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="password">Temporary password</Label>
            <Input id="password" type="password" required minLength={8}
                   value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="role">Role</Label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as GlobalRole)}
              className="w-full rounded-[var(--rs)] border border-[var(--bo)] bg-[var(--ca)] px-3.5 py-2.5 text-[14px] text-[var(--t1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ac)] focus-visible:border-[var(--ac)]"
            >
              <option value="MEMBER">Member</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          {error && (
            <p className="text-[13px] font-medium text-[var(--ac-2)] sm:col-span-2" role="alert">
              {error}
            </p>
          )}
          <div className="sm:col-span-2">
            <Button type="submit" disabled={pending}>
              {pending ? "Creating…" : "Create user"}
            </Button>
          </div>
        </form>
      </Card>

      <div className="overflow-hidden rounded-[var(--r)] border border-[var(--bo)] bg-[var(--ca)] shadow-[var(--sh)]">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[var(--bo)] text-[10.5px] font-semibold uppercase tracking-[0.06em] text-[var(--t3)]">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
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
            {initialUsers.map((u) => (
              <tr key={u.id} className="border-b border-[var(--bo)] last:border-0 transition-colors hover:bg-[var(--sidebar-hover)]">
                <td className="px-4 py-3 text-[13px] font-medium text-[var(--t1)]">{u.fullName}</td>
                <td className="px-4 py-3 text-[13px] text-[var(--t2)]">{u.email}</td>
                <td className="px-4 py-3">
                  <Badge variant={u.globalRole === "ADMIN" ? "accent" : "neutral"}>{u.globalRole}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={u.status === "ACTIVE" ? "accent" : "neutral"}>{u.status}</Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button variant="ghost" disabled={u.status === "INACTIVE"}
                          onClick={() => onDeactivate(u.id)}>
                    Deactivate
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
