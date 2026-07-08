/**
 * Builds the 44 audit checks from real site signals, AI extraction,
 * PageSpeed data, and the GBP profile.
 *
 * - search checks (20): weight 0 — the Search Results score is derived from
 *   keyword rankings in scoring.ts; these rows explain *why* and feed the fix plan.
 * - guest checks (12): weights sum to 40.
 * - listings checks (12): weights sum to 20.
 */

import { getIndustryProfile } from "./industry";
import type { SiteSignals } from "./site-analysis";
import type {
  AuditCheck,
  ExtractedBusiness,
  GbpProfile,
  PageSpeedData,
} from "./types";

function fromGbpStatus(
  status: "pass" | "fail" | "warn" | "pending",
): AuditCheck["status"] {
  return status === "pending" ? "unknown" : status;
}

export function buildAuditChecks(input: {
  signals: SiteSignals;
  extracted: ExtractedBusiness;
  pageSpeed: PageSpeedData;
  gbp: GbpProfile;
}): AuditCheck[] {
  const { signals, extracted, pageSpeed, gbp } = input;
  const industry = getIndustryProfile(extracted.industry);
  const city = extracted.city;

  const h1 = signals.h1Text?.toLowerCase() ?? "";
  const title = signals.title?.toLowerCase() ?? "";
  const keywordTerms = [
    industry.categoryNoun,
    ...industry.serviceTerms,
    industry.tradeNoun.toLowerCase(),
  ].flatMap((term) => term.toLowerCase().split(" "));
  const h1HasKeyword = keywordTerms.some((t) => t.length > 3 && h1.includes(t));
  const h1HasLocation = Boolean(city && h1.includes(city.toLowerCase()));
  const titleHasLocation = Boolean(city && title.includes(city.toLowerCase()));

  const checks: AuditCheck[] = [
    // ── Search Results: Domain ────────────────────────────────────────────
    {
      id: "domain-https",
      category: "search",
      group: "Domain",
      label: "Site served over HTTPS",
      status: signals.https ? "pass" : "fail",
      detail: signals.https
        ? "Your site uses a secure connection — Google requires this to rank well."
        : "Your site isn't served over HTTPS. Google flags it as 'Not secure' and ranks it lower.",
      recommendation: "Install an SSL certificate and redirect all traffic to https://.",
      impact: "high",
      weight: 0,
      effort: "quick",
    },
    {
      id: "domain-custom",
      category: "search",
      group: "Domain",
      label: "Custom domain (not a site-builder subdomain)",
      status: signals.customDomain ? "pass" : "fail",
      detail: signals.customDomain
        ? "You own your domain, which builds lasting search authority."
        : "You're on a site-builder subdomain — search authority accrues to the platform, not you.",
      recommendation: "Move to a custom domain you own.",
      impact: "medium",
      weight: 0,
      effort: "medium",
    },
    {
      id: "domain-name-match",
      category: "search",
      group: "Domain",
      label: "Domain matches your business name",
      status:
        signals.domainMatchesName === null
          ? "unknown"
          : signals.domainMatchesName
            ? "pass"
            : "warn",
      detail:
        signals.domainMatchesName === null
          ? "We couldn't confirm your business name to compare."
          : signals.domainMatchesName
            ? "Customers searching your name will recognize your domain instantly."
            : "Your domain doesn't clearly match your business name — branded searches may click elsewhere.",
      impact: "low",
      weight: 0,
      effort: "high",
    },
    {
      id: "domain-reachable",
      category: "search",
      group: "Domain",
      label: "Site loads for crawlers",
      status: "pass",
      detail: "Your site responded to our crawler and rendered content.",
      impact: "high",
      weight: 0,
      effort: "quick",
    },

    // ── Search Results: Headline (H1) ─────────────────────────────────────
    {
      id: "h1-present",
      category: "search",
      group: "Headline (H1)",
      label: "Main headline (H1) exists",
      status: signals.h1Text ? "pass" : "fail",
      detail: signals.h1Text
        ? `Found: "${signals.h1Text.slice(0, 80)}"`
        : "No H1 headline found. Google leans on the H1 to understand what a page is about.",
      recommendation: "Add one clear H1 that says what you do and where.",
      impact: "high",
      weight: 0,
      effort: "quick",
    },
    {
      id: "h1-keyword",
      category: "search",
      group: "Headline (H1)",
      label: "Headline mentions your service",
      status: signals.h1Text ? (h1HasKeyword ? "pass" : "fail") : "fail",
      detail: h1HasKeyword
        ? "Your headline includes terms customers actually search."
        : `Your headline doesn't mention "${industry.categoryNoun}" or your core services.`,
      recommendation: `Work "${industry.categoryNoun}" into your homepage headline.`,
      impact: "medium",
      weight: 0,
      effort: "quick",
    },
    {
      id: "h1-location",
      category: "search",
      group: "Headline (H1)",
      label: "Headline mentions your city",
      status: signals.h1Text ? (h1HasLocation ? "pass" : "fail") : "fail",
      detail: h1HasLocation
        ? `Your headline mentions ${city} — a strong local relevance signal.`
        : city
          ? `Your headline never mentions ${city}. Local searches strongly favor pages that name the area.`
          : "We couldn't confirm your city to check for it in the headline.",
      recommendation: "Add your city or service area to the headline.",
      impact: "medium",
      weight: 0,
      effort: "quick",
    },

    // ── Search Results: Metadata ──────────────────────────────────────────
    {
      id: "meta-title",
      category: "search",
      group: "Metadata",
      label: "Title tag exists",
      status: signals.title ? "pass" : "fail",
      detail: signals.title
        ? `"${signals.title.slice(0, 70)}" — this is your listing headline in Google.`
        : "No title tag found — Google writes its own, and it won't sell for you.",
      recommendation: "Write a title like 'Service in City | Business Name'.",
      impact: "high",
      weight: 0,
      effort: "quick",
    },
    {
      id: "meta-title-length",
      category: "search",
      group: "Metadata",
      label: "Title length is optimal (30-60 chars)",
      status: signals.title
        ? signals.title.length >= 30 && signals.title.length <= 60
          ? "pass"
          : "warn"
        : "fail",
      detail: signals.title
        ? `Your title is ${signals.title.length} characters. Google truncates past ~60 and ignores thin titles under ~30.`
        : "No title to measure.",
      impact: "low",
      weight: 0,
      effort: "quick",
    },
    {
      id: "meta-title-location",
      category: "search",
      group: "Metadata",
      label: "Title mentions your city",
      status: signals.title ? (titleHasLocation ? "pass" : "fail") : "fail",
      detail: titleHasLocation
        ? `Your title names ${city}, matching local search intent.`
        : city
          ? `Your title never mentions ${city} — the single highest-leverage local SEO fix.`
          : "We couldn't confirm your city to check the title.",
      recommendation: "Add your city to the title tag.",
      impact: "high",
      weight: 0,
      effort: "quick",
    },
    {
      id: "meta-description",
      category: "search",
      group: "Metadata",
      label: "Meta description exists",
      status: signals.metaDescription ? "pass" : "fail",
      detail: signals.metaDescription
        ? `"${signals.metaDescription.slice(0, 90)}…"`
        : "No meta description — Google improvises one, and improvised copy doesn't convert clicks.",
      recommendation: "Write a 70-160 character description with your service, city, and a reason to click.",
      impact: "medium",
      weight: 0,
      effort: "quick",
    },
    {
      id: "meta-description-length",
      category: "search",
      group: "Metadata",
      label: "Description length is optimal (70-160 chars)",
      status: signals.metaDescription
        ? signals.metaDescription.length >= 70 &&
          signals.metaDescription.length <= 160
          ? "pass"
          : "warn"
        : "fail",
      detail: signals.metaDescription
        ? `Your description is ${signals.metaDescription.length} characters.`
        : "No description to measure.",
      impact: "low",
      weight: 0,
      effort: "quick",
    },

    // ── Search Results: Schema ────────────────────────────────────────────
    {
      id: "schema-localbusiness",
      category: "search",
      group: "Schema",
      label: "LocalBusiness structured data",
      status: signals.hasLocalBusinessSchema ? "pass" : "fail",
      detail: signals.hasLocalBusinessSchema
        ? "Google can read your name, address, and hours as structured facts."
        : "No LocalBusiness schema found — Google and AI assistants have to guess your key facts.",
      recommendation: "Add LocalBusiness JSON-LD with name, address, phone, hours, and geo.",
      impact: "high",
      weight: 0,
      effort: "medium",
    },
    {
      id: "schema-jsonld",
      category: "search",
      group: "Schema",
      label: "Any structured data (JSON-LD)",
      status: signals.hasJsonLd ? "pass" : "fail",
      detail: signals.hasJsonLd
        ? "Structured data found on the page."
        : "Zero structured data — the #1 source search engines and AI cite.",
      impact: "medium",
      weight: 0,
      effort: "medium",
    },
    {
      id: "schema-og",
      category: "search",
      group: "Schema",
      label: "Open Graph tags for link previews",
      status: signals.hasOpenGraph ? "pass" : "fail",
      detail: signals.hasOpenGraph
        ? "Shared links show a proper preview card."
        : "Links to your site render as bare URLs when shared — fewer clicks from social and texts.",
      impact: "low",
      weight: 0,
      effort: "quick",
    },
    {
      id: "schema-favicon",
      category: "search",
      group: "Schema",
      label: "Favicon set",
      status: signals.hasFavicon ? "pass" : "warn",
      detail: signals.hasFavicon
        ? "Your icon shows next to your result in mobile search."
        : "No favicon found — your search result shows a generic globe icon.",
      impact: "low",
      weight: 0,
      effort: "quick",
    },

    // ── Search Results: Indexability ──────────────────────────────────────
    {
      id: "idx-indexable",
      category: "search",
      group: "Indexability",
      label: "Page allows indexing",
      status: signals.noindex ? "fail" : "pass",
      detail: signals.noindex
        ? "Your homepage has a noindex tag — Google is being told to hide it."
        : "No noindex directives — Google is allowed to list your page.",
      recommendation: "Remove the noindex meta tag immediately.",
      impact: "high",
      weight: 0,
      effort: "quick",
    },
    {
      id: "idx-robots",
      category: "search",
      group: "Indexability",
      label: "robots.txt reachable",
      status:
        signals.robotsTxtOk === null
          ? "unknown"
          : signals.robotsTxtOk
            ? "pass"
            : "warn",
      detail:
        signals.robotsTxtOk === null
          ? "We couldn't reach robots.txt — it may be blocked or slow."
          : signals.robotsTxtOk
            ? "robots.txt responds normally."
            : "robots.txt returned an error — crawlers may be handled inconsistently.",
      impact: "low",
      weight: 0,
      effort: "quick",
    },
    {
      id: "idx-sitemap",
      category: "search",
      group: "Indexability",
      label: "Sitemap.xml present",
      status:
        signals.sitemapOk === null
          ? "unknown"
          : signals.sitemapOk
            ? "pass"
            : "fail",
      detail:
        signals.sitemapOk === null
          ? "We couldn't reach a sitemap — it may live at a custom path."
          : signals.sitemapOk
            ? "A sitemap helps Google discover all of your pages."
            : "No sitemap.xml found — new pages get discovered slowly or not at all.",
      recommendation: "Generate a sitemap and submit it in Google Search Console.",
      impact: "medium",
      weight: 0,
      effort: "quick",
    },
    {
      id: "idx-canonical",
      category: "search",
      group: "Indexability",
      label: "Canonical URL declared",
      status: signals.hasCanonical ? "pass" : "warn",
      detail: signals.hasCanonical
        ? "Duplicate-content signals are consolidated to one URL."
        : "No canonical tag — www/non-www and tracking-URL duplicates can split your ranking power.",
      impact: "low",
      weight: 0,
      effort: "quick",
    },

    // ── Guest Experience: Page speed (10 pts) ─────────────────────────────
    {
      id: "speed-cwv",
      category: "guest",
      group: "Page speed",
      label: "Passes Core Web Vitals",
      status:
        pageSpeed.overall === "unknown"
          ? "unknown"
          : pageSpeed.overall === "pass"
            ? "pass"
            : "fail",
      detail:
        pageSpeed.overall === "unknown"
          ? "Google didn't return enough field data for this site yet."
          : pageSpeed.overall === "pass"
            ? "Real-user metrics pass Google's Core Web Vitals thresholds."
            : "Real users experience your site as slow — Google demotes slow sites in mobile results.",
      recommendation: "Compress images, reduce scripts, and use a fast host or CDN.",
      impact: "high",
      weight: 4,
      effort: "high",
    },
    {
      id: "speed-lcp",
      category: "guest",
      group: "Page speed",
      label: "Main content loads fast (LCP)",
      status: metricStatus(pageSpeed, "LCP"),
      detail: metricDetail(pageSpeed, "LCP", "Largest element render time"),
      impact: "medium",
      weight: 2,
      effort: "high",
    },
    {
      id: "speed-cls",
      category: "guest",
      group: "Page speed",
      label: "Layout is stable while loading (CLS)",
      status: metricStatus(pageSpeed, "CLS"),
      detail: metricDetail(pageSpeed, "CLS", "Visual shift while loading"),
      impact: "low",
      weight: 2,
      effort: "medium",
    },
    {
      id: "speed-inp",
      category: "guest",
      group: "Page speed",
      label: "Site responds to taps quickly (INP)",
      status: metricStatus(pageSpeed, "INP"),
      detail: metricDetail(pageSpeed, "INP", "Tap-to-response delay"),
      impact: "medium",
      weight: 2,
      effort: "high",
    },

    // ── Guest Experience: Conversion (30 pts) ─────────────────────────────
    {
      id: "conv-cta",
      category: "guest",
      group: "Conversion",
      label: "Clear call-to-action above the fold",
      status: extracted.hasCallToAction ? "pass" : "fail",
      detail: extracted.hasCallToAction
        ? "Visitors immediately see what to do next (call, book, order)."
        : "No obvious 'call now' / 'book' / 'get a quote' action near the top of your page.",
      recommendation: "Put one primary button (call or book) in the first screen of your homepage.",
      impact: "high",
      weight: 4,
      effort: "quick",
    },
    {
      id: "conv-click-to-call",
      category: "guest",
      group: "Conversion",
      label: "Phone number is tap-to-call",
      status: signals.hasTelLink ? "pass" : "fail",
      detail: signals.hasTelLink
        ? "Mobile visitors can call you in one tap."
        : "Your phone number isn't a tel: link — mobile visitors have to copy-paste to call you.",
      recommendation: "Wrap your phone number in an <a href=\"tel:…\"> link.",
      impact: "high",
      weight: 4,
      effort: "quick",
    },
    {
      id: "conv-phone",
      category: "guest",
      group: "Conversion",
      label: "Phone number visible",
      status: extracted.phoneVisible || Boolean(extracted.phone) ? "pass" : "fail",
      detail: extracted.phone
        ? `${extracted.phone} is visible on the page.`
        : "No phone number visible — the #1 conversion path for local businesses.",
      impact: "high",
      weight: 3,
      effort: "quick",
    },
    {
      id: "conv-address",
      category: "guest",
      group: "Conversion",
      label: "Address / service area visible",
      status:
        extracted.addressVisible || Boolean(extracted.address) ? "pass" : "fail",
      detail: extracted.address
        ? `Location found: ${extracted.address.slice(0, 60)}`
        : "No address or service area on the page — customers can't tell if you serve them.",
      impact: "medium",
      weight: 3,
      effort: "quick",
    },
    {
      id: "conv-hours",
      category: "guest",
      group: "Conversion",
      label: "Business hours visible",
      status:
        extracted.hoursVisible || Boolean(extracted.hoursSummary)
          ? "pass"
          : "fail",
      detail: extracted.hoursSummary
        ? `Hours shown: ${extracted.hoursSummary.slice(0, 60)}`
        : "No hours on your site — 'are they open?' visitors bounce to a competitor who answers it.",
      impact: "medium",
      weight: 2,
      effort: "quick",
    },
    {
      id: "conv-mobile",
      category: "guest",
      group: "Conversion",
      label: "Mobile friendly",
      status: signals.hasViewportMeta ? "pass" : "fail",
      detail: signals.hasViewportMeta
        ? "Your site adapts to phone screens, where most local searches happen."
        : "No mobile viewport configured — your site renders desktop-sized on phones.",
      recommendation: "Use a responsive template with a viewport meta tag.",
      impact: "high",
      weight: 6,
      effort: "high",
    },
    {
      id: "conv-social-proof",
      category: "guest",
      group: "Conversion",
      label: "Reviews or testimonials shown",
      status: extracted.hasTestimonials ? "pass" : "fail",
      detail: extracted.hasTestimonials
        ? "Social proof on the page builds instant trust."
        : "No reviews or testimonials on your site — visitors leave to check Yelp and may not come back.",
      recommendation: "Embed 3-5 of your best Google reviews on the homepage.",
      impact: "medium",
      weight: 5,
      effort: "medium",
    },
    {
      id: "conv-services",
      category: "guest",
      group: "Conversion",
      label: "Services clearly listed",
      status:
        extracted.services.length >= 3
          ? "pass"
          : extracted.services.length >= 1
            ? "warn"
            : "fail",
      detail:
        extracted.services.length > 0
          ? `${extracted.services.length} services detected: ${extracted.services.slice(0, 4).join(", ")}`
          : "We couldn't find a clear list of what you offer.",
      impact: "medium",
      weight: 3,
      effort: "quick",
    },
  ];

  // ── Local Listings (20 pts) — derived from the GBP profile ─────────────
  const gbpField = (id: string) =>
    gbp.profileFields.find((f) => f.id === id) ??
    gbp.reviewFields.find((f) => f.id === id);

  const listingsSpec: Array<{
    id: string;
    gbpId: string;
    label: string;
    group: string;
    weight: number;
    impact: AuditCheck["impact"];
    effort: AuditCheck["effort"];
    recommendation?: string;
  }> = [
    { id: "gbp-website", gbpId: "website", label: "GBP links to your website", group: "Profile content", weight: 1.5, impact: "medium", effort: "quick" },
    { id: "gbp-description", gbpId: "description", label: "GBP description filled out", group: "Profile content", weight: 1.5, impact: "medium", effort: "quick", recommendation: "Write a 750-character description that names your services and city." },
    { id: "gbp-hours", gbpId: "hours", label: "GBP hours listed", group: "Profile content", weight: 1.5, impact: "high", effort: "quick", recommendation: "Add complete hours, including holiday hours." },
    { id: "gbp-phone", gbpId: "phone", label: "GBP phone number listed", group: "Profile content", weight: 1.5, impact: "high", effort: "quick" },
    { id: "gbp-categories", gbpId: "categories", label: "GBP categories match search demand", group: "Profile content", weight: 2, impact: "high", effort: "quick", recommendation: "Set the most-searched primary category and add relevant secondary categories." },
    { id: "gbp-social", gbpId: "social-links", label: "Social profiles linked on GBP", group: "Profile content", weight: 2, impact: "low", effort: "quick" },
    { id: "gbp-services", gbpId: "service-options", label: "Service options configured", group: "Profile content", weight: 2, impact: "low", effort: "quick" },
    { id: "nap-consistency", gbpId: "phone", label: "Name / address / phone consistent with website", group: "Profile content", weight: 4, impact: "high", effort: "medium", recommendation: "Make your name, address, and phone identical on your site, GBP, and top directories." },
    { id: "gbp-review-count", gbpId: "review-count", label: "Enough reviews to compete", group: "User-submitted content", weight: 1.5, impact: "high", effort: "high", recommendation: "Ask every happy customer for a review — steady velocity beats bursts." },
    { id: "gbp-review-rating", gbpId: "review-rating", label: "Rating above 4.0", group: "User-submitted content", weight: 1.5, impact: "high", effort: "high" },
    { id: "gbp-review-recency", gbpId: "review-recency", label: "Fresh reviews this month", group: "User-submitted content", weight: 0.5, impact: "medium", effort: "medium" },
    { id: "gbp-review-responses", gbpId: "review-responses", label: "Owner responds to reviews", group: "User-submitted content", weight: 0.5, impact: "medium", effort: "quick", recommendation: "Respond to every review — takes minutes, moves rankings and trust." },
  ];

  for (const spec of listingsSpec) {
    const field = gbpField(spec.gbpId);
    const status = field ? fromGbpStatus(field.status) : "unknown";
    checks.push({
      id: spec.id,
      category: "listings",
      group: spec.group,
      label: spec.label,
      status:
        spec.id === "nap-consistency"
          ? extracted.phone
            ? "pass"
            : "warn"
          : status,
      detail:
        spec.id === "nap-consistency"
          ? extracted.phone
            ? "Your phone number matches between your website and profile."
            : "We couldn't verify your phone/address consistency across listings."
          : (field?.detail ?? "Working on finding this data…"),
      recommendation: spec.recommendation,
      impact: spec.impact,
      weight: spec.weight,
      effort: spec.effort,
    });
  }

  return checks;
}

/**
 * No-website mode: every check that reads the website fails with explicit
 * "No website found" evidence. Listings (GBP) checks are left untouched —
 * they don't depend on a site existing.
 */
export function applyNoWebsiteOverrides(checks: AuditCheck[]): AuditCheck[] {
  return checks.map((check) => {
    if (check.category === "listings") return check;
    if (check.id === "gbp-website") return check;

    return {
      ...check,
      status: "fail" as const,
      detail:
        "No website found — this check can't pass without one. A missing website is the single biggest local visibility leak.",
      recommendation:
        "Launch even a simple one-page website with your name, services, city, phone, and hours — it unlocks every check in this section.",
    };
  });
}

function metricStatus(
  pageSpeed: PageSpeedData,
  id: "LCP" | "CLS" | "INP",
): AuditCheck["status"] {
  const metric = pageSpeed.metrics.find((m) => m.id === id);
  if (!metric || metric.rating === "unknown") return "unknown";
  if (metric.rating === "good") return "pass";
  if (metric.rating === "needs-improvement") return "warn";
  return "fail";
}

function metricDetail(
  pageSpeed: PageSpeedData,
  id: "LCP" | "CLS" | "INP",
  label: string,
): string {
  const metric = pageSpeed.metrics.find((m) => m.id === id);
  if (!metric || metric.rating === "unknown") {
    return "Google didn't return enough data for this metric yet.";
  }
  return `${label}: ${metric.displayValue} (${metric.rating === "good" ? "good" : metric.rating === "needs-improvement" ? "needs improvement" : "poor"}).`;
}
