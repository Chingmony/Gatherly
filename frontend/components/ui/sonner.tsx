"use client";

import { Toaster as Sonner } from "sonner";
import { useTheme } from "@/components/theme-provider";

type ToasterProps = React.ComponentProps<typeof Sonner>;

/**
 * App Toaster (Sonner) — mounted once inside the themed shell. Positioned
 * top-center so toasts clear the handler's bottom nav + FAB on mobile;
 * `richColors` tints success/error; the theme follows the app's light/dark
 * provider (we use a custom ThemeProvider, not next-themes).
 */
export function Toaster(props: ToasterProps) {
  const { theme } = useTheme();
  return (
    <Sonner
      theme={theme === "dark" ? "dark" : "light"}
      position="top-center"
      richColors
      closeButton
      {...props}
    />
  );
}
