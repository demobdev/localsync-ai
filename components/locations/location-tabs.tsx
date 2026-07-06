"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

export function LocationTabs({ locationId }: { locationId: string }) {
  const pathname = usePathname();
  const base = `/dashboard/locations/${locationId}`;

  const tabs = [
    { label: "Profile", shortLabel: "Profile", href: base, exact: true },
    {
      label: "Listings & Audits",
      shortLabel: "Listings",
      href: `${base}/listings`,
      exact: false,
    },
    {
      label: "AI Visibility",
      shortLabel: "Visibility",
      href: `${base}/visibility`,
      exact: false,
    },
    {
      label: "Reviews",
      shortLabel: "Reviews",
      href: `${base}/reviews`,
      exact: false,
    },
  ];

  return (
    <div className="mb-6 -mx-1 overflow-x-auto px-1 pb-1">
      <div className="flex min-w-max gap-1 rounded-xl border bg-background p-1">
        {tabs.map((tab) => {
          const active = tab.exact
            ? pathname === tab.href
            : pathname.startsWith(tab.href);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition-colors sm:px-4",
                active
                  ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <span className="sm:hidden">{tab.shortLabel}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
