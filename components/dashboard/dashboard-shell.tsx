"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import type { LucideIcon } from "lucide-react";
import { MenuIcon } from "lucide-react";
import { useState } from "react";

import { LocalMapLogo } from "@/components/brand/localmap-logo";
import { NavigationProgress } from "@/components/dashboard/navigation-progress";
import { WorkspaceSwitcher } from "@/components/dashboard/workspace-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { getDashboardNav } from "@/lib/dashboard/nav";
import { cn } from "@/lib/utils";

function NavLink({
  href,
  title,
  icon: Icon,
  onNavigate,
}: {
  href: string;
  title: string;
  icon: LucideIcon;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active =
    href === "/dashboard"
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <Icon className="size-4 shrink-0" />
      {title}
    </Link>
  );
}

function SidebarContent({
  onNavigate,
  isAgency,
  workspaceName,
}: {
  onNavigate?: () => void;
  isAgency: boolean;
  workspaceName: string;
}) {
  const navItems = getDashboardNav(isAgency);

  return (
    <>
      <div className="mb-6">
        <LocalMapLogo />
        <p className="mt-3 text-sm text-muted-foreground">
          {isAgency ? `${workspaceName} · Agency` : workspaceName}
        </p>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map((item) => (
          <NavLink key={item.href} {...item} onNavigate={onNavigate} />
        ))}
      </nav>

      <div className="mt-6 space-y-3 border-t pt-4">
        <WorkspaceSwitcher />
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">Account</span>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <UserButton />
          </div>
        </div>
      </div>
    </>
  );
}

export function DashboardShell({
  children,
  isAgency = false,
  workspaceName = "LocalSync workspace",
}: {
  children: React.ReactNode;
  isAgency?: boolean;
  workspaceName?: string;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-muted/20">
      <NavigationProgress />
      <div className="sticky top-0 z-30 flex items-center justify-between border-b bg-background/90 px-4 py-3 backdrop-blur-xl md:hidden">
        <LocalMapLogo compact />
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              render={
                <Button variant="outline" size="icon-sm" aria-label="Open menu">
                  <MenuIcon className="size-4" />
                </Button>
              }
            />
            <SheetContent side="left" className="w-[min(100vw-2rem,320px)] p-4">
              <SheetHeader className="sr-only">
                <SheetTitle>Navigation</SheetTitle>
              </SheetHeader>
              <div className="flex h-full flex-col pt-2">
                <SidebarContent
                  onNavigate={() => setMobileOpen(false)}
                  isAgency={isAgency}
                  workspaceName={workspaceName}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="mx-auto flex min-h-[calc(100vh-57px)] max-w-7xl gap-0 md:min-h-screen md:gap-6 md:p-6">
        <aside className="hidden w-64 shrink-0 md:block">
          <div className="sticky top-6 flex h-[calc(100vh-3rem)] flex-col rounded-2xl border bg-card p-4 localmap-card-glow">
            <SidebarContent isAgency={isAgency} workspaceName={workspaceName} />
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-5 md:px-0 md:py-0">
          {children}
        </main>
      </div>
    </div>
  );
}
