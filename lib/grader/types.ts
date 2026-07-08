/**
 * Shared types for the LocalSync Grader (Local Visibility & Revenue Leak Audit).
 *
 * The report is jsonb-heavy: everything below is stored on `grader_audits`
 * as jsonb columns so the report renders from a single row.
 */

export type AuditCategory = "search" | "guest" | "listings";

export type CheckStatus = "pass" | "fail" | "warn" | "unknown";

export type CheckEffort = "quick" | "medium" | "high";

export type AuditCheck = {
  id: string;
  category: AuditCategory;
  /** Display group inside a section, e.g. "Domain", "Metadata", "Schema". */
  group: string;
  label: string;
  status: CheckStatus;
  /** What we found (shown in the expanded row). */
  detail: string;
  /** How to fix it (feeds the fix plan). */
  recommendation?: string;
  impact: "high" | "medium" | "low";
  /** Contribution to the category score (guest weights sum to 40, listings to 20). */
  weight: number;
  /** Rough effort bucket used to build the fix plan. */
  effort: CheckEffort;
};

export type MapResult = {
  rank: number;
  name: string;
  rating: number;
  reviewCount: number;
  isYou: boolean;
  /** Optional coordinates — present when the audit has a real business location. */
  lat?: number | null;
  lng?: number | null;
};

export type OrganicResult = {
  rank: number;
  domain: string;
  title: string;
  type: "directory" | "social" | "competitor" | "you";
  isYou: boolean;
};

export type KeywordResult = {
  keyword: string;
  monthlyVolume: number | null;
  /** null = unranked (not in top 20). */
  yourMapRank: number | null;
  yourOrganicRank: number | null;
  /** Name of whoever holds #1 in the map pack. */
  topCompetitor: string | null;
  mapResults: MapResult[];
  organicResults: OrganicResult[];
  /** "sample" = generated placeholder ranks; "provider" = real SERP data. */
  source: "sample" | "provider";
};

export type Competitor = {
  name: string;
  rating: number;
  reviewCount: number;
  /** Average local rank across audited keywords (1 = best). */
  rank: number;
};

export type PageSpeedMetricId = "LCP" | "FCP" | "INP" | "TTFB" | "CLS";

export type PageSpeedMetric = {
  id: PageSpeedMetricId;
  label: string;
  displayValue: string;
  rating: "good" | "needs-improvement" | "poor" | "unknown";
  /** 0-100 position along the good→poor scale for the percentile line. */
  percentile: number | null;
};

export type PageSpeedData = {
  fetched: boolean;
  overall: "pass" | "fail" | "unknown";
  /** Lighthouse performance score 0-100, when available. */
  performanceScore: number | null;
  metrics: PageSpeedMetric[];
};

export type GbpFieldStatus = "pass" | "fail" | "warn" | "pending";

export type GbpField = {
  id: string;
  label: string;
  status: GbpFieldStatus;
  detail?: string;
};

export type GbpProfile = {
  rating: number | null;
  reviewCount: number | null;
  profileFields: GbpField[];
  reviewFields: GbpField[];
  /** True while GBP data comes from sample generation (no Places API connected). */
  isSample: boolean;
  /** True when rating/reviewCount came from the real Places record. */
  ratingIsReal?: boolean;
};

export type ExtractedBusiness = {
  businessName: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  hoursSummary: string | null;
  services: string[];
  description: string | null;
  industry: string;
  phoneVisible: boolean;
  addressVisible: boolean;
  hoursVisible: boolean;
  hasCallToAction: boolean;
  hasTestimonials: boolean;
  /** Present when the audit started from a Google Places selection. */
  latitude?: number | null;
  longitude?: number | null;
  placeId?: string | null;
};

export type CategoryScores = {
  /** x / 40 */
  search: number;
  /** x / 40 */
  guest: number;
  /** x / 20 */
  listings: number;
};

export const CATEGORY_MAX: CategoryScores = {
  search: 40,
  guest: 40,
  listings: 20,
};

export type AuditGrade = "Poor" | "Fair" | "Good" | "Excellent";

export type FixPlan = {
  quickWins: AuditCheck[];
  medium: AuditCheck[];
  highImpact: AuditCheck[];
};

/** Fully materialized report passed from the server page to the report view. */
export type AuditReport = {
  id: string;
  url: string;
  /** null = business has no website (itself the biggest leak). */
  websiteUrl: string | null;
  businessName: string;
  city: string | null;
  state: string | null;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
  industry: string;
  status: string;
  totalScore: number;
  grade: AuditGrade;
  categoryScores: CategoryScores;
  totalChecks: number;
  failedChecks: number;
  estimatedMonthlyLoss: number;
  checks: AuditCheck[];
  keywords: KeywordResult[];
  competitors: Competitor[];
  pageSpeed: PageSpeedData;
  gbpProfile: GbpProfile;
  leadCaptured: boolean;
  createdAt: string;
};
