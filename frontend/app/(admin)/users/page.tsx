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
      <div className="rounded-lg border border-neutral-800 p-6">
        <h1 className="text-lg font-semibold">Not authorized</h1>
        <p className="mt-1 text-sm text-neutral-400">You don’t have access to user management.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <p className="text-sm text-neutral-400">{page?.totalElements ?? 0} total</p>
      </div>
      <UsersManager initialUsers={page?.content ?? []} />
    </div>
  );
}
