import Link from "next/link";
import { Logo } from "@/components/ui/logo";

/** Slim chromeless top bar for the public guest site (docs/05 §7 Guest). */
export function PublicTopbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--bg)_82%,transparent)] backdrop-blur">
      <div className="mx-auto flex max-w-[1100px] items-center justify-between px-5 py-3.5">
        <Link href="/" aria-label="Gatherly home">
          <Logo size={26} />
        </Link>
        <Link
          href="/login"
          className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-[13px] font-bold text-[var(--text)] transition-colors hover:border-[var(--primary-ring)] hover:text-[var(--primary)]"
        >
          Organizer sign in
        </Link>
      </div>
    </header>
  );
}
