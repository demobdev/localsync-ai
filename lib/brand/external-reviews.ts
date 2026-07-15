/**
 * Third-party reviews discovered for Local Map Co. (research Jul 15, 2026).
 * Primary public aggregator: Bark profile DBZD6 (pulls Google Maps, Facebook, BBB).
 * Do not invent star counts for platforms we could not verify live.
 */

export const REVIEW_PLATFORMS = [
  {
    id: "bark",
    name: "Bark",
    href: "https://www.bark.com/en/us/company/local-map-company/DBZD6/",
    rating: 5,
    reviewCount: 11,
    summary: "100% 5-star across 11 customer reviews",
    verified: true,
  },
  {
    id: "google",
    name: "Google Maps",
    href: "https://www.google.com/maps/search/?api=1&query=Local+Map+Co+Greenville+SC",
    rating: null as number | null,
    reviewCount: null as number | null,
    summary:
      "Multiple Google Maps reviews appear on Bark (exact live star count not scraped — claim GBP and pull via API)",
    verified: false,
  },
  {
    id: "facebook",
    name: "Facebook",
    href: "https://www.facebook.com/localmapco/",
    rating: null as number | null,
    reviewCount: null as number | null,
    summary: "~287 followers · page live but quiet (last visible post ~Jan 2022)",
    verified: false,
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    href: "https://www.linkedin.com/company/local-map-co",
    rating: null as number | null,
    reviewCount: null as number | null,
    summary: "Company page live · Greenville HQ listed",
    verified: true,
  },
  {
    id: "x",
    name: "X (Twitter)",
    href: "https://x.com/localmapco",
    rating: null as number | null,
    reviewCount: null as number | null,
    summary: "@localmapco · ~10 followers · quiet feed",
    verified: true,
  },
  {
    id: "instagram",
    name: "Instagram",
    href: null as string | null,
    rating: null as number | null,
    reviewCount: null as number | null,
    summary: "No verified @localmapco business profile found in search",
    verified: false,
  },
] as const;

export type ExternalReviewSource =
  | "Better Business Bureau"
  | "Google Maps"
  | "Facebook"
  | "Bark";

export const EXTERNAL_REVIEWS = [
  {
    author: "Sherlock Roof & Exterior Cleaning, Inc.",
    date: "2019-09-27",
    source: "Better Business Bureau" as ExternalReviewSource,
    quote:
      "They have done an outstanding job with advertising our company! They're knowledgeable, friendly, patient along with reasonable pricing. We highly recommend them!",
    stars: 5,
    featured: true,
    homepage: true,
  },
  {
    author: "GAR Disability Advocates",
    date: "2019-08-29",
    source: "Google Maps" as ExternalReviewSource,
    quote: "Local Map Co. Does a Great Job for our online marketing!",
    stars: 5,
    featured: true,
    homepage: false,
  },
  {
    author: "Jordan Mickel",
    date: "2017-11-10",
    source: "Google Maps" as ExternalReviewSource,
    quote:
      "Untouchable Customer Service! Simply put, LocalMap Co. is a company that puts it's clients first and delivers quality results.",
    stars: 5,
    featured: true,
    homepage: false,
  },
  {
    author: "Sheguee Roman",
    date: "2017-11-10",
    source: "Google Maps" as ExternalReviewSource,
    quote:
      "My business was at a standstill before we teamed up with Local Map Co. Now customers can search us locally and find us easily!",
    stars: 5,
    featured: true,
    homepage: true,
  },
  {
    author: "Bryant Cox",
    date: "2017-11-09",
    source: "Google Maps" as ExternalReviewSource,
    quote:
      "Localmap has literally put us on the map! By verifying our Google account and through other means of their creative marketing we have seen a rise in customer activity and overall business for our restaurant. With such a diverse and talented group of employees, localmap has a special talent for targeting your business needs. I highly recommend this company for further business growth.",
    stars: 5,
    featured: true,
    homepage: true,
  },
  {
    author: "Alec Ninan",
    date: "2017-07-12",
    source: "Facebook" as ExternalReviewSource,
    quote:
      "Great company with a new approach on marketing! Very resourceful! I highly recommend them to anyone!",
    stars: 5,
    featured: true,
    homepage: false,
  },
  {
    author: "Joey Vachon",
    date: "2017-06-10",
    source: "Facebook" as ExternalReviewSource,
    quote:
      "I've worked with Don in the past and very few people have the amount of understanding and abilities that this man does!",
    stars: 5,
    featured: true,
    homepage: false,
  },
  {
    author: "Bailee Bridges",
    date: "2017-06-10",
    source: "Facebook" as ExternalReviewSource,
    quote:
      "Fantastic company, extremely professional, goes above and beyond, and extraordinary customer care. Couldn't ask for a better Web Marketing company to take care of my company's needs!",
    stars: 5,
    featured: true,
    homepage: true,
  },
  {
    author: "Nerd Web",
    date: "2017-05-02",
    source: "Google Maps" as ExternalReviewSource,
    quote: "Great place",
    stars: 5,
    featured: false,
    homepage: false,
  },
  {
    author: "Don Bailey",
    date: "2019-08-29",
    source: "Google Maps" as ExternalReviewSource,
    quote: "Our white label relationship with LMC has proven fruitful.",
    stars: 5,
    featured: false,
    homepage: false,
    note: "White-label partner review",
  },
] as const;

export const HOMEPAGE_REVIEWS = EXTERNAL_REVIEWS.filter((r) => r.homepage);

export const SOCIAL_PRESENCE = {
  facebook: {
    href: "https://www.facebook.com/localmapco/",
    followersApprox: 287,
  },
  linkedin: {
    href: "https://www.linkedin.com/company/local-map-co",
    hq: "208 Guess Street Unit 4, Greenville, SC 29605",
  },
  x: {
    href: "https://x.com/localmapco",
    handle: "@localmapco",
    followersApprox: 10,
  },
  bark: {
    href: "https://www.bark.com/en/us/company/local-map-company/DBZD6/",
    rating: 5,
    reviewCount: 11,
  },
} as const;
