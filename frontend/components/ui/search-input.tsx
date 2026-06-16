"use client";

import { Search } from "lucide-react";

/** Reusable search box for listing pages — leading magnifier icon, themed, type=search. */
export function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
  label,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
}) {
  return (
    <div className={`relative ${className ?? ""}`}>
      <Search
        aria-hidden
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--text-faint)]"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label ?? placeholder}
        className="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] py-2.5 pl-9 pr-3 text-[13px] text-[var(--text)] shadow-[var(--shadow-sm)] placeholder:text-[var(--text-faint)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
      />
    </div>
  );
}
