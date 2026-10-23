import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AgentWorkspacePreview, type AgentPreviewHandoff } from "@/components/agent/agent-workspace-preview";
import { isStaffFulfillmentEnabled, requireLocalMapStaff } from "@/lib/auth/localmap-staff.server";
import { listAgentPreviewFulfillmentCases } from "@/lib/listings/staff-fulfillment.server";

export const metadata: Metadata = {
  title: "Agent workspace preview",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AgentWorkspacePreviewPage() {
  if (!isStaffFulfillmentEnabled()) notFound();
  try {
    await requireLocalMapStaff();
  } catch {
    notFound();
  }

  let queueStatus: "ready" | "empty" | "unavailable" = "unavailable";
  let handoffs: AgentPreviewHandoff[] = [];
  try {
    const cases = await listAgentPreviewFulfillmentCases();
    handoffs = cases.map((item) => ({
      publisherName: item.publisherName,
      staffStatus: item.staffReview.status,
      createdAt: item.createdAt,
      eventCount: item.events.length,
    }));
    queueStatus = handoffs.length ? "ready" : "empty";
  } catch {
    queueStatus = "unavailable";
  }

  return <AgentWorkspacePreview queueStatus={queueStatus} handoffs={handoffs} />;
}
