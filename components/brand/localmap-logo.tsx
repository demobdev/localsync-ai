import Image from "next/image";

import { cn } from "@/lib/utils";

export function LocalMapLogo({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
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
        className="object-contain object-left dark:hidden"
        sizes="168px"
        priority
      />
      <Image
        src="/brand/lmc-logo-long-white.png"
        alt="LocalMap.Co"
        fill
        className="hidden object-contain object-left dark:block"
        sizes="168px"
        priority
      />
    </span>
  );
}
