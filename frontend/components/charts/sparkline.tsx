/**
 * Smooth sparkline (design `charts.jsx` → Sparkline). Pure SVG; a Catmull-Rom→bezier smoothing
 * gives the soft trend curve. Decorative — `aria-hidden`, the surrounding card states the numbers.
 */
export function Sparkline({
  data,
  color = "var(--primary)",
  height = 38,
  width = 110,
}: {
  data: number[];
  color?: string;
  height?: number;
  width?: number;
}) {
  if (data.length < 2) {
    return <svg width={width} height={height} aria-hidden />;
  }
  const max = Math.max(...data);
  const min = Math.min(...data);
  const rng = max - min || 1;
  const step = width / (data.length - 1);
  const pts: [number, number][] = data.map((v, i) => [
    i * step,
    height - 3 - (height - 6) * ((v - min) / rng),
  ]);
  return (
    <svg width={width} height={height} style={{ display: "block", overflow: "visible" }} aria-hidden>
      <path d={smoothPath(pts)} fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

function smoothPath(pts: [number, number][]): string {
  if (pts.length < 2) return "";
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[Math.max(0, i - 1)];
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[i + 1];
    const [x3, y3] = pts[Math.min(pts.length - 1, i + 2)];
    const c1x = x1 + (x2 - x0) / 6;
    const c1y = y1 + (y2 - y0) / 6;
    const c2x = x2 - (x3 - x1) / 6;
    const c2y = y2 - (y3 - y1) / 6;
    d += ` C ${c1x} ${c1y} ${c2x} ${c2y} ${x2} ${y2}`;
  }
  return d;
}
