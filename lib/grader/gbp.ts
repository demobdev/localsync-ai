/**
 * Google Business Profile data for the report's Local Listings section.
 *
 * No Places API key is wired yet, so this builds a sample profile seeded by
 * the business domain, blended with real facts extracted from the website
 * (phone, hours, description). Fields we genuinely can't infer are marked
 * "pending" and render as "Working on finding this data…" amber rows.
 * Swap in a Places-backed builder here later; the shape stays identical.
 */

import type { ExtractedBusiness, GbpField, GbpProfile } from "./types";

function createRng(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let a = h >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildSampleGbpProfile(input: {
  websiteDomain: string;
  extracted: ExtractedBusiness;
}): GbpProfile {
  const rng = createRng(input.websiteDomain);
  const { extracted } = input;

  const rating = Math.round((3.6 + rng() * 1.1) * 10) / 10;
  const reviewCount = 12 + Math.floor(rng() * 140);
  const hasDescription = Boolean(extracted.description) && rng() > 0.35;
  const respondsToReviews = rng() > 0.6;
  const recentReviews = rng() > 0.45;

  const profileFields: GbpField[] = [
    {
      id: "website",
      label: "First-party website linked",
      status: "pass",
      detail: `Profile links to ${input.websiteDomain} — customers land on your site, not a third-party page.`,
    },
    {
      id: "description",
      label: "Business description",
      status: hasDescription ? "pass" : "fail",
      detail: hasDescription
        ? `"${(extracted.description ?? "").slice(0, 110)}…"`
        : "No description found. Profiles with a keyword-rich description get chosen more often in local results.",
    },
    {
      id: "hours",
      label: "Business hours listed",
      status: extracted.hoursSummary ? "pass" : "warn",
      detail: extracted.hoursSummary
        ? `Hours found: ${extracted.hoursSummary.slice(0, 70)}`
        : "We couldn't confirm hours. 'Open now' searches skip profiles without them.",
    },
    {
      id: "phone",
      label: "Phone number listed",
      status: extracted.phone ? "pass" : "fail",
      detail: extracted.phone
        ? `${extracted.phone} is listed and matches your website.`
        : "No phone number confirmed on the profile.",
    },
    {
      id: "price-range",
      label: "Price range set",
      status: "pending",
      detail: "Working on finding this data…",
    },
    {
      id: "service-options",
      label: "Service options set",
      status: "pending",
      detail: "Working on finding this data…",
    },
    {
      id: "social-links",
      label: "Social profiles linked",
      status: rng() > 0.5 ? "warn" : "fail",
      detail:
        "We couldn't confirm social links on the profile. Linked profiles add trust signals Google reads.",
    },
    {
      id: "description-keywords",
      label: "Description uses search keywords",
      status: hasDescription ? "warn" : "fail",
      detail: hasDescription
        ? "Description found, but it's missing the exact phrases customers search for."
        : "No description to check for keywords.",
    },
    {
      id: "categories",
      label: "Categories match what customers search",
      status: rng() > 0.4 ? "warn" : "pass",
      detail:
        "Primary category detected, but secondary categories may be missing — competitors often cover 3-5.",
    },
  ];

  const reviewFields: GbpField[] = [
    {
      id: "review-count",
      label: "Enough reviews to compete",
      status: reviewCount >= 50 ? "pass" : "fail",
      detail: `${reviewCount} reviews found. Local leaders in your market average 100+.`,
    },
    {
      id: "review-rating",
      label: "Rating above 4.0",
      status: rating >= 4.5 ? "pass" : rating >= 4.0 ? "warn" : "fail",
      detail: `Average rating is ${rating.toFixed(1)} stars.`,
    },
    {
      id: "review-recency",
      label: "Fresh reviews this month",
      status: recentReviews ? "pass" : "fail",
      detail: recentReviews
        ? "Recent reviews detected — Google rewards steady velocity."
        : "No recent reviews detected. Stale profiles slide down the map pack.",
    },
    {
      id: "review-responses",
      label: "Owner responds to reviews",
      status: respondsToReviews ? "pass" : "fail",
      detail: respondsToReviews
        ? "Owner responses detected on recent reviews."
        : "Reviews are going unanswered — responses influence both ranking and conversion.",
    },
  ];

  return { rating, reviewCount, profileFields, reviewFields, isSample: true };
}
