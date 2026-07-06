"use server";

import { generateObject } from "ai";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/db";
import { scanLeads } from "@/db/schema";
import { scrapeUrl } from "@/lib/firecrawl";

const scanExtractionSchema = z.object({
  businessName: z.string().nullable().describe("Business name shown on the site"),
  phone: z.string().nullable().describe("Primary phone number"),
  address: z.string().nullable().describe("Street address if shown"),
  city: z.string().nullable(),
  state: z.string().nullable(),
  hoursSummary: z
    .string()
    .nullable()
    .describe("Business hours as free text if shown"),
  services: z
    .array(z.string())
    .describe("Services or product categories mentioned (max 8)"),
  description: z
    .string()
    .nullable()
    .describe("One-sentence summary of what the business does"),
  isLocalBusiness: z
    .boolean()
    .describe("Whether this looks like a local business website"),
});

export type ScanCheck = {
  id: string;
  label: string;
  passed: boolean;
  detail: string;
};

export type PublicScanResult = {
  scanId: string;
  url: string;
  score: number;
  grade: "critical" | "poor" | "fair" | "good";
  businessName: string | null;
  checks: ScanCheck[];
  extracted: {
    phone: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    hoursSummary: string | null;
    services: string[];
    description: string | null;
  };
};

const SCAN_MODEL = process.env.AUDIT_EXTRACTION_MODEL ?? "google/gemini-2.5-flash";

function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();

  if (!trimmed) {
    throw new Error("Enter your website URL");
  }

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

export async function runPublicScanAction(input: {
  url: string;
}): Promise<PublicScanResult> {
  const url = normalizeUrl(input.url);

  const scrape = await scrapeUrl(url);
  const markdown = scrape.markdown.slice(0, 25000);

  const { object: extracted } = await generateObject({
    model: SCAN_MODEL,
    schema: scanExtractionSchema,
    prompt: [
      "You are an AI visibility agent auditing a local business website.",
      `Source URL: ${url}`,
      "Extract ONLY information explicitly present on the page. Use null when absent.",
      "",
      "Page content (markdown):",
      markdown,
    ].join("\n"),
  });

  const hasSchemaHints =
    /schema\.org|application\/ld\+json/i.test(scrape.markdown) ||
    /itemprop=/i.test(scrape.markdown);

  const checks: ScanCheck[] = [
    {
      id: "name",
      label: "Business name detectable",
      passed: Boolean(extracted.businessName),
      detail: extracted.businessName
        ? `AI agents identify you as "${extracted.businessName}".`
        : "AI crawlers can't confidently identify your business name.",
    },
    {
      id: "phone",
      label: "Phone number found",
      passed: Boolean(extracted.phone),
      detail: extracted.phone
        ? `Found ${extracted.phone} — customers and AI assistants can reach you.`
        : "No phone number found — AI assistants can't tell customers how to call you.",
    },
    {
      id: "address",
      label: "Address / location found",
      passed: Boolean(extracted.address || (extracted.city && extracted.state)),
      detail:
        extracted.address || extracted.city
          ? `Location signal found (${extracted.address ?? `${extracted.city}, ${extracted.state}`}).`
          : "No street address found — local AI search can't place you on the map.",
    },
    {
      id: "hours",
      label: "Business hours published",
      passed: Boolean(extracted.hoursSummary),
      detail: extracted.hoursSummary
        ? `Hours detected: ${extracted.hoursSummary.slice(0, 60)}`
        : "No hours found — 'open now' queries in Google and ChatGPT will skip you.",
    },
    {
      id: "services",
      label: "Services described",
      passed: extracted.services.length >= 3,
      detail:
        extracted.services.length >= 3
          ? `${extracted.services.length} services detected — good unbranded-query coverage.`
          : "Fewer than 3 services detected — you'll miss 'best X near me' AI answers.",
    },
    {
      id: "structured",
      label: "Structured data (schema.org)",
      passed: hasSchemaHints,
      detail: hasSchemaHints
        ? "Structured data hints found — AI engines can parse your facts."
        : "No schema.org markup detected — the #1 source AI engines cite.",
    },
  ];

  const passedCount = checks.filter((check) => check.passed).length;
  const score = Math.round((passedCount / checks.length) * 70); // Max 70 — full profile needed for more
  const grade =
    score >= 55 ? "good" : score >= 40 ? "fair" : score >= 20 ? "poor" : "critical";

  const db = getDb();
  const [lead] = await db
    .insert(scanLeads)
    .values({
      url,
      businessName: extracted.businessName,
      phone: extracted.phone,
      city: extracted.city,
      state: extracted.state,
      score,
      checks,
      extracted,
    })
    .returning({ id: scanLeads.id });

  return {
    scanId: lead?.id ?? "",
    url,
    score,
    grade,
    businessName: extracted.businessName,
    checks,
    extracted: {
      phone: extracted.phone,
      address: extracted.address,
      city: extracted.city,
      state: extracted.state,
      hoursSummary: extracted.hoursSummary,
      services: extracted.services,
      description: extracted.description,
    },
  };
}

export async function captureScanEmailAction(input: {
  scanId: string;
  email: string;
}): Promise<{ ok: boolean }> {
  const email = input.email.trim().toLowerCase();

  if (!email.includes("@") || email.length < 5) {
    throw new Error("Enter a valid email address");
  }

  const db = getDb();
  await db
    .update(scanLeads)
    .set({ email })
    .where(eq(scanLeads.id, input.scanId));

  return { ok: true };
}
