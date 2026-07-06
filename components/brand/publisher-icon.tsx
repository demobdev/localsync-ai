import { getPublisherBrand } from "@/lib/publishers/brand-icons";

import { BrandIcon, BrandIconBadge } from "./brand-icon";

export function PublisherIcon({
  slug,
  size = 24,
  badge = false,
  showCheck = false,
  className,
}: {
  slug: string;
  size?: number;
  badge?: boolean;
  showCheck?: boolean;
  className?: string;
}) {
  const brand = getPublisherBrand(slug);

  if (badge) {
    return (
      <BrandIconBadge
        brand={brand}
        size={size}
        showCheck={showCheck}
        className={className}
      />
    );
  }

  return <BrandIcon brand={brand} size={size} className={className} />;
}
