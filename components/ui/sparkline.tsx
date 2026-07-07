import { cn } from "@/lib/utils";

/** Minimal dependency-free SVG sparkline with area fill. */
export function Sparkline({
  points,
  max = 100,
  min = 0,
  className,
  height = 48,
  strokeWidth = 2,
}: {
  points: number[];
  max?: number;
  min?: number;
  className?: string;
  height?: number;
  strokeWidth?: number;
}) {
  if (points.length === 0) {
    return null;
  }

  const width = 200;
  const range = Math.max(max - min, 1);
  const padding = strokeWidth;
  const usableHeight = height - padding * 2;

  const coords =
    points.length === 1
      ? // A single point renders as a short flat segment.
        [0, width].map((x) => ({
          x,
          y:
            padding +
            usableHeight -
            ((points[0]! - min) / range) * usableHeight,
        }))
      : points.map((value, index) => ({
          x: (index / (points.length - 1)) * width,
          y:
            padding + usableHeight - ((value - min) / range) * usableHeight,
        }));

  const linePath = coords
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`)
    .join(" ");

  const areaPath = `${linePath} L${width},${height} L0,${height} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={cn("w-full", className)}
      style={{ height }}
      aria-hidden
    >
      <path d={areaPath} className="fill-primary/10" />
      <path
        d={linePath}
        className="stroke-primary"
        fill="none"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
