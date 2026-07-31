import type { ShaderBackgroundProps } from "@/components/motion/shader-background";

/** LocalMap brand palette for shader scenes (teal + warm gold, not clinical cyan). */
export const SHADER_COLORS = {
  teal: "#0d9488",
  tealDeep: "#0f766e",
  tealLight: "#5eead4",
  tealMist: "#ccfbf1",
  gold: "#d4a853",
  goldLight: "#f5d78e",
  slate: "#0f172a",
  slateSoft: "#1e293b",
  cream: "#faf7ef",
  warmWhite: "#fffbf5",
} as const;

export type LocalMapShaderScene =
  | "aurora"
  | "grain-sunset"
  | "grain-pastel"
  | "grid"
  | "orbit"
  | "dusk"
  | "ember"
  | "waves"
  | "water";

export const LOCALMAP_SHADER_SCENES: Record<
  LocalMapShaderScene,
  ShaderBackgroundProps
> = {
  /** Flowing teal + gold mesh — hero accents, CTA bands */
  aurora: {
    variant: "mesh-gradient",
    colors: [
      SHADER_COLORS.tealDeep,
      SHADER_COLORS.teal,
      SHADER_COLORS.tealLight,
      SHADER_COLORS.gold,
      SHADER_COLORS.slate,
    ],
    speed: 0.35,
    distortion: 0.55,
    swirl: 0.25,
    grainOverlay: 0.12,
  },
  /** Warm grain wash — decorative space fillers between sections */
  "grain-sunset": {
    variant: "grain-gradient",
    colors: [
      SHADER_COLORS.gold,
      SHADER_COLORS.goldLight,
      SHADER_COLORS.teal,
      SHADER_COLORS.tealDeep,
    ],
    colorBack: SHADER_COLORS.warmWhite,
    speed: 0.2,
    shape: "blob",
    noise: 0.35,
    softness: 0.75,
    intensity: 0.45,
  },
  /** Soft pastel grain — onboarding & auth backdrops */
  "grain-pastel": {
    variant: "grain-gradient",
    colors: [
      SHADER_COLORS.tealMist,
      SHADER_COLORS.tealLight,
      SHADER_COLORS.goldLight,
    ],
    colorBack: SHADER_COLORS.cream,
    speed: 0.15,
    shape: "ripple",
    noise: 0.25,
    softness: 0.85,
    intensity: 0.3,
  },
  /** Dot grid — technical / data sections */
  grid: {
    variant: "dot-grid",
    colorBack: SHADER_COLORS.slate,
    colorFill: SHADER_COLORS.teal,
    colorStroke: SHADER_COLORS.tealLight,
    size: 2.5,
    gapX: 28,
    gapY: 28,
    opacityRange: 0.35,
  },
  /** Orbiting dots — distribution / network feel */
  orbit: {
    variant: "dot-orbit",
    colorBack: SHADER_COLORS.slate,
    colors: [
      SHADER_COLORS.teal,
      SHADER_COLORS.tealLight,
      SHADER_COLORS.gold,
      SHADER_COLORS.goldLight,
    ],
    speed: 0.4,
    size: 0.35,
    spreading: 0.55,
    stepsPerColor: 2,
  },
  /** Static dusk mesh — subtle auth backgrounds */
  dusk: {
    variant: "static-mesh-gradient",
    colors: [
      SHADER_COLORS.slateSoft,
      SHADER_COLORS.tealDeep,
      SHADER_COLORS.teal,
      SHADER_COLORS.gold,
    ],
    grainOverlay: 0.08,
  },
  /** Warm radial ember — heritage / proof sections */
  ember: {
    variant: "static-radial-gradient",
    colorBack: SHADER_COLORS.slate,
    colors: [
      SHADER_COLORS.gold,
      SHADER_COLORS.teal,
      SHADER_COLORS.tealDeep,
      SHADER_COLORS.slateSoft,
    ],
    radius: 1.4,
    mixing: 0.7,
    distortion: 0.2,
    grainOverlay: 0.1,
  },
  /** Flowing waves — distribution / sync metaphor */
  waves: {
    variant: "waves",
    colorBack: SHADER_COLORS.slate,
    colorFront: SHADER_COLORS.teal,
    frequency: 1.2,
    amplitude: 0.55,
    shape: 1.5,
    spacing: 0.6,
    softness: 0.7,
  },
  /** Calm water caustics — onboarding side panel */
  water: {
    variant: "water",
    colorBack: SHADER_COLORS.tealDeep,
    colorHighlight: SHADER_COLORS.tealLight,
    speed: 0.25,
    caustic: 0.55,
    waves: 0.35,
    highlights: 0.4,
    size: 1.2,
  },
};
