import { serverFetch } from "@/lib/api/server";
import { ApiError } from "@/lib/api/client";
import type { OrganizationResponse } from "@/lib/api/types";
import { OrganizationForm } from "./organization-form";

/**
 * Admin organization profile (docs/03 §4.3, docs/05 §7). Server Component: fetches the singleton
 * profile (forwarding cookies, never cached) and hands it to the interactive form. A 403 renders a
 * not-authorized state (docs/07 §6).
 */
export default async function OrganizationPage() {
  let org: OrganizationResponse | null = null;
  let denied = false;

  try {
    org = await serverFetch<OrganizationResponse>("/organization");
  } catch (e) {
    if (e instanceof ApiError && (e.status === 403 || e.status === 401)) {
      denied = true;
    } else {
      throw e;
    }
  }

  if (denied || !org) {
    return (
      <div className="mx-auto max-w-md rounded-[var(--r)] border border-[var(--bo)] bg-[var(--ca)] p-6 shadow-[var(--sh)]">
        <h1 className="text-[15px] font-bold text-[var(--t1)]">Not authorized</h1>
        <p className="mt-1 text-[13px] text-[var(--t2)]">You don’t have access to the organization profile.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-[20px] font-bold tracking-[-0.01em] text-[var(--t1)]">Organization</h1>
        <p className="text-[12px] font-medium text-[var(--t3)]">Branding & contact details</p>
      </div>
      <OrganizationForm initial={org} />
    </div>
  );
}
