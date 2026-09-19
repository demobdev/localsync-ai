"use client";

import Link from "next/link";
import { MenuIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { LocalMapLogo } from "@/components/brand/localmap-logo";

const links = [
  { href: "/products/listings", label: "Listings" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/grader", label: "Free business check" },
];

export function MarketingHeader({ signedIn }: { signedIn: boolean }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  return (
    <header className="relative z-40 border-b border-white/10 bg-[#062f3a] text-white">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50 focus:rounded-lg focus:bg-white focus:p-3 focus:text-[#062f3a]">Skip to content</a>
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label="LocalMap home"><LocalMapLogo tone="light" /></Link>
        <nav aria-label="Main navigation" className="hidden items-center gap-6 text-sm lg:flex">
          {links.map((link) => <Link key={link.href} href={link.href} aria-current={pathname === link.href ? "page" : undefined} className="rounded-sm text-white/80 underline-offset-8 hover:text-white aria-[current=page]:underline">{link.label}</Link>)}
        </nav>
        <div className="flex items-center gap-3">
          {!signedIn && <Link href="/sign-in" className="hidden text-sm text-white/80 hover:text-white sm:inline-flex">Sign in</Link>}
          <Link href={signedIn ? "/dashboard" : "/sign-up"} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#bef264] px-4 text-sm font-semibold text-[#062f3a] hover:bg-[#d1fa87]">{signedIn ? "Open workspace" : "Get started"}</Link>
          <button type="button" aria-label={mobileOpen ? "Close menu" : "Open menu"} aria-expanded={mobileOpen} aria-controls="marketing-mobile-nav" onClick={() => setMobileOpen(!mobileOpen)} className="flex size-11 items-center justify-center rounded-xl border border-white/25 lg:hidden">
            {mobileOpen ? <XIcon className="size-5" /> : <MenuIcon className="size-5" />}
          </button>
        </div>
      </div>
      <nav id="marketing-mobile-nav" aria-label="Mobile navigation" hidden={!mobileOpen} className="border-t border-white/15 px-4 pb-4 lg:hidden">
        {links.map((link) => <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)} className="block rounded-lg px-3 py-3 text-sm text-white/90 hover:bg-white/10">{link.label}</Link>)}
        {!signedIn && <Link href="/sign-in" onClick={() => setMobileOpen(false)} className="block rounded-lg px-3 py-3 text-sm text-white/90 hover:bg-white/10">Sign in</Link>}
      </nav>
    </header>
  );
}
