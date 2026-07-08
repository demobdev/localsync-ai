import Link from "next/link";

import { computeProfileScore } from "@/lib/visibility/score";
import { SCORE_LABELS } from "@/lib/scores/labels";
import type { LocationProfileSnapshot } from "@/lib/types/location-profile";
import { cn } from "@/lib/utils";

export function ProfileCompletenessBar({
  profile,
  locationId,
}: {
  profile: LocationProfileSnapshot;
  locationId: string;
}) {
  const { profileScore, profileChecks } = computeProfileScore(profile);
  const passed = profileChecks.filter((check) => check.passed).length;
  const total = profileChecks.length;
  const pct = Math.round((passed / total) * 100);
  const missing = profileChecks.filter((check) => !check.passed);

  return (
    <div className="localmap-card-glow mb-6 rounded-xl border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Profile completeness</p>
          <p className="text-xs text-muted-foreground">
            {passed}/{total} fields · {profileScore}/50 toward {SCORE_LABELS.workspaceHealthShort.toLowerCase()}
          </p>
        </div>
        <Link
          href={`/dashboard/locations/${locationId}/visibility`}
          className="text-xs font-medium text-primary underline-offset-4 hover:underline"
        >
          View {SCORE_LABELS.workspaceHealthShort.toLowerCase()}
        </Link>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            pct >= 75 ? "bg-primary" : pct >= 50 ? "bg-chart-2" : "bg-destructive/80",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      {missing.length > 0 && missing.length <= 4 ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Still needed: {missing.map((check) => check.label.toLowerCase()).join(", ")}
        </p>
      ) : null}
    </div>
  );
}
