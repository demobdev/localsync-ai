"use server";

import { generateObject } from "ai";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/db";
import { graderAudits, graderLeads } from "@/db/schema";
import { scrapeUrlFull } from "@/lib/firecrawl";
import { buildAuditChecks } from "@/lib/grader/checks";
import { buildSampleGbpProfile } from "@/lib/grader/gbp";
import { INDUSTRY_SLUGS } from "@/lib/grader/industry";
import { fetchPageSpeed } from "@/lib/grader/pagespeed";
import {
  deriveCompetitors,
  generateKeywords,
  getRankProvider,
} from "@/lib/grader/rank-provider";
import { estimateMonthlyLoss, scoreAudit } from "@/lib/grader/scoring";
import { analyzeSite } from "@/lib/grader/site-analysis";
import type { ExtractedBusiness } from "@/lib/grader/types";

const GRADER_MODEL =
  process.env.AUDIT_EXTRACTION_MODEL ?? "google/gemini-2.5-flash";

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

export async function startGraderAuditAction(input: {
  url: string;
  scanLeadId?: string;
}): Promise<{ auditId: string }> {
  const url = normalizeUrl(input.url);
  const db = getDb();

  const [pending] = await db
    .insert(graderAudits)
    .values({
      url,
      websiteUrl: url,
      status: "scanning",
      scanLeadId: input.scanLeadId ?? null,
    })
    .returning({ id: graderAudits.id });

  if (!pending) throw new Error("Could not start the audit");

  try {
    // Crawl + PageSpeed run in parallel; PSI degrades to "unknown" on failure.
    const [scrape, pageSpeed] = await Promise.all([
      scrapeUrlFull(url),
      fetchPageSpeed(url),
    ]);
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

    const extracted: ExtractedBusiness = {
      businessName: object.businessName,
      phone: object.phone,
      address: object.address,
      city: object.city,
      state: object.state,
      hoursSummary: object.hoursSummary,
      services: object.services,
      description: object.description,
      industry: object.industry,
      phoneVisible: object.phoneVisible,
      addressVisible: object.addressVisible,
      hoursVisible: object.hoursVisible,
      hasCallToAction: object.hasCallToAction,
      hasTestimonials: object.hasTestimonials,
    };

    const signals = await analyzeSite({
      url: scrape.finalUrl ?? url,
      rawHtml: scrape.rawHtml,
      title: scrape.title ?? null,
      metaDescription: scrape.description ?? null,
      businessName: extracted.businessName,
    });

    const websiteDomain = new URL(url).hostname.replace(/^www\./, "");
    const businessName =
      extracted.businessName ?? websiteDomain.split(".")[0] ?? websiteDomain;

    const keywords = await getRankProvider().fetchKeywordResults({
      businessName,
      websiteDomain,
      city: extracted.city,
      state: extracted.state,
      industry: extracted.industry,
      keywords: generateKeywords({
        industry: extracted.industry,
        city: extracted.city,
      }),
    });
    const competitors = deriveCompetitors(keywords);
    const gbpProfile = buildSampleGbpProfile({ websiteDomain, extracted });

    const checks = buildAuditChecks({ signals, extracted, pageSpeed, gbp: gbpProfile });
    const scores = scoreAudit({ checks, keywords });
    const estimatedMonthlyLoss = estimateMonthlyLoss({
      industry: extracted.industry,
      searchScore: scores.categoryScores.search,
    });

    await db
      .update(graderAudits)
      .set({
        status: "complete",
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
      .where(eq(graderAudits.id, pending.id));

    return { auditId: pending.id };
  } catch (error) {
    await db
      .update(graderAudits)
      .set({ status: "failed" })
      .where(eq(graderAudits.id, pending.id));
    throw error instanceof Error
      ? error
      : new Error("Audit failed — check the URL and try again");
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
