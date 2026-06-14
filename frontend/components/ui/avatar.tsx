/**
 * Hue-based gradient-initials avatar (design `ui.jsx` → Avatar). No image assets — the hue is
 * derived from the name so the same person is always the same colour. Decorative gradient;
 * the initials carry the meaning.
 */
export function Avatar({
  name,
  initials,
  hue,
  size = 38,
  ring = false,
}: {
  name?: string;
  initials?: string;
  hue?: number;
  size?: number;
  ring?: boolean;
}) {
  const ini =
    initials ||
    (name
      ? name
          .trim()
          .split(/\s+/)
          .map((w) => w[0])
          .slice(0, 2)
          .join("")
          .toUpperCase()
      : "?");
  const h = hue ?? hueFromString(name ?? ini);
  const inner = (
    <div
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        flexShrink: 0,
        background: `linear-gradient(135deg, hsl(${h} 72% 62%), hsl(${h + 28} 70% 52%))`,
        color: "var(--on-primary)",
        fontWeight: 800,
        fontSize: size * 0.36,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "inset 0 1px 1px rgba(255,255,255,.4)",
      }}
    >
      {ini}
    </div>
  );
  if (!ring) return inner;
  return (
    <div
      style={{
        width: size + 4,
        height: size + 4,
        padding: 2,
        borderRadius: "50%",
        background: "linear-gradient(135deg, var(--primary), var(--green))",
        display: "flex",
      }}
    >
      {inner}
    </div>
  );
}

/** Stable hue in [0,360) from a string so avatars are deterministic across renders. */
export function hueFromString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
  return h;
}
