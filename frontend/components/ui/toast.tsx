import { toast as sonnerToast } from "sonner";

/**
 * App toast API — a thin `(title, description)` wrapper over Sonner so existing call
 * sites keep working while Sonner renders the stack (mounted via `<Toaster/>` from
 * `components/ui/sonner.tsx` in the app shell). Use for transient success/error
 * alerts; keep page-level load failures as inline states.
 */
export const toast = {
  success: (title: string, description?: string) =>
    sonnerToast.success(title, description ? { description } : undefined),
  error: (title: string, description?: string) =>
    sonnerToast.error(title, description ? { description } : undefined),
  info: (title: string, description?: string) =>
    sonnerToast.info(title, description ? { description } : undefined),
};
