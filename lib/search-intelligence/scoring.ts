export type WebsiteFindingSeverity = "critical" | "warning" | "info" | "passed";

export type WebsiteFindingInput = {
  type: string;
  severity: WebsiteFindingSeverity;
  url: string;
  title: string;
  evidence?: string;
  remediation?: string;
};

/**
 * A normalized score: repeated issues on a large site matter, but do not
 * automatically drive every multi-page site to zero.
 */
export function calculateWebsiteHealthScore(
  findings: WebsiteFindingInput[],
  pagesFound: number,
): number {
  if (pagesFound <= 0) return 0;

  const weights: Record<Exclude<WebsiteFindingSeverity, "passed">, number> = {
    critical: 18,
    warning: 7,
    info: 2,
  };

  const penalty = findings
    .filter((finding) => finding.severity !== "passed")
    .reduce((total, finding) => {
      const severity = finding.severity as Exclude<WebsiteFindingSeverity, "passed">;
      return total + weights[severity] / Math.sqrt(pagesFound);
    }, 0);

  return Math.max(0, Math.min(100, Math.round(100 - penalty)));
}

export type SearchPerformanceRow = {
  query: string;
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

export type SearchOpportunity = {
  type: "striking_distance" | "low_ctr" | "cannibalization";
  title: string;
  detail: string;
  impact: "high" | "medium";
  query: string;
  page?: string;
};

function expectedCtr(position: number): number {
  if (position <= 1) return 0.28;
  if (position <= 3) return 0.11;
  if (position <= 5) return 0.07;
  if (position <= 10) return 0.03;
  if (position <= 20) return 0.01;
  return 0.005;
}

export function deriveSearchOpportunities(
  rows: SearchPerformanceRow[],
): SearchOpportunity[] {
  const opportunities: SearchOpportunity[] = [];

  for (const row of rows) {
    if (row.position >= 4 && row.position <= 20 && row.impressions >= 20) {
      opportunities.push({
        type: "striking_distance",
        title: row.query,
        detail: `Position ${row.position.toFixed(1)} · ${row.impressions.toLocaleString()} impressions`,
        impact: row.impressions >= 200 ? "high" : "medium",
        query: row.query,
        page: row.page,
      });
    }

    const gap = expectedCtr(row.position) - row.ctr;
    if (row.impressions >= 50 && row.position <= 15 && gap > 0.02) {
      opportunities.push({
        type: "low_ctr",
        title: row.query,
        detail: `CTR ${(row.ctr * 100).toFixed(1)}% vs ${(expectedCtr(row.position) * 100).toFixed(1)}% expected`,
        impact: gap > 0.05 ? "high" : "medium",
        query: row.query,
        page: row.page,
      });
    }
  }

  const pagesByQuery = new Map<string, Set<string>>();
  for (const row of rows) {
    if (!row.page || row.impressions < 10) continue;
    const pages = pagesByQuery.get(row.query) ?? new Set<string>();
    pages.add(row.page);
    pagesByQuery.set(row.query, pages);
  }
  for (const [query, pages] of pagesByQuery) {
    if (pages.size < 2) continue;
    opportunities.push({
      type: "cannibalization",
      title: query,
      detail: `${pages.size} landing pages compete for this query`,
      impact: "medium",
      query,
    });
  }

  return opportunities.slice(0, 20);
}

