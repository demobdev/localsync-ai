"use client";

import Link from "next/link";

import { LocalMapLogo } from "@/components/brand/localmap-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

export function MarketingHeader({
  signedIn,
}: {
  signedIn: boolean;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="min-w-0">
          <LocalMapLogo />
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          <Button
            variant="ghost"
            size="sm"
            nativeButton={false}
            render={<Link href="/platform/beacon" />}
          >
            Beacon
          </Button>
          <Button
            variant="ghost"
            size="sm"
            nativeButton={false}
            render={<Link href="/scan" />}
          >
            Free scan
          </Button>
        </nav>
        <div className="flex items-center gap-1 sm:gap-2">
          <ThemeToggle />
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
