"use client";

import Link from "next/link";
import { ChevronDownIcon, MenuIcon } from "lucide-react";
import { useState } from "react";

import { LocalMapLogo } from "@/components/brand/localmap-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const PRODUCT_LINKS = [
  { href: "/products/listings", label: "Listings", note: "Sync & audits" },
  {
    href: "/products/reputation",
    label: "Reputation",
    note: "Reviews + AI drafts",
  },
  {
    href: "/products/ai-visibility",
    label: "AI Visibility",
    note: "Citation network",
  },
  {
    href: "/products/verticals",
    label: "Vertical Networks",
    note: "Industry add-ons",
  },
];

const MOBILE_NAV = [
  { href: "/grader", label: "Free visibility audit" },
  { href: "/platform/beacon", label: "Beacon agent" },
  { href: "/pricing", label: "Pricing" },
];

export function MarketingHeader({
  signedIn,
}: {
  signedIn: boolean;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="min-w-0">
          <LocalMapLogo />
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="sm" />}
            >
              Products
              <ChevronDownIcon className="size-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {PRODUCT_LINKS.map((item) => (
                <DropdownMenuItem
                  key={item.href}
                  render={<Link href={item.href} />}
                  className="flex-col items-start gap-0 py-1.5"
                >
                  <span className="font-medium">{item.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {item.note}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="ghost"
            size="sm"
            nativeButton={false}
            render={<Link href="/platform/beacon" />}
          >
            Beacon
          </Button>
          <Button
            variant="default"
            size="sm"
            nativeButton={false}
            render={<Link href="/grader" />}
          >
            Free audit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            nativeButton={false}
            render={<Link href="/pricing" />}
          >
            Pricing
          </Button>
        </nav>
        <div className="flex items-center gap-1 sm:gap-2">
          <ThemeToggle />
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              className="md:hidden"
              render={
                <Button variant="outline" size="icon-sm" aria-label="Open menu">
                  <MenuIcon className="size-4" />
                </Button>
              }
            />
            <SheetContent side="right" className="w-[min(100vw-2rem,320px)]">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <nav className="mt-4 flex flex-col gap-1">
                {MOBILE_NAV.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-muted"
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="my-2 border-t" />
                {PRODUCT_LINKS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-xl px-3 py-2 text-sm hover:bg-muted"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
          {signedIn ? (
            <Button nativeButton={false} render={<Link href="/dashboard" />}>
              Dashboard
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                nativeButton={false}
                render={<Link href="/sign-in" />}
                className="hidden sm:inline-flex"
              >
                Sign in
              </Button>
              <Button nativeButton={false} render={<Link href="/sign-up" />}>
                Get started
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
