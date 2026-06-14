import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-neutral-800 px-6 py-3">
        <div className="flex items-center gap-6">
          <Link href="/users" className="font-semibold tracking-tight">
            Gatherly <span className="text-neutral-500">Admin</span>
          </Link>
          <nav className="text-sm text-neutral-400">
            <Link href="/users" className="hover:text-neutral-100">Users</Link>
          </nav>
        </div>
        <LogoutButton />
      </header>
      <div className="p-6">{children}</div>
    </div>
  );
}
