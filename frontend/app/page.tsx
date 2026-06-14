import { getPing, type PingResponse } from "@/lib/api/ping";
import { ApiError } from "@/lib/api/client";

/**
 * M0 walking-skeleton landing page (docs/13 §M0): a Server Component that calls the backend
 * `/api/v1/ping` and renders the result — proving the browser → Next.js → Spring path works
 * end to end. Replaced by the real authenticated shell from M1 onward.
 */
export default async function Home() {
  let ping: PingResponse | null = null;
  let error: string | null = null;

  try {
    ping = await getPing();
  } catch (e) {
    error = e instanceof ApiError ? `${e.code}: ${e.message}` : "Backend unreachable.";
  }

  const online = ping?.status === "ok";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <div className="text-center">
        <h1 className="text-[28px] font-bold tracking-[-0.02em] text-[var(--t1)]">Gatherly</h1>
        <p className="mt-1 text-[13px] font-medium text-[var(--t2)]">
          Event Management Platform — M0 walking skeleton
        </p>
      </div>

      <div className="w-full max-w-md rounded-[var(--r)] border border-[var(--bo)] bg-[var(--ca)] p-5 shadow-[var(--sh)]">
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: online ? "var(--ac)" : "var(--pill-dot)" }}
          />
          <span className="text-[14px] font-semibold text-[var(--t1)]">
            Backend: {online ? "connected" : "unavailable"}
          </span>
        </div>

        {ping && (
          <dl className="mt-4 space-y-1.5 text-[13px]">
            <div className="flex justify-between">
              <dt className="text-[var(--t3)]">service</dt>
              <dd className="text-[var(--t1)]">{ping.service}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--t3)]">status</dt>
              <dd className="text-[var(--t1)]">{ping.status}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--t3)]">timestamp</dt>
              <dd className="font-[ui-monospace,Menlo,monospace] text-[var(--t2)]">{ping.timestamp}</dd>
            </div>
          </dl>
        )}

        {error && (
          <p className="mt-4 text-[13px] font-medium text-[var(--ac-2)]" role="alert">
            {error}
          </p>
        )}
      </div>
    </main>
  );
}
