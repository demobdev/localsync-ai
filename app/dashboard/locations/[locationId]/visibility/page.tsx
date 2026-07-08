import { notFound } from "next/navigation";

import { listPendingFaqApprovalsAction } from "@/app/actions/approvals";
import { getLocationAction } from "@/app/actions/locations";
import { getLocationReviewSummaryAction } from "@/app/actions/reviews";
import { getLocationVisibilityAction } from "@/app/actions/visibility";
import { FaqApprovalPanel } from "@/components/locations/faq-approval-panel";
import { VisibilityPanel } from "@/components/locations/visibility-panel";
import { VisibilityScoreContext } from "@/components/locations/visibility-score-context";
import { getGraderAuditForLocation } from "@/lib/grader/location-audit-bridge";

export default async function LocationVisibilityPage({
  params,
}: {
  params: Promise<{ locationId: string }>;
}) {
  const { locationId } = await params;
  const [location, visibility, pendingFaqs, reviewSummary, linkedAudit] =
    await Promise.all([
      getLocationAction(locationId),
      getLocationVisibilityAction(locationId),
      listPendingFaqApprovalsAction(locationId),
      getLocationReviewSummaryAction(locationId),
      getGraderAuditForLocation(locationId).catch(() => null),
    ]);

  if (!location) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <FaqApprovalPanel
        locationId={locationId}
        approvedFaqs={location.profile.faqs ?? []}
        pendingDrafts={pendingFaqs}
      />
      <VisibilityScoreContext
        breakdown={visibility.score}
        reviewSummary={reviewSummary}
        linkedGraderAudit={
          linkedAudit
            ? {
                auditId: linkedAudit.id,
                score: linkedAudit.totalScore,
              }
            : null
        }
        locationId={locationId}
      />
      <VisibilityPanel data={visibility} />
    </div>
  );
}
