import { coverGradient } from "@/lib/covers";

/**
 * Event cover (design `EventCover`): a gradient (preset a–f) or uploaded image, with a soft
 * highlight overlay. Used on event cards and hero headers.
 */
export function EventCover({
  gradient,
  imageUrl,
  height = 132,
  radius = 14,
  className,
  children,
}: {
  gradient?: string | null;
  imageUrl?: string | null;
  height?: number;
  radius?: number;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={className}
      style={{
        height,
        borderRadius: radius,
        position: "relative",
        overflow: "hidden",
        background: imageUrl
          ? `#222 url("${imageUrl}") center/cover no-repeat`
          : coverGradient(gradient),
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(120px 90px at 78% 20%, rgba(255,255,255,.35), transparent 70%), repeating-linear-gradient(125deg, rgba(255,255,255,.10) 0 1px, transparent 1px 13px)",
        }}
      />
      {children}
    </div>
  );
}
