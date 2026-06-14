import { serverFetch } from "@/lib/api/server";
import { ApiError } from "@/lib/api/client";
import type { PageResponse, UserResponse } from "@/lib/api/types";
import { UsersManager } from "./users-manager";

/**
 * Admin user management (docs/03 §4.2). Server Component: fetches the list (forwarding the
 * caller's cookies, never cached) and hands it to the interactive client manager. A 403 renders
 * a not-authorized state rather than crashing (docs/07 §6).
 */
export default async function UsersPage() {
  let page: PageResponse<UserResponse> | null = null;
  let denied = false;

  try {
    page = await serverFetch<PageResponse<UserResponse>>("/users?size=50&sort=createdAt,desc");
  } catch (e) {
    if (e instanceof ApiError && (e.status === 403 || e.status === 401)) {
      denied = true;
    } else {
      throw e;
    }
  }

  if (denied) {
    return (
      <div className="mx-auto max-w-md rounded-[var(--r)] border border-[var(--bo)] bg-[var(--ca)] p-6 shadow-[var(--sh)]">
        <h1 className="text-[15px] font-bold text-[var(--t1)]">Not authorized</h1>
        <p className="mt-1 text-[13px] text-[var(--t2)]">You don’t have access to user management.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div>
        <h1 className="text-[20px] font-bold tracking-[-0.01em] text-[var(--t1)]">Users</h1>
        <p className="text-[12px] font-medium text-[var(--t3)]">{page?.totalElements ?? 0} total</p>
      </div>
      <UsersManager initialUsers={page?.content ?? []} />
    </div>
  );
}
