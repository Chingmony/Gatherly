"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { assignMember, removeAssignment } from "@/lib/api/assignments";
import { ApiError } from "@/lib/api/client";
import type { AssignmentResponse, CandidateResponse, InviteRole } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const FIELD =
  "rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-[13px] text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]";

/**
 * Members + Assign Handler (docs/03 §4.5): the event crew. Admins **and** event MANAGERs (Sub-admins)
 * can add Handlers on their own event (`canManage`); only an Admin may appoint another Sub-admin
 * (`isAdmin`) or remove an existing one. The server enforces all of this — the UI mirrors it.
 */
export function MembersTab({
  eventId,
  assignments,
  candidates,
  canManage,
  isAdmin,
}: {
  eventId: string;
  assignments: AssignmentResponse[];
  candidates: CandidateResponse[];
  canManage: boolean;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const assignedIds = new Set(assignments.map((a) => a.userId));
  // The server already excludes Admins from candidates; just drop anyone already on the crew.
  const available = candidates.filter((u) => !assignedIds.has(u.id));

  const [userId, setUserId] = useState("");
  const [role, setRole] = useState<InviteRole>("HANDLER");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function add() {
    if (!userId) return;
    setBusy(true);
    setError(null);
    try {
      await assignMember(eventId, { userId, role });
      setUserId("");
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not add member.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    try {
      await removeAssignment(eventId, id);
      router.refresh();
    } catch {
      router.refresh();
    }
  }

  return (
    <div className="space-y-5">
      {canManage ? (
        <div className="flex flex-wrap items-end gap-2 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-2)] p-4">
          <div className="flex-1 min-w-[180px]">
            <label className="mb-1.5 block text-[12px] font-bold text-[var(--text)]">Member</label>
            <select className={`${FIELD} w-full`} value={userId} onChange={(e) => setUserId(e.target.value)}>
              <option value="">Select a user…</option>
              {available.map((u) => (
                <option key={u.id} value={u.id}>{u.fullName} · {u.email}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] font-bold text-[var(--text)]">Role</label>
            <select className={FIELD} value={role} onChange={(e) => setRole(e.target.value as InviteRole)}>
              <option value="HANDLER">Handler</option>
              {/* Appointing a Sub-admin (MANAGER) is Admin-only — the server enforces it too. */}
              {isAdmin && <option value="SUB_ADMIN">Sub-admin</option>}
            </select>
          </div>
          <Button size="sm" disabled={busy || !userId} onClick={add}>Add to crew</Button>
        </div>
      ) : (
        <p className="rounded-[var(--radius-md)] bg-[var(--surface-2)] px-3 py-2 text-[12px] text-[var(--text-muted)]">
          Only an event manager or admin can add crew.
        </p>
      )}
      {error && <p role="alert" className="text-[13px] font-semibold text-[var(--danger)]">{error}</p>}

      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)]">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[var(--border)] text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--text-muted)]">
              <th className="px-4 py-3">Member</th><th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th><th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {assignments.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-[13px] text-[var(--text-muted)]">No crew assigned yet.</td></tr>
            )}
            {assignments.map((a) => (
              <tr key={a.id} className="border-b border-[var(--border)] last:border-0">
                <td className="px-4 py-3 text-[13px] font-semibold text-[var(--text)]">{a.fullName ?? "—"}</td>
                <td className="px-4 py-3 text-[13px] text-[var(--text-muted)]">{a.email ?? "—"}</td>
                <td className="px-4 py-3">
                  <Badge variant={a.eventRole === "MANAGER" ? "primary" : "blue"} dot={false}>
                    {a.eventRole === "MANAGER" ? "Sub-admin" : "Handler"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  {canManage && (isAdmin || a.eventRole !== "MANAGER") && (
                    <Button variant="ghost" size="sm" onClick={() => remove(a.id)}>Remove</Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
