import { cn } from "@/lib/cn";

interface LogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
}

export function Logo({ size = 30, showText = true, className }: LogoProps) {
  const textSize = Math.round(size * 0.74);
  const gradId = `logo-grad-${size}`;

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id={gradId} x1="6" y1="3" x2="34" y2="37" gradientUnits="userSpaceOnUse">
            <stop stopColor="#6d6bf5" />
            <stop offset="1" stopColor="#5048e5" />
          </linearGradient>
        </defs>
        <path
          d="M20 2.2l13.4 7.74a4 4 0 0 1 2 3.46v13.2a4 4 0 0 1-2 3.46L20 37.8l-13.4-7.74a4 4 0 0 1-2-3.46V13.4a4 4 0 0 1 2-3.46z"
          fill={`url(#${gradId})`}
        />
        <circle cx="20" cy="15.2" r="3.1" fill="#fff" />
        <circle cx="13.7" cy="24.5" r="2.5" fill="#fff" fillOpacity="0.85" />
        <circle cx="26.3" cy="24.5" r="2.5" fill="#fff" fillOpacity="0.85" />
        <path
          d="M20 17.6v3.2M17.7 22.6l-2 1M22.3 22.6l2 1"
          stroke="#fff"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeOpacity="0.7"
        />
      </svg>
      {showText && (
        <span
          style={{ color: "var(--text-strong)", fontSize: textSize, fontWeight: 800, letterSpacing: "-0.02em" }}
        >
          Gatherly
        </span>
      )}
    </div>
  );
}
