import Image from "next/image";

import { cn } from "@/lib/utils";

export function LocalMapLogo({
  className,
  compact = false,
  tone = "auto",
}: {
  className?: string;
  compact?: boolean;
  tone?: "auto" | "light" | "dark";
}) {
  if (compact) {
    return (
      <Image
        src="/brand/lmc-logo-square.png"
        alt="LocalMap"
        width={36}
        height={36}
        className={cn("size-9 object-contain", className)}
        priority
      />
    );
  }

  return (
    <span
      className={cn(
        "relative inline-block h-9 w-[148px] sm:w-[168px]",
        className,
      )}
    >
      <Image
        src="/brand/lmc-logo-long.png"
        alt="LocalMap.Co"
        fill
        className={cn("object-contain object-left", tone === "light" ? "hidden" : tone === "auto" ? "dark:hidden" : "")}
        sizes="168px"
        priority
      />
      <Image
        src="/brand/lmc-logo-long-white.png"
        alt="LocalMap.Co"
        fill
        className={cn("object-contain object-left", tone === "light" ? "" : tone === "auto" ? "hidden dark:block" : "hidden")}
        sizes="168px"
        priority
      />
    </span>
  );
}
