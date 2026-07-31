"use client";

import { LocalMapShaderScene } from "@/components/brand/localmap-shader-scene";
import type { LocalMapShaderScene as LocalMapShaderSceneName } from "@/lib/brand/shader-presets";
import { cn } from "@/lib/utils";

type ShaderBandProps = {
  scene: LocalMapShaderSceneName;
  /** Band height — defaults to a medium decorative strip. */
  height?: "sm" | "md" | "lg" | "xl";
  className?: string;
  /** Optional content layered on top of the shader. */
  children?: React.ReactNode;
  /** Fade edges into page background. */
  fade?: boolean;
};

const HEIGHTS = {
  sm: "h-24 sm:h-32",
  md: "h-40 sm:h-52",
  lg: "h-56 sm:h-72",
  xl: "h-72 sm:h-96",
} as const;

/**
 * Decorative horizontal shader strip — space filler between marketing sections.
 * Works with or without overlaid content.
 */
export function ShaderBand({
  scene,
  height = "md",
  className,
  children,
  fade = true,
}: ShaderBandProps) {
  return (
    <div
      className={cn(
        "relative w-full overflow-hidden",
        HEIGHTS[height],
        className,
      )}
      aria-hidden={!children}
    >
      <div className="absolute inset-0">
        <LocalMapShaderScene scene={scene} />
      </div>
      {fade ? (
        <>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-background to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-background to-transparent" />
        </>
      ) : null}
      {children ? (
        <div className="relative flex h-full items-center justify-center px-4">
          {children}
        </div>
      ) : null}
    </div>
  );
}
