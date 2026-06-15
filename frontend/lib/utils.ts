import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Classnames joiner used by the shadcn/ui components — clsx for conditionals, tailwind-merge so a
 * caller's `className` override wins over a base utility of the same property. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
