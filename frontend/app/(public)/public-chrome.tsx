"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const NAV = [
  { href: "/#events", label: "Events", match: "/" },
  { href: "/tickets", label: "Tickets", match: "/tickets" },
  { href: "/about", label: "About", match: "/about" },
];

function PublicHeader() {
  const pathname = usePathname() ?? "/";

  return (
    <header className="mx-auto flex h-[72px] max-w-[1200px] items-center gap-6 px-6 md:px-10">
      <Link href="/" aria-label="Gatherly home" className="flex-1">
        <Logo size={28} />
      </Link>
      <nav className="hidden items-center justify-center gap-8 md:flex">
        {NAV.map((item) => {
          const active = item.match === "/" ? pathname === "/" : pathname.startsWith(item.match);
          return (
            <Link
              key={item.label}
              href={item.href}
              className="text-sm font-semibold transition-colors hover:text-[var(--text-strong)]"
              style={{ color: active ? "var(--text-strong)" : "var(--text-muted)" }}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="flex flex-1 items-center justify-end gap-3">
        <ThemeToggle />
        <Button asChild variant="outline" size="sm">
          <Link href="/login">Organizer sign in</Link>
        </Button>
      </div>
    </header>
  );
}

function PublicFooter() {
  return (
    <footer
      className="mx-auto mt-4 flex w-full max-w-[1200px] flex-col items-start justify-between gap-4 border-t px-6 pb-10 pt-8 md:flex-row md:items-center md:px-10"
      style={{ borderColor: "var(--border-hex,#ecedf4)" }}
    >
      <div className="flex flex-col gap-1">
        <Logo size={24} />
        <p className="m-0 text-xs" style={{ color: "var(--text-muted)" }}>
          Discover public events and get your QR ticket instantly.
        </p>
      </div>
      <nav className="flex items-center gap-6">
        <Link href="/#events" className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
          Events
        </Link>
        <Link href="/tickets" className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
          Tickets
        </Link>
        <Link href="/about" className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
          About
        </Link>
        <Link href="/login" className="text-xs font-semibold" style={{ color: "var(--primary-hex,#6366f1)" }}>
          Organizer sign in
        </Link>
      </nav>
    </footer>
  );
}

/** Soft lavender background with the same decorative blobs as the landing hero. */
export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-x-clip" style={{ background: "var(--bg)" }}>
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -left-24 -top-24 h-[420px] w-[420px] rounded-full blur-[120px]"
          style={{ background: "rgba(124,92,240,0.20)" }}
        />
        <div
          className="absolute right-[-80px] top-[-60px] h-[460px] w-[460px] rounded-full blur-[130px]"
          style={{ background: "rgba(244,114,182,0.16)" }}
        />
      </div>
      <div className="relative flex flex-1 flex-col">
        <PublicHeader />
        <main className="flex-1">{children}</main>
        <PublicFooter />
      </div>
    </div>
  );
}
