/**
 * Canonical Local Map Co. company facts for the domain transfer to this platform.
 * Sourced from localmap.co (Firecrawl scrape, Jul 2026).
 */
export const COMPANY = {
  legalName: "Midas Holdings LLC",
  brandName: "Local Map Co.",
  shortBrand: "LocalMap",
  tagline: "Get Found Online",
  domain: "localmap.co",
  siteUrl: "https://localmap.co",
  foundedYear: 2016,
  address: {
    street: "8220 Three Springs Trl",
    city: "Greenville",
    state: "South Carolina",
    zip: "29615",
    stateCode: "SC",
  },
  phoneDisplay: "(888) 418-7335",
  phoneTel: "+18884187335",
  emailAccounts: "accounts@localmap.co",
  emailDevelopment: "development@localmap.co",
  emailPrivacy: "accounts@localmap.co",
  hours: "Mon–Fri, 8am–5pm ET",
  social: {
    facebook: "https://www.facebook.com/localmapco/",
    twitter: "https://x.com/localmapco",
    linkedin: "https://www.linkedin.com/company/local-map-co/",
    bark: "https://www.bark.com/en/us/company/local-map-company/DBZD6/",
  },
  /** Legacy WordPress client portal — keep until fully replaced by this app. */
  clientPortal: "https://localmapco.joinportal.com/login?step=signIn",
} as const;

/** Agency heritage services from localmap.co — not replaced by SaaS SKUs. */
export const AGENCY_SERVICE_LINES = [
  "Web design",
  "Local SEO",
  "Pay-per-click",
  "Social media",
  "Retargeting",
  "Live chat",
  "Multimedia (video, photo, audio)",
  "Reputation management",
] as const;

/**
 * Legacy managed SEO shop packages (monthly). Listing management was always
 * in the bundle — that rail is what this SaaS productizes.
 */
export const LEGACY_SEO_PACKAGES = [
  {
    name: "Compass",
    priceMonthly: 250,
    focus: "Low competition / blue-collar services",
    keywords: 2,
  },
  {
    name: "Atlas",
    priceMonthly: 500,
    focus: "Medium competition / white-collar services",
    keywords: 5,
  },
  {
    name: "Globe",
    priceMonthly: 1000,
    focus: "High competition / small businesses",
    keywords: 10,
  },
  {
    name: "Galaxy",
    priceMonthly: 2500,
    focus: "High competition / large cities",
    keywords: 10,
  },
] as const;

export const HERITAGE_STATS = [
  { value: "317", label: "Avg. citation count" },
  { value: "649", label: "Avg. backlink count" },
  { value: "50", label: "States served" },
  { value: "343", label: "Active campaigns" },
] as const;

export const HERITAGE_TESTIMONIALS = [
  {
    quote:
      "Working with Local Map has been one of the best decisions of my business career. They were able to develop a brilliant website. They captured excellent video footage of client testimonials. I've experienced a noticeable difference in web traffic as a direct result of work.",
    name: "Stoney Craven, ESQ",
    role: "Owner, The Law Office of James Stone Craven",
  },
  {
    quote:
      "They have done an outstanding job with advertising our company! They're knowledgeable, friendly, patient along with reasonable pricing. We highly recommend them!",
    name: "Tom Butler",
    role: "Owner, Sherlock Roof Cleaning",
  },
  {
    quote:
      "Local Map Co has been amazing to work with! They completely re-vamped my whole website from scratch. They even provided original video and photography. I'm already getting calls — I'm very satisfied with their service!",
    name: "Dr. Jenny Malkiel",
    role: "Owner, Modern Chiropractic",
  },
] as const;
