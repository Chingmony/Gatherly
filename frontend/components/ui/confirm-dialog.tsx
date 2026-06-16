"use client";

import { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "./button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from "./dialog";

/**
 * Controlled confirmation popup — a styled replacement for `window.confirm`. `onConfirm` runs while
 * a spinner shows; the dialog closes once it resolves. The caller is expected to handle its own
 * errors (e.g. toast), so a settled `onConfirm` always closes the dialog. While confirming, the
 * dialog can't be dismissed.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => Promise<void> | void;
}) {
  const [busy, setBusy] = useState(false);

  async function confirm() {
    setBusy(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!busy) onOpenChange(v); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span
              className="flex items-center justify-center w-11 h-11 rounded-[var(--radius-md)] flex-shrink-0"
              style={destructive
                ? { background: "var(--danger-soft)", color: "var(--danger)" }
                : { background: "var(--primary-soft)", color: "var(--primary-hex,#6366f1)" }}
            >
              <AlertTriangle size={20} />
            </span>
            <div className="flex flex-col gap-0.5">
              <DialogTitle>{title}</DialogTitle>
              {description && <DialogDescription>{description}</DialogDescription>}
            </div>
          </div>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="ghost" size="default" disabled={busy}>{cancelLabel}</Button>
          </DialogClose>
          <Button type="button" size="default" variant={destructive ? "danger" : "default"} disabled={busy} onClick={confirm}>
            {busy ? <Loader2 size={14} className="animate-spin" /> : null} {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
