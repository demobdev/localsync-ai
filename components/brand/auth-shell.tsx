"use client";

import { LocalMapLogo } from "@/components/brand/localmap-logo";
import { ShaderPanel } from "@/components/brand/shader-panel";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

type AuthShellProps = {
  children: React.ReactNode;
  className?: string;
  /** Optional helper text above the auth form. */
  helper?: React.ReactNode;
};

export function AuthShell({ children, className, helper }: AuthShellProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <ShaderPanel
        scene="dusk"
        className="w-[42%] xl:w-[44%]"
        overlay="heavy"
        tagline={
          <div className="max-w-sm space-y-4 text-white">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-200/90">
              Get found online
            </p>
            <p className="text-2xl font-bold leading-tight tracking-tight text-balance">
              Your listings, your reputation, one workspace.
            </p>
            <p className="text-sm leading-relaxed text-white/70">
              Audit publishers, sync your master profile, and improve visibility
              with evidence you can share.
            </p>
          </div>
        }
      />

      <div className="flex min-h-screen flex-1 flex-col">
        <div className="flex items-center justify-between px-4 py-5 sm:px-6 lg:px-10">
          <LocalMapLogo />
          <ThemeToggle />
        </div>

        <div
          className={cn(
            "mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 pb-12 sm:px-6",
            className,
          )}
        >
          {helper}
          {children}
        </div>
      </div>
    </div>
  );
}
