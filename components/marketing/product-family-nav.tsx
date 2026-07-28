import Link from "next/link";
import {
  BotIcon,
  Layers3Icon,
  MapPinnedIcon,
  MessageSquareMoreIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

const PRODUCTS = [
  {
    slug: "listings",
    label: "Listings",
    detail: "Control the facts",
    href: "/products/listings",
    icon: MapPinnedIcon,
  },
  {
    slug: "reputation",
    label: "Reputation",
    detail: "Earn the trust",
    href: "/products/reputation",
    icon: MessageSquareMoreIcon,
  },
  {
    slug: "ai-visibility",
    label: "AI visibility",
    detail: "Become citable",
    href: "/products/ai-visibility",
    icon: BotIcon,
  },
  {
    slug: "verticals",
    label: "Category packs",
    detail: "Win your niche",
    href: "/products/verticals",
    icon: Layers3Icon,
  },
] as const;

export function ProductFamilyNav({ active }: { active: string }) {
  return (
    <nav
      aria-label="LocalMap products"
      className="border-b border-white/10 bg-[#071c2c] text-white"
    >
      <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 py-2.5 [-ms-overflow-style:none] [scrollbar-width:none] sm:px-6 [&::-webkit-scrollbar]:hidden">
        {PRODUCTS.map((product) => {
          const selected = product.slug === active;
          const Icon = product.icon;

          return (
            <Link
              key={product.slug}
              href={product.href}
              aria-current={selected ? "page" : undefined}
              className={cn(
                "group flex min-w-max items-center gap-2.5 rounded-xl border px-3 py-2 transition-colors",
                selected
                  ? "border-[#6ee7d8]/50 bg-[#0f766e]/35"
                  : "border-transparent text-white/65 hover:border-white/10 hover:bg-white/5 hover:text-white",
              )}
            >
              <span
                className={cn(
                  "grid size-8 place-items-center rounded-lg",
                  selected ? "bg-[#6ee7d8] text-[#062b31]" : "bg-white/8",
                )}
              >
                <Icon className="size-4" />
              </span>
              <span>
                <span className="block text-sm font-semibold leading-none">
                  {product.label}
                </span>
                <span className="mt-1 block text-[11px] leading-none text-white/45">
                  {product.detail}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
