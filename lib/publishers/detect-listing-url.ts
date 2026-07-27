/**
 * Map listing/social URLs → publisher slugs and extract candidates from
 * website HTML, markdown, and profile sameAs links.
 */

/** Hostname fragment → publisher slug (first match wins). */
export const HOST_TO_PUBLISHER_SLUG: Array<{ host: string; slug: string }> = [
  { host: "facebook.com", slug: "facebook" },
  { host: "fb.com", slug: "facebook" },
  { host: "fb.me", slug: "facebook" },
  { host: "yelp.com", slug: "yelp" },
  { host: "bbb.org", slug: "bbb" },
  { host: "nextdoor.com", slug: "nextdoor" },
  { host: "businessconnect.apple.com", slug: "apple-business-connect" },
  { host: "maps.apple.com", slug: "apple-business-connect" },
  { host: "bingplaces.com", slug: "bing-places" },
  { host: "bing.com/maps", slug: "bing-places" },
  { host: "business.google.com", slug: "google-business-profile" },
  { host: "maps.google.com", slug: "google-business-profile" },
  { host: "google.com/maps", slug: "google-business-profile" },
  { host: "g.page", slug: "google-business-profile" },
  { host: "angi.com", slug: "angi" },
  { host: "angieslist.com", slug: "angi" },
  { host: "homeadvisor.com", slug: "homeadvisor" },
  { host: "thumbtack.com", slug: "thumbtack" },
  { host: "houzz.com", slug: "houzz" },
  { host: "tripadvisor.com", slug: "tripadvisor" },
  { host: "yellowpages.com", slug: "yellowpages" },
  { host: "foursquare.com", slug: "foursquare" },
  { host: "mapquest.com", slug: "mapquest" },
  { host: "instagram.com", slug: "instagram" },
  { host: "linkedin.com", slug: "linkedin" },
  { host: "youtube.com", slug: "youtube" },
  { host: "youtu.be", slug: "youtube" },
];

const URL_IN_TEXT =
  /https?:\/\/[^\s<>"'`)\]]+/gi;
const HREF_IN_HTML =
  /href\s*=\s*["'](https?:\/\/[^"']+)["']/gi;

function isFacebookHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^www\./, "");
  return (
    host === "facebook.com" ||
    host.endsWith(".facebook.com") ||
    host === "fb.com" ||
    host === "fb.me"
  );
}

/**
 * Prefer stable profile.php?id=… over /people/Name/ID (and similar)
 * which sites often emit but are weaker for audits/bookmarks.
 */
export function canonicalizeFacebookUrl(url: URL): URL {
  if (!isFacebookHost(url.hostname)) return url;

  const idFromQuery = url.searchParams.get("id");
  if (
    /profile\.php/i.test(url.pathname) &&
    idFromQuery &&
    /^\d+$/.test(idFromQuery)
  ) {
    return new URL(`https://www.facebook.com/profile.php?id=${idFromQuery}`);
  }

  const path = url.pathname.replace(/\/{2,}/g, "/");
  const people = path.match(/\/people\/[^/]+\/(\d+)\/?/i);
  if (people?.[1]) {
    return new URL(`https://www.facebook.com/profile.php?id=${people[1]}`);
  }

  const pages = path.match(/\/pages(?:\/category)?\/[^/]+\/(\d+)\/?/i);
  if (pages?.[1]) {
    return new URL(`https://www.facebook.com/profile.php?id=${pages[1]}`);
  }

  const bareId = path.match(/^\/(\d+)\/?$/);
  if (bareId?.[1]) {
    return new URL(`https://www.facebook.com/profile.php?id=${bareId[1]}`);
  }

  // Vanity / other paths — keep path, standardize host, drop hash/tracking.
  const clean = new URL(url.toString());
  clean.protocol = "https:";
  clean.hostname = "www.facebook.com";
  clean.hash = "";
  clean.pathname = path.replace(/\/+$/, "") || "/";
  for (const key of ["mibextid", "rdid", "share_url", "ref", "fref"]) {
    clean.searchParams.delete(key);
  }
  return clean;
}

export function normalizeListingUrl(raw: string): string | null {
  const trimmed = raw.trim().replace(/[),.]+$/, "");
  if (!trimmed) return null;
  try {
    const withProto = /^https?:\/\//i.test(trimmed)
      ? trimmed
      : `https://${trimmed}`;
    let url = new URL(withProto);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    url.hash = "";
    // Collapse accidental double slashes in path (…/6157//)
    url.pathname = url.pathname.replace(/\/{2,}/g, "/");
    if (isFacebookHost(url.hostname)) {
      url = canonicalizeFacebookUrl(url);
    }
    return url.toString();
  } catch {
    return null;
  }
}

export function publisherSlugForListingUrl(url: string): string | null {
  let hostname: string;
  let pathname: string;
  try {
    const parsed = new URL(
      /^https?:\/\//i.test(url) ? url : `https://${url}`,
    );
    hostname = parsed.hostname.toLowerCase().replace(/^www\./, "");
    pathname = parsed.pathname.toLowerCase();
  } catch {
    return null;
  }

  const haystack = `${hostname}${pathname}`;
  for (const { host, slug } of HOST_TO_PUBLISHER_SLUG) {
    if (haystack.includes(host) || hostname.endsWith(host)) {
      return slug;
    }
  }
  return null;
}

/** Collect unique http(s) URLs from HTML hrefs + free text / markdown. */
export function extractCandidateUrls(...sources: Array<string | null | undefined>): string[] {
  const found = new Set<string>();

  for (const source of sources) {
    if (!source) continue;

    HREF_IN_HTML.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = HREF_IN_HTML.exec(source)) !== null) {
      const normalized = normalizeListingUrl(match[1] ?? "");
      if (normalized) found.add(normalized);
    }

    URL_IN_TEXT.lastIndex = 0;
    while ((match = URL_IN_TEXT.exec(source)) !== null) {
      const normalized = normalizeListingUrl(match[0] ?? "");
      if (normalized) found.add(normalized);
    }
  }

  return Array.from(found);
}

export type DiscoveredListingLink = {
  url: string;
  publisherSlug: string;
};

export function isLikelyProfileUrl(url: string, slug: string): boolean {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname.replace(/\/+$/, "");
    if (path.length < 2) return false;
    if (
      /\/(share|sharer|login|signup|dialog|plugins|privacy|help|watch)\b/i.test(
        path,
      )
    ) {
      return false;
    }
    if (slug === "facebook" && path.split("/").filter(Boolean).length < 1) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/** Map candidate URLs to known publisher slugs (one URL per slug — prefer longer path). */
export function matchListingUrlsToPublishers(
  urls: string[],
): DiscoveredListingLink[] {
  const bySlug = new Map<string, string>();

  for (const url of urls) {
    const slug = publisherSlugForListingUrl(url);
    if (!slug) continue;
    if (!isLikelyProfileUrl(url, slug)) continue;
    const existing = bySlug.get(slug);
    if (!existing || url.length > existing.length) {
      bySlug.set(slug, url);
    }
  }

  return Array.from(bySlug.entries()).map(([publisherSlug, url]) => ({
    publisherSlug,
    url,
  }));
}
