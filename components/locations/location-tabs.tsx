"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

export function LocationTabs({ locationId }: { locationId: string }) {
  const pathname = usePathname();
  const base = `/dashboard/locations/${locationId}`;

  const tabs = [
    { label: "Profile", href: base, exact: true },
    { label: "Listings & Audits", href: `${base}/listings`, exact: false },
  ];

  return (
    <div className="mb-6 flex gap-1 rounded-lg border bg-background p-1">
      {tabs.map((tab) => {
        const active = tab.exact
          ? pathname === tab.href
          : pathname.startsWith(tab.href);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "rounded-md px-4 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
