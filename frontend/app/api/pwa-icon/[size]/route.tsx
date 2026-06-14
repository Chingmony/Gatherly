import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ size: string }> },
) {
  const { size } = await params;
  const px = Number(size) || 192;
  const fontSize = Math.round(px * 0.45);
  const radius = Math.round(px * 0.22);

  return new ImageResponse(
    (
      <div
        style={{
          width: px,
          height: px,
          background: "#6366f1",
          borderRadius: radius,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            color: "#fff",
            fontSize,
            fontWeight: 800,
            fontFamily: "sans-serif",
          }}
        >
          G
        </span>
      </div>
    ),
    { width: px, height: px },
  );
}
