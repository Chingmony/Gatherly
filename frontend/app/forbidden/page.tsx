import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-3xl font-semibold">403 — Forbidden</h1>
      <p className="text-neutral-400">You don’t have permission to view this page.</p>
      <Link href="/login" className="text-indigo-400 hover:underline">Back to sign in</Link>
    </main>
  );
}
