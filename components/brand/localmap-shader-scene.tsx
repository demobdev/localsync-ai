"use client";

import {
  ShaderBackground,
} from "@/components/motion/shader-background";
import {
  LOCALMAP_SHADER_SCENES,
  type LocalMapShaderScene,
} from "@/lib/brand/shader-presets";
import { cn } from "@/lib/utils";

type LocalMapShaderSceneProps = {
  scene: LocalMapShaderScene;
  className?: string;
};

export function LocalMapShaderScene({
  scene,
  className,
}: LocalMapShaderSceneProps) {
  const preset = LOCALMAP_SHADER_SCENES[scene];

  return (
    <ShaderBackground
      {...preset}
      className={cn("h-full w-full", className)}
    />
  );
}
