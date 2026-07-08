"use server";

import { generateObject } from "ai";
import { eq } from "drizzle-orm";
import { after } from "next/server";
import { z } from "zod";

import { getDb } from "@/db";
import { graderAudits, graderLeads } from "@/db/schema";
import { scrapeUrlFull } from "@/lib/firecrawl";
import {
  applyNoWebsiteOverrides,
  buildAuditChecks,
} from "@/lib/grader/checks";
import { buildSampleGbpProfile } from "@/lib/grader/gbp";
import { INDUSTRY_SLUGS } from "@/lib/grader/industry";
import { emptyPageSpeed, fetchPageSpeed } from "@/lib/grader/pagespeed";
import {
  mapPlaceTypeToIndustry,
  parseCityState,
  type GraderPlaceInput,
} from "@/lib/grader/place";
import {
  deriveCompetitors,
  generateKeywords,
  getRankProvider,
} from "@/lib/grader/rank-provider";
import {
  buildPhotoBenchmark,
  deriveSignalNarration,
  generateReviewThemes,
  photoBenchmarkNarration,
} from "@/lib/grader/reasoning";
import { estimateMonthlyLoss, scoreAudit } from "@/lib/grader/scoring";
import { analyzeSite } from "@/lib/grader/site-analysis";
import type {
  ExtractedBusiness,
  GraderPlaceEvidence,
  GraderProgress,
  GraderProgressStage,
  PageSpeedData,
} from "@/lib/grader/types";

const GRADER_MODEL =
  process.env.AUDIT_EXTRACTION_MODEL ?? "google/gemini-2.5-flash";

// Tiny reasoning calls (review themes) use the lite model: ~1s vs ~10s.
const REASONING_MODEL =
  process.env.GRADER_REASONING_MODEL ?? "google/gemini-2.5-flash-lite";

const graderExtractionSchema = z.object({
  businessName: z.string().nullable().describe("Business name shown on the site"),
  phone: z.string().nullable().describe("Primary phone number"),
  address: z.string().nullable().describe("Street address if shown"),
  city: z.string().nullable(),
  state: z.string().nullable().describe("Two-letter state/region code if shown"),
  hoursSummary: z.string().nullable().describe("Business hours as free text if shown"),
  services: z
    .array(z.string())
    .describe("Services or product categories mentioned (max 8)"),
  description: z
    .string()
    .nullable()
    .describe("One-sentence summary of what the business does"),
  industry: z
    .enum(INDUSTRY_SLUGS as [string, ...string[]])
    .describe("Closest matching industry category for this business"),
  phoneVisible: z
    .boolean()
    .describe("Whether a phone number is prominently visible in the content"),
  addressVisible: z
    .boolean()
    .describe("Whether an address or service area is visible in the content"),
  hoursVisible: z.boolean().describe("Whether business hours are visible"),
  hasCallToAction: z
    .boolean()
    .describe(
      "Whether the top of the page has a clear call to action (call now, book, order, get a quote, schedule)",
    ),
  hasTestimonials: z
    .boolean()
    .describe("Whether customer reviews or testimonials appear in the content"),
});

function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) throw new Error("Enter your business website URL");

  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  let parsed: URL;
  try {
    parsed = new URL(withProtocol);
  } catch {
    throw new Error("That doesn't look like a valid URL");
  }
  if (!parsed.hostname.includes(".")) {
    throw new Error("That doesn't look like a valid website");
  }
  return parsed.toString();
}

/** Signals shape for businesses without a website — everything absent. */
function noWebsiteSignals(): Awaited<ReturnType<typeof analyzeSite>> {
  return {
    https: false,
    customDomain: false,
    domainMatchesName: null,
    h1Text: null,
    title: null,
    metaDescription: null,
    hasOpenGraph: false,
    hasJsonLd: false,
    hasLocalBusinessSchema: false,
    hasCanonical: false,
    noindex: false,
    hasViewportMeta: false,
    hasTelLink: false,
    hasFavicon: false,
    robotsTxtOk: null,
    sitemapOk: null,
  };
}

/* ── Progressive scan plumbing ─────────────────────────────────────────── */

/** Place evidence for the scan experience, capped per the contract. */
function buildPlaceEvidence(place: GraderPlaceInput): GraderPlaceEvidence {
  return {
    name: place.name,
    rating: place.rating ?? null,
    reviewCount: place.reviewCount ?? null,
    address: place.formattedAddress ?? null,
    category: place.primaryType ?? null,
    lat: place.latitude ?? null,
    lng: place.longitude ?? null,
    photoUrls: (place.photoUrls ?? []).slice(0, 6),
    reviews: (place.reviews ?? []).slice(0, 5).map((review) => ({
      author: review.author,
      rating: review.rating,
      text: review.text.slice(0, 200),
      when: review.when,
    })),
  };
}

/** 2-4 punchy early findings shown during the scan (curiosity before the gate). */
function deriveEarlyWarnings(input: {
  extracted: ExtractedBusiness;
  hasWebsite: boolean;
}): string[] {
  const { extracted, hasWebsite } = input;
  const warnings: string[] = [];

  if (!hasWebsite) {
    warnings.push("No website linked");
  }
  if (!extracted.description) {
    warnings.push("No description found");
  }
  if (hasWebsite && !extracted.hoursVisible && !extracted.hoursSummary) {
    warnings.push("Hours not visible on your website");
  }
  if (hasWebsite && !extracted.hasTestimonials) {
    warnings.push("No reviews shown on your website");
  }
  if (!extracted.phone) {
    warnings.push(
      hasWebsite
        ? "No phone number found on your homepage"
        : "No phone number on your profile",
    );
  }
  if (hasWebsite && !extracted.hasCallToAction) {
    warnings.push("No clear call-to-action above the fold");
  }

  return warnings.slice(0, 4);
}

function pageSpeedSummary(pageSpeed: PageSpeedData): {
  lcp?: string;
  cls?: string;
  status: "pass" | "fail" | "unknown";
} {
  const lcp = pageSpeed.metrics.find((m) => m.id === "LCP");
  const cls = pageSpeed.metrics.find((m) => m.id === "CLS");
  return {
    lcp: lcp && lcp.rating !== "unknown" ? lcp.displayValue : undefined,
    cls: cls && cls.rating !== "unknown" ? cls.displayValue : undefined,
    status: pageSpeed.overall,
  };
}

/**
 * Serialized, failure-safe writer for grader_audits.progress. A single audit
 * has a single pipeline writer, so full-object writes are safe; the queue
 * keeps parallel-resolving stages (crawl vs PSI) from interleaving UPDATEs.
 */
function createProgressWriter(auditId: string, initial: GraderProgress) {
  const db = getDb();
  const progress = initial;
  let queue: Promise<void> = Promise.resolve();

  function write(mutate: (progress: GraderProgress) => void): void {
    mutate(progress);
    const snapshot = structuredClone(progress);
    queue = queue.then(async () => {
      try {
        await db
          .update(graderAudits)
          .set({ progress: snapshot })
          .where(eq(graderAudits.id, auditId));
      } catch {
        // Progress persistence is best-effort — never kill the pipeline.
      }
    });
  }

  return {
    write,
    flush: () => queue,
    current: () => progress,
  };
}

function markStageDone(
  progress: GraderProgress,
  done: GraderProgressStage,
  next: GraderProgressStage,
): void {
  if (!progress.stagesDone.includes(done)) {
    progress.stagesDone.push(done);
  }
  progress.stage = next;
}

/** Appends narration lines (deduped) so the array grows across polls. */
function appendNarration(progress: GraderProgress, lines: string[]): void {
  const existing = progress.evidence.narration ?? [];
  progress.evidence.narration = [
    ...existing,
    ...lines.filter((line) => line && !existing.includes(line)),
  ];
}

export async function startGraderAuditAction(input: {
  /** Website URL; may be omitted when a place without a website is selected. */
  url?: string;
  /** Google Places selection from the landing autocomplete. */
  place?: GraderPlaceInput;
  scanLeadId?: string;
}): Promise<{ auditId: string }> {
  const rawUrl = input.url?.trim() || input.place?.websiteUri?.trim() || null;
  const url = rawUrl ? normalizeUrl(rawUrl) : null;
  const place = input.place ?? null;

  if (!url && !place) {
    throw new Error("Enter your business website URL");
  }

  // Place evidence exists the moment the user selects — persist it with the
  // row so the scan experience has something real on its very first poll.
  const initialProgress: GraderProgress = {
    stage: url ? "crawl" : "keywords",
    stagesDone: url ? ["place"] : ["place", "crawl", "extract"],
    startedAt: new Date().toISOString(),
    evidence: place ? { place: buildPlaceEvidence(place) } : {},
  };

  const db = getDb();
  const [pending] = await db
    .insert(graderAudits)
    .values({
      // url is NOT NULL for record-keeping; no-website audits store a marker.
      url: url ?? `place:${place!.placeId}`,
      websiteUrl: url,
      status: "scanning",
      scanLeadId: input.scanLeadId ?? null,
      progress: initialProgress,
    })
    .returning({ id: graderAudits.id });

  if (!pending) throw new Error("Could not start the audit");

  // Respond immediately; the pipeline continues after the response is sent.
  after(() =>
    runGraderPipeline({
      auditId: pending.id,
      url,
      place,
      initialProgress,
    }),
  );

  return { auditId: pending.id };
}

async function runGraderPipeline(input: {
  auditId: string;
  url: string | null;
  place: GraderPlaceInput | null;
  initialProgress: GraderProgress;
}): Promise<void> {
  const { auditId, url, place } = input;
  const db = getDb();
  const writer = createProgressWriter(auditId, input.initialProgress);

  // Reviews exist at insert (place selection), so theme grouping runs
  // concurrently with the crawl — near-zero added wall-clock latency.
  // Failure-safe: any AI error resolves to null and the field is skipped.
  const themesPromise =
    place && (place.reviews?.length ?? 0) >= 2
      ? generateReviewThemes({
          model: REASONING_MODEL,
          businessName: place.name,
          reviews: place.reviews!,
        })
      : Promise.resolve(null);

  try {
    const placeCityState = parseCityState(place?.formattedAddress);

    let extracted: ExtractedBusiness;
    let signals: Awaited<ReturnType<typeof analyzeSite>>;
    let pageSpeed: Awaited<ReturnType<typeof fetchPageSpeed>>;
    let websiteDomain: string;

    if (url) {
      // ── Website path: crawl + extract, PSI in parallel ─────────────────
      // Each writes progress evidence the moment it resolves.
      const psiPromise = fetchPageSpeed(url).then((psi) => {
        writer.write((p) => {
          p.evidence.pageSpeed = pageSpeedSummary(psi);
        });
        return psi;
      });

      const scrape = await scrapeUrlFull(url);
      writer.write((p) => {
        if (scrape.screenshotUrl) {
          p.evidence.screenshotUrl = scrape.screenshotUrl;
        }
        markStageDone(p, "crawl", "extract");
      });

      const markdown = scrape.markdown.slice(0, 25000);

      const { object } = await generateObject({
        model: GRADER_MODEL,
        schema: graderExtractionSchema,
        prompt: [
          "You are auditing a local business website for a visibility report.",
          `Source URL: ${url}`,
          "Extract ONLY information explicitly present on the page. Use null when absent.",
          "For booleans, judge from the page content order (earlier = closer to the top).",
          "",
          "Page content (markdown):",
          markdown,
        ].join("\n"),
      });

      // Place data (when present) fills gaps the crawl missed — the place
      // record is authoritative for identity, the site for on-page signals.
      extracted = {
        businessName: place?.name ?? object.businessName,
        phone: object.phone ?? place?.phone ?? null,
        address: object.address ?? place?.formattedAddress ?? null,
        city: object.city ?? placeCityState.city,
        state: object.state ?? placeCityState.state,
        hoursSummary: object.hoursSummary,
        services: object.services,
        description: object.description,
        industry: object.industry,
        phoneVisible: object.phoneVisible,
        addressVisible: object.addressVisible,
        hoursVisible: object.hoursVisible,
        hasCallToAction: object.hasCallToAction,
        hasTestimonials: object.hasTestimonials,
        latitude: place?.latitude ?? null,
        longitude: place?.longitude ?? null,
        placeId: place?.placeId ?? null,
      };

      // Themes ran concurrently with the crawl; usually resolved by now.
      const themesResult = await themesPromise;
      writer.write((p) => {
        p.evidence.services = extracted.services.slice(0, 8);
        p.evidence.warnings = deriveEarlyWarnings({ extracted, hasWebsite: true });
        if (themesResult) {
          p.evidence.reviewThemes = themesResult.themes;
          appendNarration(p, [themesResult.summary]);
        }
        markStageDone(p, "extract", "keywords");
      });

      signals = await analyzeSite({
        url: scrape.finalUrl ?? url,
        rawHtml: scrape.rawHtml,
        title: scrape.title ?? null,
        metaDescription: scrape.description ?? null,
        businessName: extracted.businessName,
      });
      writer.write((p) => {
        appendNarration(p, deriveSignalNarration({ signals, extracted }));
      });
      websiteDomain = new URL(url).hostname.replace(/^www\./, "");
      pageSpeed = await psiPromise;
    } else {
      // ── No-website path: the place record is all we have ───────────────
      extracted = {
        businessName: place!.name,
        phone: place!.phone ?? null,
        address: place!.formattedAddress ?? null,
        city: placeCityState.city,
        state: placeCityState.state,
        hoursSummary: null,
        services: [],
        description: null,
        industry: mapPlaceTypeToIndustry(place!.primaryType),
        phoneVisible: false,
        addressVisible: false,
        hoursVisible: false,
        hasCallToAction: false,
        hasTestimonials: false,
        latitude: place!.latitude ?? null,
        longitude: place!.longitude ?? null,
        placeId: place!.placeId,
      };
      signals = noWebsiteSignals();
      pageSpeed = emptyPageSpeed();
      websiteDomain = place!.placeId; // deterministic sample seed

      const themesResult = await themesPromise;
      writer.write((p) => {
        p.evidence.warnings = deriveEarlyWarnings({
          extracted,
          hasWebsite: false,
        });
        if (themesResult) {
          p.evidence.reviewThemes = themesResult.themes;
          appendNarration(p, [themesResult.summary]);
        }
        appendNarration(p, [
          "No website linked — every check that needs one fails automatically.",
        ]);
      });
    }

    const businessName =
      extracted.businessName ?? websiteDomain.split(".")[0] ?? websiteDomain;

    const keywords = await getRankProvider().fetchKeywordResults({
      businessName,
      websiteDomain,
      city: extracted.city,
      state: extracted.state,
      industry: extracted.industry,
      latitude: extracted.latitude,
      longitude: extracted.longitude,
      keywords: generateKeywords({
        industry: extracted.industry,
        city: extracted.city,
      }),
    });
    const competitors = deriveCompetitors(keywords);

    // Competitor pins for the scan map: prefer coords from the map results.
    writer.write((p) => {
      const coordsByName = new Map<string, { lat: number | null; lng: number | null }>();
      for (const keyword of keywords) {
        for (const result of keyword.mapResults) {
          if (!result.isYou && !coordsByName.has(result.name)) {
            coordsByName.set(result.name, {
              lat: result.lat ?? null,
              lng: result.lng ?? null,
            });
          }
        }
      }
      p.evidence.competitors = competitors.slice(0, 4).map((competitor) => ({
        name: competitor.name,
        rating: competitor.rating,
        lat: coordsByName.get(competitor.name)?.lat ?? null,
        lng: coordsByName.get(competitor.name)?.lng ?? null,
      }));
      if (place) {
        const benchmark = buildPhotoBenchmark({
          seed: websiteDomain,
          yours: place.photoCount ?? place.photoUrls?.length ?? 0,
        });
        p.evidence.photoBenchmark = benchmark;
        appendNarration(p, [photoBenchmarkNarration(benchmark)]);
      }
      markStageDone(p, "keywords", "scoring");
    });

    // Scoring stage narration — the closer before the report reveal.
    writer.write((p) => {
      appendNarration(p, ["Calculating revenue impact…"]);
    });

    const gbpProfile = buildSampleGbpProfile({
      websiteDomain,
      extracted,
      hasWebsite: Boolean(url),
      realRating: place?.rating ?? null,
      realReviewCount: place?.reviewCount ?? null,
      photoUrls: place?.photoUrls?.slice(0, 6),
      realReviews: place?.reviews?.slice(0, 5).map((review) => ({
        author: review.author,
        rating: review.rating,
        text: review.text.slice(0, 200),
        when: review.when,
      })),
    });

    let checks = buildAuditChecks({
      signals,
      extracted,
      pageSpeed,
      gbp: gbpProfile,
    });
    if (!url) {
      checks = applyNoWebsiteOverrides(checks);
    }

    const scores = scoreAudit({ checks, keywords });
    const estimatedMonthlyLoss = estimateMonthlyLoss({
      industry: extracted.industry,
      searchScore: scores.categoryScores.search,
    });

    // Let queued evidence writes land, then finalize status + progress
    // atomically in the same UPDATE as the report payload.
    await writer.flush();
    const finalProgress = structuredClone(writer.current());
    markStageDone(finalProgress, "scoring", "done");
    if (!finalProgress.stagesDone.includes("done")) {
      finalProgress.stagesDone.push("done");
    }

    await db
      .update(graderAudits)
      .set({
        status: "complete",
        progress: finalProgress,
        businessName,
        city: extracted.city,
        state: extracted.state,
        phone: extracted.phone,
        industry: extracted.industry,
        totalScore: scores.totalScore,
        grade: scores.grade,
        totalChecks: scores.totalChecks,
        failedChecks: scores.failedChecks,
        estimatedMonthlyLoss,
        categoryScores: scores.categoryScores,
        checks,
        keywords,
        competitors,
        pageSpeed,
        gbpProfile,
        extracted,
      })
      .where(eq(graderAudits.id, auditId));
  } catch (error) {
    console.error("Grader pipeline failed", {
      auditId,
      error: error instanceof Error ? error.message : "unknown",
    });
    try {
      await db
        .update(graderAudits)
        .set({ status: "failed" })
        .where(eq(graderAudits.id, auditId));
    } catch {
      // Row update failed too — the status endpoint will keep reporting
      // "scanning"; the client's countdown degrades gracefully.
    }
  }
}

export async function captureGraderLeadAction(input: {
  auditId: string;
  name: string;
  email: string;
  relationship: "owner" | "provider" | "other";
  optIn: boolean;
}): Promise<{ ok: boolean }> {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();

  if (name.length < 2) throw new Error("Enter your name");
  if (!email.includes("@") || email.length < 5) {
    throw new Error("Enter a valid email address");
  }

  const db = getDb();
  const audit = await db.query.graderAudits.findFirst({
    where: eq(graderAudits.id, input.auditId),
    columns: { id: true },
  });
  if (!audit) throw new Error("Audit not found");

  await db.insert(graderLeads).values({
    auditId: input.auditId,
    name,
    email,
    relationship: input.relationship,
    smsOptIn: input.optIn,
  });

  await db
    .update(graderAudits)
    .set({ leadCaptured: true })
    .where(eq(graderAudits.id, input.auditId));

  return { ok: true };
}
