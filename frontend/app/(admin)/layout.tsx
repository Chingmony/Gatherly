import { AppSidebar } from "@/components/app-sidebar";
import { AppTopbar } from "@/components/app-topbar";
import { serverFetch } from "@/lib/api/server";
import { displayRole, type UserResponse } from "@/lib/api/types";

/**
 * Authenticated app shell (design App Shell): fixed 252px sidebar + a main column of a sticky
 * topbar over a scrollable, max-width-1320 page area. The current user is fetched once here
 * (cookie-forwarding, never cached) and threaded to the topbar/sidebar; a failure degrades to a
 * generic shell rather than crashing the whole tree.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  let me: UserResponse | null = null;
  try {
    me = await serverFetch<UserResponse>("/me");
  } catch {
    me = null;
  }

  return (
    <div className="flex min-h-screen">
      <AppSidebar roleLabel={me ? displayRole(me) : "Admin"} />
      <div
        className="flex min-w-0 flex-1 flex-col"
        style={{
          background:
            "radial-gradient(1200px 480px at 80% -10%, var(--bg-grad-a), transparent 60%), var(--bg)",
        }}
      >
        <AppTopbar me={me} />
        <div className="flex-1 overflow-y-auto px-[22px] pb-10 pt-[22px] sm:px-[30px]">
          <div className="mx-auto max-w-[1320px]">{children}</div>
        </div>
      </div>
    </div>
  );
}
