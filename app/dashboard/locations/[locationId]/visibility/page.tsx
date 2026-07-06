import { notFound } from "next/navigation";

import { listPendingFaqApprovalsAction } from "@/app/actions/approvals";
import { getLocationAction } from "@/app/actions/locations";
import { getLocationVisibilityAction } from "@/app/actions/visibility";
import { FaqApprovalPanel } from "@/components/locations/faq-approval-panel";
import { VisibilityPanel } from "@/components/locations/visibility-panel";

export default async function LocationVisibilityPage({
  params,
}: {
  params: Promise<{ locationId: string }>;
}) {
  const { locationId } = await params;
  const [location, visibility, pendingFaqs] = await Promise.all([
    getLocationAction(locationId),
    getLocationVisibilityAction(locationId),
    listPendingFaqApprovalsAction(locationId),
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
      <VisibilityPanel data={visibility} />
    </div>
  );
}
