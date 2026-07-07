"use client";

import { useRouter, usePathname } from "next/navigation";
import {
  Building2Icon,
  CheckIcon,
  ChevronsUpDownIcon,
  PlusIcon,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type SwitcherBusiness = {
  id: string;
  name: string;
  city: string | null;
};

export function BusinessSwitcher({
  businesses,
}: {
  businesses: SwitcherBusiness[];
}) {
  const router = useRouter();
  const pathname = usePathname();

  if (businesses.length === 0) {
    return null;
  }

  const activeId = businesses.find((business) =>
    pathname.startsWith(`/dashboard/locations/${business.id}`),
  )?.id;
  const active = businesses.find((business) => business.id === activeId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "mt-2 flex w-full items-center justify-between gap-2 rounded-xl border bg-muted/30 px-3 py-2 text-left text-sm transition-colors hover:bg-muted/60",
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          <Building2Icon className="size-4 shrink-0 text-primary" />
          <span className="truncate font-medium">
            {active ? active.name : "All businesses"}
          </span>
        </span>
        <ChevronsUpDownIcon className="size-4 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64">
        <DropdownMenuItem
          onClick={() => router.push("/dashboard")}
          className="gap-2"
        >
          <span className="flex-1">All businesses</span>
          {!active ? <CheckIcon className="size-4" /> : null}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {businesses.map((business) => (
          <DropdownMenuItem
            key={business.id}
            onClick={() => router.push(`/dashboard/locations/${business.id}`)}
            className="gap-2"
          >
            <span className="min-w-0 flex-1">
              <span className="block truncate">{business.name}</span>
              {business.city ? (
                <span className="block truncate text-xs text-muted-foreground">
                  {business.city}
                </span>
              ) : null}
            </span>
            {business.id === activeId ? (
              <CheckIcon className="size-4 shrink-0" />
            ) : null}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => router.push("/dashboard/onboarding?add=1")}
          className="gap-2 text-primary"
        >
          <PlusIcon className="size-4" />
          Add a business
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
