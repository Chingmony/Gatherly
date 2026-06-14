import { serverFetch } from "@/lib/api/server";
import type { SupplyItemResponse, UserResponse } from "@/lib/api/types";
import { SupplyItemsManager } from "./supply-items-manager";

/**
 * Main supply list (docs/03 §4.6, docs/05 §6). The global, reusable supply catalog. Reads are open
 * to any authenticated user; only an Admin may add or delete (Sub-admins are forbidden from
 * deleting — an absolute restriction, docs/00 §5). `canEdit` is the caller's global role.
 */
export default async function SupplyItemsPage() {
  const [items, me] = await Promise.all([
    serverFetch<SupplyItemResponse[]>("/supply-items").catch(() => [] as SupplyItemResponse[]),
    serverFetch<UserResponse>("/me").catch(() => null),
  ]);
  const canEdit = me?.globalRole === "ADMIN";

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-[22px] font-extrabold tracking-[-0.01em] text-[var(--text-strong)]">Supply list</h1>
        <p className="text-[13px] text-[var(--text-muted)]">
          The global catalog of reusable supplies, available to every event.
          {canEdit ? "" : " Read-only — only an admin can edit."}
        </p>
      </div>
      <SupplyItemsManager items={items} canEdit={canEdit} />
    </div>
  );
}
