import Link from "next/link";
import { Logo } from "@/components/ui/logo";

/** Center nav (design GuestHome topbar) — browse events, find a ticket, learn about Gatherly. */
const NAV = [
  { label: "Events", href: "/#events" },
  { label: "Tickets", href: "/tickets" },
  { label: "About", href: "/about" },
];

/** Slim top bar for the public guest site (docs/05 §7 Guest). */
export function PublicTopbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--bg)_82%,transparent)] backdrop-blur">
      <div className="mx-auto flex max-w-[1100px] items-center justify-between gap-4 px-5 py-3.5">
        <Link href="/" aria-label="Gatherly home">
          <Logo size={26} />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="rounded-[var(--radius-md)] px-3 py-1.5 text-[13px] font-semibold text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

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
