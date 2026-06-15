import { serverFetch } from "@/lib/api/server";
import { ApiError } from "@/lib/api/client";
import type { PageResponse, UserResponse } from "@/lib/api/types";
import { UsersManager } from "./users-manager";

/**
 * Admin user management (docs/03 §4.2). Server Component: fetches the list and the caller's own
 * identity (to guard self-delete), forwarding cookies and never caching. A 403 renders a
 * not-authorized state rather than crashing (docs/07 §6).
 */
export default async function UsersPage() {
  let page: PageResponse<UserResponse> | null = null;
  let me: UserResponse | null = null;
  let denied = false;

  try {
    [page, me] = await Promise.all([
      serverFetch<PageResponse<UserResponse>>("/users?size=50&sort=createdAt,desc"),
      serverFetch<UserResponse>("/me").catch(() => null),
    ]);
  } catch (e) {
    if (e instanceof ApiError && (e.status === 403 || e.status === 401)) {
      denied = true;
    } else {
      throw e;
    }
  }

  if (denied) {
    return (
      <div className="mx-auto max-w-md rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)]">
        <h1 className="text-[15px] font-bold text-[var(--text-strong)]">Not authorized</h1>
        <p className="mt-1 text-[13px] text-[var(--text-muted)]">You don’t have access to user management.</p>
      </div>
    );
  }

  return (
    <UsersManager
      initialUsers={page?.content ?? []}
      currentUserId={me?.id ?? null}
      canManage={me?.globalRole === "ADMIN"}
    />
  );
}
