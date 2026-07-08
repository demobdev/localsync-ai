/**
 * Pure scoring logic for the LocalSync Grader.
 *
 * MVP model (100 pts total):
 * - Search Results   40  (map pack 20, organic 10, keyword coverage 5, competitor gap 5)
 * - Guest Experience 40  (weighted checks: speed/CWV 10, CTA 8, NAP 8, mobile 6, trust 5, UX 3)
 * - Local Listings   20  (weighted checks: GBP completeness 8, NAP consistency 4, reviews 4, misc 4)
 *
 * Categories are keyed so this can expand to the 6-category model
 * (Search 25 / GBP 20 / SEO 20 / Guest 15 / Reputation 10 / Consistency 10)
 * without a UI rewrite — the UI only reads CategoryScores + CATEGORY_MAX.
 */

import { getIndustryProfile } from "./industry";
import {
  CATEGORY_MAX,
  type AuditCheck,
  type AuditGrade,
  type CategoryScores,
  type FixPlan,
  type KeywordResult,
} from "./types";

export function gradeForScore(score: number): AuditGrade {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 50) return "Fair";
  return "Poor";
}

function mapRankCredit(rank: number | null): number {
  if (rank === null) return 0;
  if (rank === 1) return 1;
  if (rank <= 3) return 0.7;
  if (rank <= 10) return 0.3;
  return 0.1;
}

function organicRankCredit(rank: number | null): number {
  if (rank === null) return 0;
  if (rank <= 3) return 1;
  if (rank <= 10) return 0.5;
  return 0.2;
}

/** Search Results score out of 40, derived from keyword rankings. */
export function scoreSearch(keywords: KeywordResult[]): number {
  if (keywords.length === 0) return 0;

  const mapAvg =
    keywords.reduce((sum, k) => sum + mapRankCredit(k.yourMapRank), 0) /
    keywords.length;
  const organicAvg =
    keywords.reduce((sum, k) => sum + organicRankCredit(k.yourOrganicRank), 0) /
    keywords.length;
  const coverage =
    keywords.filter((k) => k.yourMapRank !== null || k.yourOrganicRank !== null)
      .length / keywords.length;
  // Competitor gap: fraction of keywords where you beat (or tie) the map pack leader.
  const gapWins =
    keywords.filter((k) => k.yourMapRank !== null && k.yourMapRank <= 1).length /
    keywords.length;

  return Math.round(mapAvg * 20 + organicAvg * 10 + coverage * 5 + gapWins * 5);
}

function checkCredit(check: AuditCheck): number {
  switch (check.status) {
    case "pass":
      return check.weight;
    case "warn":
      return check.weight * 0.5;
    case "unknown":
      // Don't punish missing data as hard as a confirmed failure.
      return check.weight * 0.5;
    case "fail":
      return 0;
  }
}

/** Weighted check score for a category, capped at its max. */
export function scoreWeightedCategory(
  checks: AuditCheck[],
  category: "guest" | "listings",
): number {
  const categoryChecks = checks.filter((c) => c.category === category);
  const earned = categoryChecks.reduce((sum, c) => sum + checkCredit(c), 0);
  return Math.min(CATEGORY_MAX[category], Math.round(earned));
}

export function scoreAudit(input: {
  checks: AuditCheck[];
  keywords: KeywordResult[];
}): {
  categoryScores: CategoryScores;
  totalScore: number;
  grade: AuditGrade;
  totalChecks: number;
  failedChecks: number;
} {
  const categoryScores: CategoryScores = {
    search: scoreSearch(input.keywords),
    guest: scoreWeightedCategory(input.checks, "guest"),
    listings: scoreWeightedCategory(input.checks, "listings"),
  };
  const totalScore = Math.min(
    100,
    categoryScores.search + categoryScores.guest + categoryScores.listings,
  );

  return {
    categoryScores,
    totalScore,
    grade: gradeForScore(totalScore),
    totalChecks: input.checks.length,
    failedChecks: input.checks.filter((c) => c.status === "fail").length,
  };
}

/**
 * Explainable revenue-leak estimate:
 * monthly_searches × missed_visibility_rate × click_rate × conversion_rate × avg_customer_value
 *
 * - monthly_searches: per-industry estimate of local search volume across the keyword set
 * - missed_visibility_rate: 1 - (search score / 40) — how much of that demand you don't show up for
 * - click_rate: ~35% of local searches click a top result (map pack dominance)
 * - conversion_rate: ~8% of clicks become a customer for a local business
 * - avg_customer_value: per-industry (restaurant low, roofing/legal high)
 */
export function estimateMonthlyLoss(input: {
  industry: string;
  searchScore: number;
}): number {
  const profile = getIndustryProfile(input.industry);
  const missedVisibilityRate = Math.max(
    0,
    1 - input.searchScore / CATEGORY_MAX.search,
  );
  const CLICK_RATE = 0.35;
  const CONVERSION_RATE = 0.08;

  const raw =
    profile.estimatedMonthlySearches *
    missedVisibilityRate *
    CLICK_RATE *
    CONVERSION_RATE *
    profile.avgCustomerValue;

  return roundFriendly(raw);
}

/** Round to a friendly display number (nearest 50 below 1k, nearest 100 above). */
export function roundFriendly(value: number): number {
  if (value <= 0) return 0;
  if (value < 1000) return Math.max(50, Math.round(value / 50) * 50);
  return Math.round(value / 100) * 100;
}

/** Top red-alert problems for the summary card, worst first. */
export function deriveTopProblems(input: {
  checks: AuditCheck[];
  keywords: KeywordResult[];
}): string[] {
  const problems: string[] = [];

  const unrankedMap = input.keywords.filter((k) => k.yourMapRank === null).length;
  if (unrankedMap > 0 && input.keywords.length > 0) {
    problems.push(
      unrankedMap === input.keywords.length
        ? "Missing from the Google Map Pack for every search we checked"
        : `Missing from the Google Map Pack for ${unrankedMap} of ${input.keywords.length} local searches`,
    );
  }

  const unrankedOrganic = input.keywords.filter(
    (k) => k.yourOrganicRank === null,
  ).length;
  if (unrankedOrganic >= Math.ceil(input.keywords.length / 2)) {
    problems.push("Not ranking in organic Google results for most local searches");
  }

  const failedHigh = input.checks
    .filter((c) => c.status === "fail" && c.impact === "high")
    .slice(0, 4)
    .map((c) => c.label);
  problems.push(...failedHigh);

  if (problems.length < 4) {
    problems.push(
      ...input.checks
        .filter((c) => c.status === "fail" && c.impact === "medium")
        .slice(0, 4 - problems.length)
        .map((c) => c.label),
    );
  }

  return problems.slice(0, 6);
}

/** Buckets failed checks into a prioritized fix plan. */
export function deriveFixPlan(checks: AuditCheck[]): FixPlan {
  const failed = checks.filter(
    (c) => c.status === "fail" || c.status === "warn",
  );
  const byImpact = (a: AuditCheck, b: AuditCheck) => {
    const order = { high: 0, medium: 1, low: 2 } as const;
    return order[a.impact] - order[b.impact];
  };

  return {
    quickWins: failed.filter((c) => c.effort === "quick").sort(byImpact),
    medium: failed.filter((c) => c.effort === "medium").sort(byImpact),
    highImpact: failed.filter((c) => c.effort === "high").sort(byImpact),
  };
}
