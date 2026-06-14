/** Event cover gradient presets a–f (from the design `views_common.jsx` COVERS). */
const COVERS: Record<string, [string, string]> = {
  a: ["#6d6bf5", "#8b5cf6"],
  b: ["#ec4899", "#f59e0b"],
  c: ["#14b8a6", "#3b82f6"],
  d: ["#22c55e", "#14b8a6"],
  e: ["#f59e0b", "#ec4899"],
  f: ["#3b82f6", "#6366f1"],
};

export const COVER_KEYS = Object.keys(COVERS);

export function coverGradient(key?: string | null): string {
  const [from, to] = COVERS[key ?? "a"] ?? COVERS.a;
  return `linear-gradient(135deg, ${from}, ${to})`;
}
