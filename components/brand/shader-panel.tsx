"use client";

import { LocalMapShaderScene } from "@/components/brand/localmap-shader-scene";
import type { LocalMapShaderScene as LocalMapShaderSceneName } from "@/lib/brand/shader-presets";
import { cn } from "@/lib/utils";

type ShaderPanelProps = {
  scene: LocalMapShaderSceneName;
  className?: string;
  /** Tagline or brand copy overlaid on the shader. */
  tagline?: React.ReactNode;
  /** Dark overlay for text legibility. */
  overlay?: "none" | "light" | "medium" | "heavy";
};

const OVERLAYS = {
  none: "",
  light: "bg-background/20",
  medium: "bg-background/40 dark:bg-background/50",
  heavy: "bg-gradient-to-br from-slate-950/70 via-slate-950/50 to-slate-950/30",
} as const;

/**
 * Full-height shader panel for split layouts (onboarding, auth).
 */
export function ShaderPanel({
  scene,
  className,
  tagline,
  overlay = "heavy",
}: ShaderPanelProps) {
  return (
    <div
      className={cn(
        "relative hidden overflow-hidden lg:block",
        className,
      )}
      aria-hidden={!tagline}
    >
      <div className="absolute inset-0">
        <LocalMapShaderScene scene={scene} />
      </div>
      {overlay !== "none" ? (
        <div className={cn("absolute inset-0", OVERLAYS[overlay])} />
      ) : null}
      {tagline ? (
        <div className="relative flex h-full flex-col justify-end p-10 xl:p-14">
          {tagline}
        </div>
      ) : null}
    </div>
  );
}
