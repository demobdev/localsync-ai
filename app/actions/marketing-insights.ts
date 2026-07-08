"use server";

import { requireOrgAuth } from "@/lib/auth/org";
import {
  resolveRecentMarketingInsight,
  type RecentMarketingInsight,
} from "@/lib/grader/dashboard";

export async function getRecentMarketingInsightAction(input?: {
  highlightAuditId?: string | null;
  highlightScanId?: string | null;
}): Promise<RecentMarketingInsight | null> {
  const { orgId } = await requireOrgAuth();
  return resolveRecentMarketingInsight({
    organizationId: orgId,
    highlightAuditId: input?.highlightAuditId,
    highlightScanId: input?.highlightScanId,
  });
}
