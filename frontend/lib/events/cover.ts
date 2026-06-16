/**
 * Resolve an event's `coverColor` to a gradient + accent for chips, cards, and hero
 * backgrounds. `coverColor` is either a named preset id (set by the Create Event form) or
 * a raw `#hex`. Shared so every surface renders the same event identity color.
 *
 * Mirrors the inline helpers in `explore-view.tsx` and the public register page — those
 * predate this util and can be migrated to it later.
 */

export interface CoverTheme {
  /** Gradient start. */
  from: string;
  /** Gradient end. */
  to: string;
  /** Solid accent (token-based) for pills/labels. */
  accent: string;
}

/** Cover preset id (from the Create Event form) → gradient + accent. */
export const COVER_THEMES: Record<string, CoverTheme> = {
  violet: { from: "#6366f1", to: "#8b5cf6", accent: "var(--violet)" },
  blue: { from: "#3b82f6", to: "#6366f1", accent: "var(--blue)" },
  teal: { from: "#14b8a6", to: "#06b6d4", accent: "var(--teal)" },
  green: { from: "#22c55e", to: "#16a34a", accent: "var(--green-600)" },
  orange: { from: "#f59e0b", to: "#f97316", accent: "var(--orange)" },
  amber: { from: "#f97316", to: "#ec4899", accent: "var(--pink)" },
  pink: { from: "#f43f5e", to: "#f59e0b", accent: "var(--pink)" },
};

export const DEFAULT_COVER_THEME: CoverTheme = {
  from: "#6366f1",
  to: "#8b5cf6",
  accent: "var(--violet)",
};

/** Resolve a `coverColor` (preset id, `#hex`, or null) to a usable theme. */
export function coverTheme(coverColor: string | null | undefined): CoverTheme {
  if (!coverColor) return DEFAULT_COVER_THEME;
  if (coverColor.startsWith("#")) {
    return { from: coverColor, to: coverColor, accent: "var(--primary-hex,#6366f1)" };
  }
  return COVER_THEMES[coverColor] ?? DEFAULT_COVER_THEME;
}

/** Convenience: a ready-to-use CSS gradient string for a cover. */
export function coverGradient(coverColor: string | null | undefined): string {
  const { from, to } = coverTheme(coverColor);
  return `linear-gradient(135deg, ${from}, ${to})`;
}
