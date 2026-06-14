import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
      <h1 className="text-[28px] font-bold tracking-[-0.02em] text-[var(--t1)]">403 — Forbidden</h1>
      <p className="text-[14px] text-[var(--t2)]">You don’t have permission to view this page.</p>
      <Link href="/login" className="text-[13px] font-semibold text-[var(--ac)] hover:underline">
        Back to sign in
      </Link>
    </main>
  );
}
