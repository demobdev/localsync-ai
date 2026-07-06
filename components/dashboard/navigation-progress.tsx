"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

export function NavigationProgress() {
  const pathname = usePathname();
  const [targetPath, setTargetPath] = useState<string | null>(null);
  const active = targetPath !== null && targetPath !== pathname;

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      const anchor = target.closest("a");
      if (!anchor?.href) {
        return;
      }

      if (
        anchor.target === "_blank" ||
        anchor.hasAttribute("download") ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      try {
        const next = new URL(anchor.href);
        const current = new URL(window.location.href);

        if (
          next.origin === current.origin &&
          next.pathname !== current.pathname
        ) {
          setTargetPath(next.pathname);
        }
      } catch {
        // ignore malformed href
      }
    }

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden bg-transparent"
    >
      <div
        className={cn(
          "h-full bg-primary transition-all duration-300 ease-out",
          active ? "w-full opacity-100" : "w-0 opacity-0",
        )}
      />
    </div>
  );
}
