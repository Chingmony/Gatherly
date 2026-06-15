"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { QrCode } from "lucide-react";

/**
 * Floating action button for the handler shell — a thumb-reachable shortcut to the
 * check-in scanner, the handler's primary action. Mobile-only (desktop uses the
 * sidebar); hidden on scanner routes where it would be redundant. Sits above the
 * bottom MobileNav and clears the iOS home-indicator safe area.
 */
export function HandlerFab() {
  const pathname = usePathname();

  // Redundant on the scanner picker and the live viewfinder.
  if (pathname.includes("/scanner")) return null;

  return (
    <Link
      href="/scanner"
      aria-label="Open check-in scanner"
      className="fixed right-4 flex items-center justify-center rounded-full transition-transform active:scale-95 md:hidden"
      style={{
        // Sit clearly above the bottom nav (64px) + its safe-area padding, with a gap.
        bottom: "calc(64px + 22px + env(safe-area-inset-bottom, 0px))",
        // Above the MobileNav (z-50) so the nav never clips the FAB's lower half.
        zIndex: 55,
        width: 58,
        height: 58,
        background: "linear-gradient(140deg, var(--primary-hex,#6366f1), var(--green-600))",
        color: "#fff",
        boxShadow: "0 8px 22px rgba(99,102,241,.42)",
      }}
    >
      <QrCode size={26} strokeWidth={2.4} />
    </Link>
  );
}
