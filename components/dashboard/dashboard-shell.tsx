"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  OrganizationSwitcher,
  UserButton,
} from "@clerk/nextjs";
import type { LucideIcon } from "lucide-react";

import { dashboardNav } from "@/lib/dashboard/nav";
import { cn } from "@/lib/utils";

function NavLink({
  href,
  title,
  icon: Icon,
}: {
  href: string;
  title: string;
  icon: LucideIcon;
}) {
  const pathname = usePathname();
  const active =
    href === "/dashboard"
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <Icon className="size-4" />
      {title}
    </Link>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto flex min-h-screen max-w-7xl gap-6 p-4 md:p-6">
        <aside className="hidden w-64 shrink-0 md:block">
          <div className="sticky top-6 flex h-[calc(100vh-3rem)] flex-col rounded-xl border bg-background p-4 shadow-sm">
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                LocalSync AI
              </p>
              <h1 className="mt-1 text-lg font-semibold">
                Local presence control
              </h1>
            </div>

            <nav className="flex flex-1 flex-col gap-1">
              {dashboardNav.map((item) => (
                <NavLink key={item.href} {...item} />
              ))}
            </nav>

            <div className="mt-6 space-y-3 border-t pt-4">
              <OrganizationSwitcher
                hidePersonal
                afterCreateOrganizationUrl="/dashboard"
                afterSelectOrganizationUrl="/dashboard"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Account</span>
                <UserButton />
              </div>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
