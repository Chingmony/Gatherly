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
        <h1 className="text-4xl font-semibold tracking-tight">Gatherly</h1>
        <p className="mt-2 text-sm text-neutral-400">Event Management Platform — M0 walking skeleton</p>
      </div>

      <div className="w-full max-w-md rounded-xl border border-neutral-800 bg-neutral-900/50 p-6">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className={`inline-block h-3 w-3 rounded-full ${online ? "bg-green-500" : "bg-red-500"}`}
          />
          <span className="font-medium">
            Backend: {online ? "connected" : "unavailable"}
          </span>
        </div>

        {ping && (
          <dl className="mt-4 space-y-1 text-sm text-neutral-300">
            <div className="flex justify-between">
              <dt className="text-neutral-500">service</dt>
              <dd>{ping.service}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-500">status</dt>
              <dd>{ping.status}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-500">timestamp</dt>
              <dd>{ping.timestamp}</dd>
            </div>
          </dl>
        )}

        {error && (
          <p className="mt-4 text-sm text-red-400" role="alert">
            {error}
          </p>
        )}
      </div>
    </main>
  );
}
