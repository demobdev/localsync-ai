/**
 * Cheap, real signals from the scraped page HTML plus direct fetches of
 * robots.txt / sitemap.xml. No external APIs beyond the site itself.
 */

export type SiteSignals = {
  https: boolean;
  customDomain: boolean;
  domainMatchesName: boolean | null;
  h1Text: string | null;
  title: string | null;
  metaDescription: string | null;
  hasOpenGraph: boolean;
  hasJsonLd: boolean;
  hasLocalBusinessSchema: boolean;
  hasCanonical: boolean;
  noindex: boolean;
  hasViewportMeta: boolean;
  hasTelLink: boolean;
  hasFavicon: boolean;
  robotsTxtOk: boolean | null;
  sitemapOk: boolean | null;
};

const HOSTED_SUBDOMAIN_PATTERNS = [
  /\.wixsite\.com$/i,
  /\.squarespace\.com$/i,
  /\.weebly\.com$/i,
  /\.wordpress\.com$/i,
  /\.godaddysites\.com$/i,
  /\.webflow\.io$/i,
  /\.myshopify\.com$/i,
  /\.business\.site$/i,
];

function extractTag(html: string, pattern: RegExp): string | null {
  const match = html.match(pattern);
  return match?.[1]?.trim() || null;
}

function normalizeForMatch(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

async function fetchOk(url: string, timeoutMs = 6000): Promise<boolean | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
    });
    return response.ok;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function analyzeSite(input: {
  url: string;
  rawHtml: string;
  title: string | null;
  metaDescription: string | null;
  businessName: string | null;
}): Promise<SiteSignals> {
  const parsed = new URL(input.url);
  const html = input.rawHtml;
  const head = html.slice(0, 60_000);

  const h1Text = extractTag(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i)?.replace(
    /<[^>]+>/g,
    "",
  );

  const title =
    input.title ?? extractTag(head, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const metaDescription =
    input.metaDescription ??
    extractTag(
      head,
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i,
    ) ??
    extractTag(
      head,
      /<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i,
    );

  const jsonLdBlocks =
    html.match(
      /<script[^>]+type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi,
    ) ?? [];
  const hasJsonLd = jsonLdBlocks.length > 0;
  const hasLocalBusinessSchema = jsonLdBlocks.some((block) =>
    /LocalBusiness|Restaurant|Dentist|Attorney|Plumber|Electrician|HVACBusiness|AutoRepair|MedicalBusiness|ProfessionalService|HomeAndConstructionBusiness|Store|RealEstateAgent|VeterinaryCare/i.test(
      block,
    ),
  );

  const hostname = parsed.hostname.replace(/^www\./, "");
  const customDomain = !HOSTED_SUBDOMAIN_PATTERNS.some((p) =>
    p.test(parsed.hostname),
  );

  let domainMatchesName: boolean | null = null;
  if (input.businessName) {
    const nameKey = normalizeForMatch(input.businessName);
    const domainKey = normalizeForMatch(hostname.split(".")[0] ?? "");
    domainMatchesName =
      nameKey.length > 0 &&
      domainKey.length > 2 &&
      (nameKey.includes(domainKey) || domainKey.includes(nameKey.slice(0, 12)));
  }

  const origin = `${parsed.protocol}//${parsed.host}`;
  const [robotsTxtOk, sitemapOk] = await Promise.all([
    fetchOk(`${origin}/robots.txt`),
    fetchOk(`${origin}/sitemap.xml`),
  ]);

  return {
    https: parsed.protocol === "https:",
    customDomain,
    domainMatchesName,
    h1Text: h1Text || null,
    title: title || null,
    metaDescription: metaDescription || null,
    hasOpenGraph: /<meta[^>]+property=["']og:/i.test(head),
    hasJsonLd,
    hasLocalBusinessSchema,
    hasCanonical: /<link[^>]+rel=["']canonical["']/i.test(head),
    noindex:
      /<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(head),
    hasViewportMeta: /<meta[^>]+name=["']viewport["']/i.test(head),
    hasTelLink: /href=["']tel:/i.test(html),
    hasFavicon: /<link[^>]+rel=["'][^"']*icon[^"']*["']/i.test(head),
    robotsTxtOk,
    sitemapOk,
  };
}
