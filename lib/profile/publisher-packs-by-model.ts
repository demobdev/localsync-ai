import type { GraderOperatingModel } from "@/lib/grader/types";

/** Priority publisher slugs to highlight per operating model (Gate D). */
const PACKS: Record<GraderOperatingModel, string[]> = {
  storefront: [
    "google-business-profile",
    "yelp",
    "apple-business-connect",
    "bing-places",
    "facebook",
  ],
  mobile: [
    "google-business-profile",
    "facebook",
    "yelp",
    "nextdoor",
  ],
  service_area: [
    "google-business-profile",
    "yelp",
    "bbb",
    "facebook",
    "bing-places",
  ],
  online: [
    "google-business-profile",
    "facebook",
    "yelp",
    "bing-places",
  ],
};

export function recommendedPublisherSlugs(
  model: GraderOperatingModel = "storefront",
): string[] {
  return PACKS[model];
}

export function listingsDescriptionForModel(
  model: GraderOperatingModel = "storefront",
): string {
  const slugs = recommendedPublisherSlugs(model);
  const labels = slugs
    .slice(0, 4)
    .map((slug) =>
      slug
        .replace(/-/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase()),
    )
    .join(", ");

  switch (model) {
    case "mobile":
      return `Start with ${labels} — where mobile customers search schedules and menus.`;
    case "service_area":
      return `Home-services buyers check ${labels} before they call — add URLs to audit consistency.`;
    case "online":
      return `Citations on ${labels} still matter for local trust even without foot traffic.`;
    default:
      return `Add ${labels} URLs. We crawl and compare them to your master profile.`;
  }
}
