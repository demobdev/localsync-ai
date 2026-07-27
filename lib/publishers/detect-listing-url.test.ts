import { describe, expect, it } from "vitest";

import {
  extractCandidateUrls,
  matchListingUrlsToPublishers,
  normalizeListingUrl,
  publisherSlugForListingUrl,
} from "@/lib/publishers/detect-listing-url";

describe("publisherSlugForListingUrl", () => {
  it("maps facebook and yelp hosts", () => {
    expect(
      publisherSlugForListingUrl("https://www.facebook.com/OwnersBoxGVL"),
    ).toBe("facebook");
    expect(
      publisherSlugForListingUrl("https://www.yelp.com/biz/the-owners-box"),
    ).toBe("yelp");
  });
});

describe("normalizeListingUrl facebook", () => {
  it("rewrites /people/Name/ID to profile.php?id=", () => {
    expect(
      normalizeListingUrl(
        "https://www.facebook.com/people/The-Owners-Box/61572349191177//",
      ),
    ).toBe("https://www.facebook.com/profile.php?id=61572349191177");
  });

  it("keeps profile.php?id= canonical", () => {
    expect(
      normalizeListingUrl(
        "https://www.facebook.com/profile.php?id=61572349191177#",
      ),
    ).toBe("https://www.facebook.com/profile.php?id=61572349191177");
  });
});

describe("extract + match", () => {
  it("canonicalizes facebook people URLs when matching", () => {
    const html = `
      <a href="https://www.facebook.com/people/The-Owners-Box/61572349191177/">FB</a>
      <a href="https://www.yelp.com/biz/the-owners-box-greenville">Yelp</a>
      <a href="https://www.facebook.com/sharer/sharer.php">share</a>
    `;
    const urls = extractCandidateUrls(html);
    const matched = matchListingUrlsToPublishers(urls);
    const facebook = matched.find((m) => m.publisherSlug === "facebook");
    expect(facebook?.url).toBe(
      "https://www.facebook.com/profile.php?id=61572349191177",
    );
    expect(matched.some((m) => m.publisherSlug === "yelp")).toBe(true);
  });
});
