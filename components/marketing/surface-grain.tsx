import { cn } from "@/lib/utils";

/** Subtle film grain / paper noise. Pointer-events none, sits above backgrounds. */
export function SurfaceGrain({
  className,
  opacity = 0.45,
}: {
  className?: string;
  opacity?: number;
}) {
  return (
    <div
      aria-hidden
      className={cn("localmap-grain pointer-events-none absolute inset-0", className)}
      style={{ opacity }}
    />
  );
}
