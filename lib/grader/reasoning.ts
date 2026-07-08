/**
 * v2 reasoning layer for the progressive scan (brief §8): review-theme
 * grouping, streamed narration lines, and the photo benchmark.
 *
 * Everything here is failure-safe by design — AI call errors or timeouts
 * return null/empty and the pipeline continues; the scan UI degrades to the
 * evidence-only version when these fields are absent.
 */

import { generateObject } from "ai";
import { z } from "zod";

import type { SiteSignals } from "./site-analysis";
import type { ExtractedBusiness } from "./types";

const THEME_TIMEOUT_MS = 15_000;

const reviewThemesSchema = z.object({
  themes: z
    .array(
      z.object({
        theme: z
          .string()
          .describe("Short theme label, 1-2 words, e.g. 'Service', 'Atmosphere'"),
        rating: z
          .number()
          .min(1)
          .max(5)
          .describe("1-5 sentiment rating for this theme across the reviews"),
      }),
    )
    .min(3)
    .max(5)
    .describe("3-5 themes customers mention, most-praised first"),
  summary: z
    .string()
    .describe(
      "ONE punchy second-person sentence summarizing review sentiment, e.g. 'Customers consistently praise food quality but mention slow service during peak hours.'",
    ),
});

export type ReviewThemesResult = {
  themes: Array<{ theme: string; rating: number }>;
  summary: string;
};

/** One small Gemini call over the review snippets; null on any failure. */
export async function generateReviewThemes(input: {
  model: string;
  businessName: string;
  reviews: Array<{ author: string; rating: number; text: string }>;
}): Promise<ReviewThemesResult | null> {
  if (input.reviews.length < 2) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), THEME_TIMEOUT_MS);

  try {
    const { object } = await generateObject({
      model: input.model,
      schema: reviewThemesSchema,
      abortSignal: controller.signal,
      prompt: [
        `Group these Google reviews of "${input.businessName}" into 3-5 themes`,
        "(e.g. Food, Service, Atmosphere, Value, Parking) with a 1-5 sentiment",
        "rating each, and write one confident second-person summary sentence",
        "addressed to the business owner.",
        "",
        ...input.reviews.map(
          (review) => `- (${review.rating}★) ${review.text}`,
        ),
      ].join("\n"),
    });

    return {
      themes: object.themes.map((t) => ({
        theme: t.theme,
        rating: Math.round(t.rating),
      })),
      summary: object.summary,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** The 1-2 most damning on-site findings, in the brief's consultant voice. */
export function deriveSignalNarration(input: {
  signals: SiteSignals;
  extracted: ExtractedBusiness;
}): string[] {
  const { signals, extracted } = input;
  const lines: string[] = [];

  if (signals.noindex) {
    lines.push(
      "Your homepage tells Google not to index it — you're invisible by request.",
    );
  }
  if (!signals.hasLocalBusinessSchema) {
    lines.push(
      "AI detected missing LocalBusiness schema — Google is guessing your name, hours, and location.",
    );
  }
  if (!extracted.hasCallToAction) {
    lines.push(
      "No clear call-to-action above the fold — visitors don't know what to do next.",
    );
  }
  if (!signals.hasOpenGraph) {
    lines.push(
      "Your links share as bare URLs — no preview card when customers text or post them.",
    );
  }
  if (!signals.hasViewportMeta) {
    lines.push(
      "Your site isn't mobile-optimized — where most local searches happen.",
    );
  }

  return lines.slice(0, 2);
}

/** Deterministic PRNG seed (same family as the sample rank provider). */
function seededFraction(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000) / 1000;
}

/**
 * Photo benchmark. `yours` is the real GBP photo count we carry; the
 * competitor average is SAMPLE data (seeded per domain, 25-60) until a rank
 * provider that returns competitor photo counts is wired — same caveat as
 * the sample SERP ranks.
 */
export function buildPhotoBenchmark(input: {
  seed: string;
  yours: number;
}): { yours: number; competitorAvg: number } {
  const competitorAvg = 25 + Math.round(seededFraction(input.seed) * 35);
  return { yours: input.yours, competitorAvg };
}

export function photoBenchmarkNarration(benchmark: {
  yours: number;
  competitorAvg: number;
}): string {
  if (benchmark.yours < benchmark.competitorAvg) {
    return `Only ${benchmark.yours} photo${benchmark.yours === 1 ? "" : "s"} found — top competitors average ${benchmark.competitorAvg}.`;
  }
  return `${benchmark.yours} photos found — ahead of the local average of ${benchmark.competitorAvg}.`;
}
