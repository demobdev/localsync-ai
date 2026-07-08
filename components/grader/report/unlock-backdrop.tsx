"use client";

import type { AuditReport } from "@/lib/grader/types";
import { gradeColor, ScoreRing } from "./primitives";

/**
 * Blurred visual proof behind the unlock modal — keeps scan evidence visible
 * so the gate feels like "your report exists" rather than a generic form.
 */
export function UnlockBackdrop({
  report,
}: {
  report: AuditReport;
}) {
  const snapshot = report.scanSnapshot;
  const color = gradeColor(report.grade);
  const photos = snapshot?.place?.photoUrls?.slice(0, 3) ?? [];
  const screenshot = snapshot?.screenshotUrl;

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#faf7ef]">
      <div className="absolute inset-0 flex items-center justify-center p-8 blur-xl">
        <div className="grid w-full max-w-3xl gap-3 opacity-90">
          {screenshot && (
            // eslint-disable-next-line @next/next/no-img-element -- Firecrawl screenshot
            <img
              src={screenshot}
              alt=""
              className="aspect-[16/9] w-full rounded-2xl object-cover object-top"
            />
          )}
          {photos.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {photos.map((url) => (
                // eslint-disable-next-line @next/next/no-img-element -- Places media URL
                <img
                  key={url}
                  src={url}
                  alt=""
                  className="aspect-square rounded-xl object-cover"
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-[3px]" />

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-lg font-bold text-white drop-shadow-sm sm:text-xl">
          {report.businessName}
        </p>
        <ScoreRing score={report.totalScore} color={color} size={140} strokeWidth={12}>
          <span className="text-4xl font-bold text-white drop-shadow-sm">
            {report.totalScore}
          </span>
          <span className="text-xs text-white/80">out of 100</span>
        </ScoreRing>
        <p className="max-w-sm text-sm text-white/90 drop-shadow-sm">
          {report.failedChecks} visibility leaks found · ~$
          {report.estimatedMonthlyLoss.toLocaleString()}/mo at risk
        </p>
      </div>
    </div>
  );
}
