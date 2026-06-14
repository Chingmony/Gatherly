/** Minimal classnames joiner (the `cn` helper shadcn components expect). */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
