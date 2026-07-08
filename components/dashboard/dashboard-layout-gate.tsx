"use client";

import { usePathname } from "next/navigation";

import type { SwitcherBusiness } from "@/components/dashboard/business-switcher";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export function DashboardLayoutGate({
  children,
  setupIncomplete,
  isAgency,
  workspaceName,
  workspaceImageUrl,
  businesses,
}: {
  children: React.ReactNode;
  /** User has an org but no locations yet — onboarding only, no sidebar */
  setupIncomplete: boolean;
  isAgency: boolean;
  workspaceName: string;
  workspaceImageUrl?: string | null;
  businesses?: SwitcherBusiness[];
}) {
  const pathname = usePathname();
  const isOnboarding = pathname.startsWith("/dashboard/onboarding");

  // Onboarding stays full-page (logo + wizard) until the user explicitly opens
  // the dashboard — avoids shell/layout races right after workspace creation.
  if (isOnboarding) {
    return <>{children}</>;
  }

  if (setupIncomplete) {
    return <>{children}</>;
  }

  return (
    <DashboardShell
      isAgency={isAgency}
      workspaceName={workspaceName}
      workspaceImageUrl={workspaceImageUrl}
      businesses={businesses}
    >
      {children}
    </DashboardShell>
  );
}
