"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/cn";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      type="button"
      onClick={toggleTheme}
      title="Toggle theme"
      aria-label="Toggle theme"
      className={cn(
        "flex items-center justify-center w-[42px] h-[42px] rounded-[var(--radius-md)] border transition-all duration-150 cursor-pointer hover:-translate-y-px",
        className
      )}
      style={{
        background: "var(--surface)",
        borderColor: "var(--border-hex,#ecedf4)",
        color: "var(--text-muted)",
      }}
    >
      {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
