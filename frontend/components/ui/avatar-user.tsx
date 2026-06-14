import { cn } from "@/lib/cn";

interface AvatarUserProps {
  name?: string;
  initials?: string;
  imageUrl?: string;
  hue?: number;
  size?: number;
  ring?: boolean;
  className?: string;
}

export function AvatarUser({ name, initials, imageUrl, hue = 230, size = 38, ring = false, className }: AvatarUserProps) {
  const ini =
    initials ||
    (name
      ? name
          .split(" ")
          .map((w) => w[0])
          .slice(0, 2)
          .join("")
      : "?");

  const avatar = imageUrl ? (
    <div
      className={cn("flex-shrink-0 overflow-hidden", className)}
      style={{ width: size, height: size, borderRadius: "50%" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imageUrl} alt={name ?? "avatar"} width={size} height={size} style={{ width: size, height: size, objectFit: "cover" }} />
    </div>
  ) : (
    <div
      className={cn("flex items-center justify-center flex-shrink-0 font-extrabold text-white select-none", className)}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: `linear-gradient(135deg, hsl(${hue} 72% 62%), hsl(${hue + 28} 70% 52%))`,
        fontSize: size * 0.36,
        boxShadow: "inset 0 1px 1px rgba(255,255,255,.4)",
      }}
    >
      {ini}
    </div>
  );

  if (!ring) return avatar;

  return (
    <div
      style={{
        width: size + 4,
        height: size + 4,
        borderRadius: "50%",
        padding: 2,
        background: "linear-gradient(135deg, var(--primary-hex, #6366f1), var(--green, #22c55e))",
        flexShrink: 0,
      }}
    >
      {avatar}
    </div>
  );
}
