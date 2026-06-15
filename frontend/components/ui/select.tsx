"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

/* ============================================================================
 * shadcn/ui Select — built on @radix-ui/react-select, styled with the Gatherly
 * design tokens (so light/dark follow the theme automatically). Two layers:
 *   1. The composable primitives (SelectRoot, SelectTrigger, SelectContent, …)
 *      — the standard shadcn surface, for bespoke menus.
 *   2. An ergonomic <Select options …> wrapper used across the app. It centralises
 *      the one Radix footgun — items may not have an empty-string value — by mapping
 *      "" ⇄ a private sentinel, so a selectable "" option (Unassigned, Any, …) and the
 *      placeholder-when-empty case both keep working.
 * ========================================================================== */

const SelectRoot = SelectPrimitive.Root;
const SelectGroup = SelectPrimitive.Group;
const SelectValue = SelectPrimitive.Value;

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> & { variant?: "default" | "bare" }
>(({ className, children, variant = "default", ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "group flex w-full items-center justify-between gap-2 text-left text-[14px] transition-colors outline-none",
      "disabled:cursor-not-allowed disabled:opacity-60 data-[placeholder]:text-[var(--t3)]",
      variant === "bare"
        ? "font-semibold"
        : cn(
            "rounded-[var(--rs)] border border-[var(--bo)] bg-[var(--ca)] px-3.5 py-2.5 text-[var(--t1)]",
            "focus-visible:ring-2 focus-visible:ring-[var(--ac)] focus-visible:border-[var(--ac)]",
            "aria-[invalid=true]:border-[var(--ac-2)]",
          ),
      className,
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown
        size={16}
        aria-hidden
        className="shrink-0 text-[var(--t3)] transition-transform duration-200 group-data-[state=open]:rotate-180"
      />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn("flex cursor-default items-center justify-center py-1 text-[var(--t3)]", className)}
    {...props}
  >
    <ChevronUp size={14} aria-hidden />
  </SelectPrimitive.ScrollUpButton>
));
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn("flex cursor-default items-center justify-center py-1 text-[var(--t3)]", className)}
    {...props}
  >
    <ChevronDown size={14} aria-hidden />
  </SelectPrimitive.ScrollDownButton>
));
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName;

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      position={position}
      sideOffset={6}
      className={cn(
        "relative z-[60] max-h-64 min-w-[8rem] overflow-hidden rounded-[var(--rs)] border border-[var(--bo)] bg-[var(--ca)] p-1 shadow-[var(--sh2)]",
        // Radix mount/unmount + side transitions
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        "data-[side=bottom]:slide-in-from-top-1 data-[side=top]:slide-in-from-bottom-1",
        position === "popper" && "w-[var(--radix-select-trigger-width)]",
        className,
      )}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport className="p-0">{children}</SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn("px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--t3)]", className)}
    {...props}
  />
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item> & { hint?: string }
>(({ className, children, hint, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-pointer select-none items-center gap-2 rounded-[calc(var(--rs)-4px)] py-2 pl-8 pr-2.5 text-[13.5px] text-[var(--t1)] outline-none",
      "data-[highlighted]:bg-[var(--sidebar-hover)] data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className,
    )}
    {...props}
  >
    <span className="absolute left-2.5 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check size={15} aria-hidden className="text-[var(--ac)]" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    {hint && <span className="ml-auto shrink-0 pl-2 text-[12px] text-[var(--t3)]">{hint}</span>}
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator ref={ref} className={cn("-mx-1 my-1 h-px bg-[var(--bo)]", className)} {...props} />
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

/* -------------------------------------------------------------------------- */
/* Ergonomic options-driven wrapper                                            */
/* -------------------------------------------------------------------------- */

export interface SelectOption {
  value: string;
  label: string;
  hint?: string;
  disabled?: boolean;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  /** `default` = bordered field; `bare` = transparent trigger for embedding in a custom bar. */
  variant?: "default" | "bare";
  /** Extra classes on the trigger. */
  className?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "aria-invalid"?: boolean;
}

// Radix forbids an empty-string item value, so "" round-trips through this private sentinel.
const EMPTY = "__gatherly_empty__";
const toRadix = (v: string) => (v === "" ? EMPTY : v);
const fromRadix = (v: string) => (v === EMPTY ? "" : v);

/**
 * Accessible dropdown — a styled trigger plus a Radix listbox popover, replacing the native
 * <select> so it matches the design tokens in light/dark. Radix handles keyboard (type-ahead,
 * Up/Down/Home/End, Enter/Esc), focus restore, outside-click and collision flipping; reduced
 * motion is honoured globally in `globals.css`.
 */
export function Select({
  value,
  onChange,
  options,
  placeholder = "Select…",
  disabled,
  id,
  variant = "default",
  className,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledby,
  "aria-invalid": ariaInvalid,
}: SelectProps) {
  return (
    <SelectRoot value={toRadix(value)} onValueChange={(v) => onChange(fromRadix(v))} disabled={disabled}>
      <SelectTrigger
        id={id}
        variant={variant}
        className={className}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledby}
        aria-invalid={ariaInvalid}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt, i) => (
          <SelectItem key={opt.value || `opt-${i}`} value={toRadix(opt.value)} hint={opt.hint} disabled={opt.disabled}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </SelectRoot>
  );
}

export {
  SelectRoot,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
};
