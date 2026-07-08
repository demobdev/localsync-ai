import type {
  GraderAuditTier,
  GraderOperatingModel,
} from "@/lib/grader/types";
import type { ScanPrefill } from "@/lib/scan/leads";

/**
 * Unified prefill passed into the onboarding wizard — sourced from either a
 * free scan (`?scan=`) or a grader audit (`?auditId=`). Audit wins when both
 * params are present.
 */
export type SetupPrefill = {
  source: "scan" | "audit";
  scanId?: string;
  auditId?: string;
  url: string | null;
  businessName: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  score: number;
  /** Category pack slug (grader industry) to preselect, when known. */
  categorySlug: string | null;
  /** From grader — tailors onboarding copy and checklist. */
  operatingModel?: GraderOperatingModel;
  auditTier?: GraderAuditTier;
  gbpLinked?: boolean;
  serviceAreaCities?: string | null;
};

export function prefillFromScan(scan: ScanPrefill): SetupPrefill {
  return {
    source: "scan",
    scanId: scan.scanId,
    url: scan.url,
    businessName: scan.businessName,
    phone: scan.phone,
    city: scan.city,
    state: scan.state,
    score: scan.score,
    categorySlug: null,
  };
}
