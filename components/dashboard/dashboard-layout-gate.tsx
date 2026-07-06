"use client";

import { usePathname } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export function DashboardLayoutGate({
  children,
  setupIncomplete,
  isAgency,
  workspaceName,
}: {
  children: React.ReactNode;
  /** User has an org but no locations yet — onboarding only, no sidebar */
  setupIncomplete: boolean;
  isAgency: boolean;
  workspaceName: string;
}) {
  const pathname = usePathname();
  const isOnboarding = pathname.startsWith("/dashboard/onboarding");

  if (setupIncomplete && isOnboarding) {
    return <>{children}</>;
  }

  return (
    <DashboardShell isAgency={isAgency} workspaceName={workspaceName}>
      {children}
    </DashboardShell>
  );
}
