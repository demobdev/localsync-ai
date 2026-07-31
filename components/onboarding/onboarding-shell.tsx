"use client";

import { LocalMapLogo } from "@/components/brand/localmap-logo";
import { ShaderBand } from "@/components/brand/shader-band";
import { ShaderPanel } from "@/components/brand/shader-panel";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

type OnboardingShellProps = {
  children: React.ReactNode;
  className?: string;
  /** Wider content area for setup-complete states. */
  wide?: boolean;
};

export function OnboardingShell({
  children,
  className,
  wide = false,
}: OnboardingShellProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <ShaderPanel
        scene="water"
        className="w-[42%] xl:w-[44%]"
        overlay="heavy"
        tagline={
          <div className="max-w-sm space-y-4 text-white">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-200/90">
              LocalMap
            </p>
            <p className="text-2xl font-bold leading-tight tracking-tight text-balance">
              One profile. Every directory. Honest rails.
            </p>
            <p className="text-sm leading-relaxed text-white/70">
              Import from Google, audit your publishers, and fix what matters —
              with approval on every change.
            </p>
          </div>
        }
      />

      <div className="flex min-h-screen flex-1 flex-col">
        <ShaderBand scene="grain-pastel" height="sm" className="lg:hidden" fade />

        <div className="flex items-center justify-between px-4 py-5 sm:px-6 lg:px-10">
          <LocalMapLogo />
          <ThemeToggle />
        </div>

        <div
          className={cn(
            "mx-auto flex w-full flex-1 flex-col justify-center px-4 pb-12 sm:px-6 lg:px-10",
            wide ? "max-w-2xl" : "max-w-xl",
            className,
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
