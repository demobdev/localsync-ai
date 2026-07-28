/**
 * Website crawler adapted from CrawlSEO (MIT License, Copyright 2026 crawlseo).
 * Reworked for LocalSync's location-aware, Inngest-driven audit pipeline.
 */
import { lookup } from "node:dns/promises";

import type { LocationProfileSnapshot } from "@/lib/types/location-profile";

import {
  calculateWebsiteHealthScore,
  type WebsiteFindingInput,
} from "./scoring";

const TIMEOUT_MS = 12_000;
const MAX_RESPONSE_BYTES = 5 * 1024 * 1024;
const USER_AGENT = "LocalMapSearchIntelligence/1.0 (+https://localmap.co)";

export type WebsitePageSnapshot = {
  url: string;
  statusCode: number;
  title: string | null;
  description: string | null;
  h1Count: number;
  canonical: string | null;
  wordCount: number;
  hasLocalBusinessSchema: boolean;
  responseTimeMs: number;
  extractedPhone: string | null;
  extractedAddress: string | null;
};

function stripTags(value: string): string {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function capture(html: string, expression: RegExp): string | null {
  return html.match(expression)?.[1]?.replace(/\s+/g, " ").trim() || null;
}

function normalizePhone(value?: string | null): string {
  return (value ?? "").replace(/\D/g, "").slice(-10);
}

function normalizeUrl(raw: string, base: string): string | null {
  try {
    const url = new URL(raw, base);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    url.hash = "";
    if (url.pathname.length > 1) url.pathname = url.pathname.replace(/\/+$/, "");
    return url.toString();
  } catch {
    return null;
  }
}

export function isPrivateIp(ip: string): boolean {
  const mapped = ip.match(/^::ffff:(.+)$/i);
  if (mapped) return isPrivateIp(mapped[1]);
  const parts = ip.split(".").map(Number);
  if (parts.length === 4 && parts.every((part) => part >= 0 && part <= 255)) {
    return (
      parts[0] === 0 ||
      parts[0] === 10 ||
      parts[0] === 127 ||
      (parts[0] === 169 && parts[1] === 254) ||
      (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
      (parts[0] === 192 && parts[1] === 168)
    );
  }
  const lower = ip.toLowerCase();
  return (
    lower === "::1" ||
    lower.startsWith("fc") ||
    lower.startsWith("fd") ||
    lower.startsWith("fe80")
  );
}

async function assertPublicUrl(url: string) {
  const resolved = await lookup(new URL(url).hostname, { all: true });
  if (resolved.some(({ address }) => isPrivateIp(address))) {
    throw new Error("Website resolves to a private or reserved address");
  }
}

async function fetchHtml(url: string) {
  await assertPublicUrl(url);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const started = Date.now();
  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": USER_AGENT, Accept: "text/html" },
    });
    const buffer = await response.arrayBuffer();
    if (buffer.byteLength > MAX_RESPONSE_BYTES) {
      throw new Error("HTML response exceeds the 5 MB audit limit");
    }
    return {
      statusCode: response.status,
      finalUrl: response.url || url,
      responseTimeMs: Date.now() - started,
      html: new TextDecoder().decode(buffer),
    };
  } finally {
    clearTimeout(timer);
  }
}

function parsePage(
  url: string,
  statusCode: number,
  responseTimeMs: number,
  html: string,
): { page: WebsitePageSnapshot; links: string[] } {
  const title = capture(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const description =
    capture(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)/i) ??
    capture(html, /<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description/i);
  const canonical =
    capture(html, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)/i) ??
    capture(html, /<link[^>]+href=["']([^"']*)["'][^>]+rel=["']canonical/i);
  const h1Count = [...html.matchAll(/<h1\b/gi)].length;
  const body = stripTags(html);
  const phone =
    capture(html, /href=["']tel:([^"']+)/i) ??
    body.match(/(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}/)?.[0] ??
    null;
  const address =
    capture(html, /itemprop=["']streetAddress["'][^>]*>([\s\S]*?)<\//i) ?? null;
  const links = [...html.matchAll(/<a[^>]+href=["']([^"'#]+)["']/gi)]
    .map((match) => normalizeUrl(match[1], url))
    .filter((value): value is string => Boolean(value));

  return {
    page: {
      url,
      statusCode,
      title,
      description,
      h1Count,
      canonical: canonical ? normalizeUrl(canonical, url) : null,
      wordCount: body ? body.split(/\s+/).length : 0,
      hasLocalBusinessSchema:
        /application\/ld\+json/i.test(html) &&
        /"(?:@type)"\s*:\s*"(?:LocalBusiness|Store|Restaurant|ProfessionalService|HomeAndConstructionBusiness)/i.test(
          html,
        ),
      responseTimeMs,
      extractedPhone: phone,
      extractedAddress: address ? stripTags(address) : null,
    },
    links,
  };
}

function findingsForPage(
  page: WebsitePageSnapshot,
  profile: LocationProfileSnapshot,
): WebsiteFindingInput[] {
  const findings: WebsiteFindingInput[] = [];
  const add = (
    type: string,
    severity: WebsiteFindingInput["severity"],
    title: string,
    evidence: string,
    remediation: string,
  ) => findings.push({ type, severity, url: page.url, title, evidence, remediation });

  if (page.statusCode >= 400)
    add("broken_page", "critical", "Broken page", `HTTP ${page.statusCode}`, "Repair the page or redirect it to the correct live URL.");
  if (!page.title)
    add("missing_title", "critical", "Missing title tag", "No <title> found.", "Add a unique, locally relevant title.");
  if (!page.description)
    add("missing_description", "warning", "Missing meta description", "No meta description found.", "Add a useful description that matches the page intent.");
  if (page.h1Count === 0)
    add("missing_h1", "warning", "Missing H1", "No H1 heading found.", "Add one descriptive page heading.");
  if (!page.canonical)
    add("missing_canonical", "info", "Missing canonical", "No canonical URL found.", "Declare the preferred URL for this page.");
  if (
    !page.hasLocalBusinessSchema &&
    new URL(page.url).pathname.replace(/\/+$/, "") === ""
  )
    add("missing_local_schema", "critical", "Missing LocalBusiness schema", "Homepage has no recognized local-business JSON-LD.", "Publish schema generated from the approved master profile.");
  if (page.responseTimeMs > 3000)
    add("slow_response", "warning", "Slow page response", `${page.responseTimeMs} ms response time.`, "Improve caching, hosting, or server response time.");

  if (
    profile.phone &&
    page.extractedPhone &&
    normalizePhone(profile.phone) !== normalizePhone(page.extractedPhone)
  ) {
    add(
      "phone_mismatch",
      "critical",
      "Website phone differs from master profile",
      `Website: ${page.extractedPhone} · Master: ${profile.phone}`,
      "Review the discrepancy and approve the correct canonical phone before changing either source.",
    );
  }
  return findings;
}

export async function crawlLocationWebsite(
  profile: LocationProfileSnapshot,
  maxPages = 30,
): Promise<{
  pages: WebsitePageSnapshot[];
  findings: WebsiteFindingInput[];
  score: number;
}> {
  if (!profile.website) throw new Error("Add a website to the master profile first");
  const seed = normalizeUrl(profile.website, profile.website);
  if (!seed) throw new Error("The master profile website URL is invalid");
  const origin = new URL(seed).origin;
  const queue = [seed];
  const visited = new Set<string>();
  const pages: WebsitePageSnapshot[] = [];
  const findings: WebsiteFindingInput[] = [];

  while (queue.length && pages.length < Math.max(1, Math.min(maxPages, 50))) {
    const next = queue.shift()!;
    if (visited.has(next) || new URL(next).origin !== origin) continue;
    visited.add(next);
    try {
      const response = await fetchHtml(next);
      const parsed = parsePage(
        response.finalUrl,
        response.statusCode,
        response.responseTimeMs,
        response.html,
      );
      pages.push(parsed.page);
      findings.push(...findingsForPage(parsed.page, profile));
      for (const link of parsed.links) {
        if (new URL(link).origin === origin && !visited.has(link)) queue.push(link);
      }
    } catch (error) {
      findings.push({
        type: "fetch_failed",
        severity: "critical",
        url: next,
        title: "Page could not be audited",
        evidence: error instanceof Error ? error.message : "Fetch failed",
        remediation: "Confirm the page is public and retry the audit.",
      });
    }
  }

  const rootUrl = `${origin}/`;
  const [robots, sitemap] = await Promise.all([
    fetch(`${origin}/robots.txt`, { headers: { "User-Agent": USER_AGENT } }).catch(() => null),
    fetch(`${origin}/sitemap.xml`, { headers: { "User-Agent": USER_AGENT } }).catch(() => null),
  ]);
  findings.push({
    type: "robots",
    severity: robots?.ok ? "passed" : "warning",
    url: `${origin}/robots.txt`,
    title: robots?.ok ? "Robots.txt found" : "Robots.txt missing",
    evidence: robots?.ok ? "Crawler directives are reachable." : "No reachable robots.txt found.",
    remediation: robots?.ok ? undefined : "Publish robots.txt and reference the XML sitemap.",
  });
  findings.push({
    type: "sitemap",
    severity: sitemap?.ok ? "passed" : "warning",
    url: `${origin}/sitemap.xml`,
    title: sitemap?.ok ? "Sitemap found" : "Sitemap missing",
    evidence: sitemap?.ok ? "XML sitemap is reachable." : "No sitemap.xml found.",
    remediation: sitemap?.ok ? undefined : "Publish an XML sitemap containing indexable location and service pages.",
  });
  if (!pages.some((page) => page.url === rootUrl) && pages[0]) {
    // Redirected homepages are normal; the first page remains the homepage.
  }

  return {
    pages,
    findings,
    score: calculateWebsiteHealthScore(findings, pages.length),
  };
}
