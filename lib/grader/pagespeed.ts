/**
 * Google PageSpeed Insights (works keyless at low volume). Called server-side
 * with a hard timeout; on any failure we return a graceful "unknown" shape so
 * the report still renders with "Not enough data" states.
 */

import type { PageSpeedData, PageSpeedMetric, PageSpeedMetricId } from "./types";

const PSI_ENDPOINT =
  "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";
const PSI_TIMEOUT_MS = 35_000;

const METRIC_LABELS: Record<PageSpeedMetricId, string> = {
  LCP: "Largest Contentful Paint",
  FCP: "First Contentful Paint",
  INP: "Interaction to Next Paint",
  TTFB: "Time to First Byte",
  CLS: "Cumulative Layout Shift",
};

type CruxMetric = {
  percentile?: number;
  category?: "FAST" | "AVERAGE" | "SLOW";
};

function unknownMetrics(): PageSpeedMetric[] {
  return (Object.keys(METRIC_LABELS) as PageSpeedMetricId[]).map((id) => ({
    id,
    label: METRIC_LABELS[id],
    displayValue: "Not enough data",
    rating: "unknown" as const,
    percentile: null,
  }));
}

export function emptyPageSpeed(): PageSpeedData {
  return {
    fetched: false,
    overall: "unknown",
    performanceScore: null,
    metrics: unknownMetrics(),
  };
}

function cruxRating(
  category: CruxMetric["category"],
): PageSpeedMetric["rating"] {
  if (category === "FAST") return "good";
  if (category === "AVERAGE") return "needs-improvement";
  if (category === "SLOW") return "poor";
  return "unknown";
}

function formatMs(ms: number): string {
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)} s` : `${Math.round(ms)} ms`;
}

/** Position along the good→poor bar for the percentile indicator line. */
function scalePosition(value: number, good: number, poor: number): number {
  const t = (value - good) / (poor - good);
  // Map: within "good" = 0-33, between = 33-66, beyond poor = 66-100.
  if (t <= 0) return Math.max(4, 33 * (value / good));
  if (t >= 1) return Math.min(96, 66 + 30 * Math.min(1, t - 1));
  return 33 + t * 33;
}

export async function fetchPageSpeed(url: string): Promise<PageSpeedData> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PSI_TIMEOUT_MS);

  try {
    const query = new URLSearchParams({
      url,
      strategy: "mobile",
      category: "performance",
    });
    // Keyless works at low volume but shares an anonymous quota; a free
    // PAGESPEED_API_KEY raises it to 25k/day.
    if (process.env.PAGESPEED_API_KEY) {
      query.set("key", process.env.PAGESPEED_API_KEY);
    }
    const response = await fetch(`${PSI_ENDPOINT}?${query.toString()}`, {
      signal: controller.signal,
    });
    if (!response.ok) return emptyPageSpeed();

    const payload = (await response.json()) as {
      loadingExperience?: {
        overall_category?: "FAST" | "AVERAGE" | "SLOW";
        metrics?: Record<string, CruxMetric>;
      };
      lighthouseResult?: {
        categories?: { performance?: { score?: number } };
        audits?: Record<
          string,
          { numericValue?: number; displayValue?: string; score?: number }
        >;
      };
    };

    const crux = payload.loadingExperience?.metrics ?? {};
    const audits = payload.lighthouseResult?.audits ?? {};
    const performanceScore =
      payload.lighthouseResult?.categories?.performance?.score != null
        ? Math.round(payload.lighthouseResult.categories.performance.score * 100)
        : null;

    const metrics: PageSpeedMetric[] = [];

    const cruxKeyById: Record<PageSpeedMetricId, string> = {
      LCP: "LARGEST_CONTENTFUL_PAINT_MS",
      FCP: "FIRST_CONTENTFUL_PAINT_MS",
      INP: "INTERACTION_TO_NEXT_PAINT",
      TTFB: "EXPERIMENTAL_TIME_TO_FIRST_BYTE",
      CLS: "CUMULATIVE_LAYOUT_SHIFT_SCORE",
    };
    const lighthouseKeyById: Partial<Record<PageSpeedMetricId, string>> = {
      LCP: "largest-contentful-paint",
      FCP: "first-contentful-paint",
      TTFB: "server-response-time",
      CLS: "cumulative-layout-shift",
    };
    const thresholds: Record<PageSpeedMetricId, [number, number]> = {
      LCP: [2500, 4000],
      FCP: [1800, 3000],
      INP: [200, 500],
      TTFB: [800, 1800],
      CLS: [0.1, 0.25],
    };

    for (const id of Object.keys(METRIC_LABELS) as PageSpeedMetricId[]) {
      const cruxMetric = crux[cruxKeyById[id]];
      const [good, poor] = thresholds[id];

      if (cruxMetric?.percentile != null) {
        const raw =
          id === "CLS" ? cruxMetric.percentile / 100 : cruxMetric.percentile;
        metrics.push({
          id,
          label: METRIC_LABELS[id],
          displayValue: id === "CLS" ? raw.toFixed(2) : formatMs(raw),
          rating: cruxRating(cruxMetric.category),
          percentile: scalePosition(raw, good, poor),
        });
        continue;
      }

      const lighthouseKey = lighthouseKeyById[id];
      const audit = lighthouseKey ? audits[lighthouseKey] : undefined;
      if (audit?.numericValue != null) {
        const raw = audit.numericValue;
        const rating: PageSpeedMetric["rating"] =
          raw <= good ? "good" : raw <= poor ? "needs-improvement" : "poor";
        metrics.push({
          id,
          label: METRIC_LABELS[id],
          displayValue:
            id === "CLS" ? raw.toFixed(2) : (audit.displayValue ?? formatMs(raw)),
          rating,
          percentile: scalePosition(raw, good, poor),
        });
        continue;
      }

      metrics.push({
        id,
        label: METRIC_LABELS[id],
        displayValue: "Not enough data",
        rating: "unknown",
        percentile: null,
      });
    }

    const rated = metrics.filter((m) => m.rating !== "unknown");
    const overall: PageSpeedData["overall"] =
      rated.length === 0
        ? "unknown"
        : rated.every((m) => m.rating === "good")
          ? "pass"
          : "fail";

    return { fetched: true, overall, performanceScore, metrics };
  } catch {
    return emptyPageSpeed();
  } finally {
    clearTimeout(timer);
  }
}
