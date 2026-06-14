import { serverFetch } from "@/lib/api/server";
import type { MyTaskResponse } from "@/lib/api/types";
import { MyTasksBoard } from "./my-tasks-board";

/**
 * Handler "My Tasks" (docs/03 §4.7 — `GET /materials/mine`, docs/05 §6). The caller's assigned
 * materials across every event, with status controls. Self-scoped on the server, so any
 * authenticated user sees only their own tasks (an empty list for non-handlers).
 */
export default async function MyTasksPage() {
  const tasks = await serverFetch<MyTaskResponse[]>("/materials/mine").catch(() => [] as MyTaskResponse[]);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-[22px] font-extrabold tracking-[-0.01em] text-[var(--text-strong)]">My Tasks</h1>
        <p className="text-[13px] text-[var(--text-muted)]">
          Materials assigned to you across every event. Advance your work; approvals are handled by an
          event manager.
        </p>
      </div>
      <MyTasksBoard tasks={tasks} />
    </div>
  );
}
