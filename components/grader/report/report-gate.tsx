"use client";

import { useCallback, useEffect, useState } from "react";

import { BriefReveal } from "@/components/grader/brief-reveal";
import type { AuditReport } from "@/lib/grader/types";

import { GraderReport } from "./report-view";

const REVEAL_STORAGE_PREFIX = "grader-revealed:";

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
}: {
  report: AuditReport;
  signedIn: boolean;
  dashboardHref: string;
  fixHref: string;
}) {
  const [showBrief, setShowBrief] = useState(false);
  const locked = !report.leadCaptured;
  const hasSnapshot = Boolean(
    report.scanSnapshot &&
      (report.scanSnapshot.place ||
        report.scanSnapshot.screenshotUrl ||
        (report.scanSnapshot.warnings?.length ?? 0) > 0),
  );

  useEffect(() => {
    if (!locked || !hasSnapshot) return;
    try {
      if (sessionStorage.getItem(`${REVEAL_STORAGE_PREFIX}${report.id}`)) return;
      setShowBrief(true);
    } catch {
      // sessionStorage unavailable — show report directly.
    }
  }, [locked, hasSnapshot, report.id]);

  const handleBriefComplete = useCallback(() => {
    try {
      sessionStorage.setItem(`${REVEAL_STORAGE_PREFIX}${report.id}`, "1");
    } catch {
      // ignore
    }
    setShowBrief(false);
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
    />
  );
}
