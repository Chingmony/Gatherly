"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUser, deactivateUser } from "@/lib/api/users";
import { ApiError } from "@/lib/api/client";
import type { GlobalRole, UserResponse } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Create user</CardTitle>
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
            <select id="role" value={role}
                    onChange={(e) => setRole(e.target.value as GlobalRole)}
                    className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100">
              <option value="MEMBER">Member</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          {error && <p className="text-sm text-red-400 sm:col-span-2" role="alert">{error}</p>}
          <div className="sm:col-span-2">
            <Button type="submit" disabled={pending}>
              {pending ? "Creating…" : "Create user"}
            </Button>
          </div>
        </form>
      </Card>

      <div className="overflow-hidden rounded-xl border border-neutral-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-900/60 text-neutral-400">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {initialUsers.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-neutral-500">No users yet.</td></tr>
            )}
            {initialUsers.map((u) => (
              <tr key={u.id} className="border-t border-neutral-800">
                <td className="px-4 py-3">{u.fullName}</td>
                <td className="px-4 py-3 text-neutral-300">{u.email}</td>
                <td className="px-4 py-3">{u.globalRole}</td>
                <td className="px-4 py-3">
                  <span className={u.status === "ACTIVE" ? "text-green-400" : "text-neutral-500"}>
                    {u.status}
                  </span>
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
