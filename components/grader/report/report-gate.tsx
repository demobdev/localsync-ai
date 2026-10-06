"use client";

import { useCallback, useState, useSyncExternalStore } from "react";

import { BriefReveal } from "@/components/grader/brief-reveal";
import type { AuditReport } from "@/lib/grader/types";

import type { WorkspaceAction } from "./ctas";
import { GraderReport } from "./report-view";

const REVEAL_STORAGE_PREFIX = "grader-revealed:";

export type { WorkspaceAction };

function subscribeToReveals(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

// Match the server-rendered report until sessionStorage is available after hydration.
function getServerShowBrief() {
  return false;
}

/**
 * Plays the Visibility Brief once before the locked report when the user
 * lands on a complete audit URL without having seen the scan reveal
 * (email link, refresh, share).
 */
export function GraderReportGate({
  report,
  signedIn,
  dashboardHref,
  fixHref,
  workspaceAction = "signup",
  businessName,
}: {
  report: AuditReport;
  signedIn: boolean;
  dashboardHref: string;
  fixHref: string;
  workspaceAction?: WorkspaceAction;
  businessName?: string;
}) {
  const [completedReportId, setCompletedReportId] = useState<string | null>(null);
  // Guests stay locked until lead capture; signed-in reports are unlocked.
  const locked = !report.leadCaptured && !signedIn;
  const hasSnapshot = Boolean(
    report.scanSnapshot &&
      (report.scanSnapshot.place ||
        report.scanSnapshot.screenshotUrl ||
        (report.scanSnapshot.warnings?.length ?? 0) > 0),
  );

  const getShowBrief = useCallback(() => {
    if (!locked || !hasSnapshot || completedReportId === report.id) return false;
    try {
      return !sessionStorage.getItem(`${REVEAL_STORAGE_PREFIX}${report.id}`);
    } catch {
      // sessionStorage unavailable — show report directly.
      return false;
    }
  }, [locked, hasSnapshot, completedReportId, report.id]);
  const showBrief = useSyncExternalStore(
    subscribeToReveals,
    getShowBrief,
    getServerShowBrief,
  );

  const handleBriefComplete = useCallback(() => {
    try {
      sessionStorage.setItem(`${REVEAL_STORAGE_PREFIX}${report.id}`, "1");
    } catch {
      // ignore
    }
    setCompletedReportId(report.id);
  }, [report.id]);

  if (showBrief && report.scanSnapshot) {
    return (
      <BriefReveal
        evidence={report.scanSnapshot}
        preview={{
          businessName: report.businessName,
          totalScore: report.totalScore,
          grade: report.grade,
          failedChecks: report.failedChecks,
          totalChecks: report.totalChecks,
          estimatedMonthlyLoss: report.estimatedMonthlyLoss,
        }}
        domain={
          report.websiteUrl
            ? new URL(report.websiteUrl).hostname.replace(/^www\./, "")
            : null
        }
        onComplete={handleBriefComplete}
      />
    );
  }

  return (
    <GraderReport
      report={report}
      signedIn={signedIn}
      dashboardHref={dashboardHref}
      fixHref={fixHref}
      workspaceAction={workspaceAction}
      businessName={businessName ?? report.businessName}
    />
  );
}
