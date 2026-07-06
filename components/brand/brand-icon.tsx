import type { SimpleIcon } from "simple-icons";

import { cn } from "@/lib/utils";

import type { BrandDisplay } from "@/lib/publishers/brand-icons";

export function BrandIcon({
  brand,
  size = 24,
  className,
  colored = true,
}: {
  brand: BrandDisplay | { icon?: SimpleIcon; fallbackClass?: string; fallbackLetter?: string; label: string };
  size?: number;
  className?: string;
  /** Use brand hex color on white/dark circle backgrounds */
  colored?: boolean;
}) {
  if (brand.icon) {
    return (
      <svg
        role="img"
        viewBox="0 0 24 24"
        width={size}
        height={size}
        aria-label={brand.label}
        className={cn("shrink-0", className)}
        style={colored ? { fill: `#${brand.icon.hex}` } : undefined}
      >
        <title>{brand.label}</title>
        <path d={brand.icon.path} />
      </svg>
    );
  }

  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold",
        brand.fallbackClass ?? "bg-muted text-muted-foreground",
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {brand.fallbackLetter ?? "?"}
    </span>
  );
}

export function BrandIconBadge({
  brand,
  size = 40,
  showCheck = false,
  className,
}: {
  brand: BrandDisplay;
  size?: number;
  showCheck?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center rounded-full border bg-background shadow-sm shadow-black/5",
        className,
      )}
      style={{ width: size + 8, height: size + 8 }}
      title={brand.label}
    >
      <BrandIcon brand={brand} size={size * 0.55} />
      {showCheck ? (
        <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
          ✓
        </span>
      ) : null}
    </div>
  );
}
