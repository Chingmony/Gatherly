import { serverFetch } from "@/lib/api/server";
import type { SupplyItemResponse, UserResponse } from "@/lib/api/types";
import { SupplyItemsManager } from "./supply-items-manager";

/**
 * Supply Catalog (docs/03 §4.6, docs/05 §6) — the global, reusable master inventory. Reads are open
 * to any authenticated user; only an Admin may add, edit, or delete (Sub-admins are forbidden from
 * deleting — an absolute restriction, docs/00 §5). `canEdit` is the caller's global role; the
 * manager hides all mutation affordances and the Actions column for everyone else (view-only).
 */
export default async function SupplyItemsPage() {
  const [items, me] = await Promise.all([
    serverFetch<SupplyItemResponse[]>("/supply-items").catch(() => [] as SupplyItemResponse[]),
    serverFetch<UserResponse>("/me").catch(() => null),
  ]);
  const canEdit = me?.globalRole === "ADMIN";

  return <SupplyItemsManager items={items} canEdit={canEdit} />;
}
