export type PublisherRail = "api" | "guided_import" | "manual" | "audit_only";

export type PublisherSeed = {
  slug: string;
  name: string;
  rail: PublisherRail;
  websiteUrl: string;
  description: string;
  isCore: boolean;
  isHomeServices: boolean;
  sortOrder: number;
  checklistMarkdown?: string;
  requiredFields: Array<{
    fieldKey: string;
    label: string;
    isRequired?: boolean;
    description?: string;
    sortOrder: number;
  }>;
};

export const PUBLISHER_SEEDS: PublisherSeed[] = [
  {
    slug: "google-business-profile",
    name: "Google Business Profile",
    rail: "api",
    websiteUrl: "https://business.google.com",
    description: "Primary local search presence on Google Search and Maps.",
    isCore: true,
    isHomeServices: false,
    sortOrder: 1,
    requiredFields: [
      { fieldKey: "name", label: "Business name", sortOrder: 1 },
      { fieldKey: "addressLine1", label: "Address", sortOrder: 2 },
      { fieldKey: "phone", label: "Phone", sortOrder: 3 },
      { fieldKey: "website", label: "Website", sortOrder: 4 },
      { fieldKey: "regularHours", label: "Hours", sortOrder: 5 },
      { fieldKey: "categorySlug", label: "Primary category", sortOrder: 6 },
    ],
  },
  {
    slug: "bing-places",
    name: "Bing Places",
    rail: "guided_import",
    websiteUrl: "https://www.bingplaces.com",
    description: "Microsoft Bing local listings. No public write API — guided import from Google.",
    isCore: true,
    isHomeServices: false,
    sortOrder: 2,
    checklistMarkdown:
      "- Sign in to Bing Places\n- Choose import from Google Business Profile\n- Verify imported NAP and hours\n- Confirm categories and photos",
    requiredFields: [
      { fieldKey: "name", label: "Business name", sortOrder: 1 },
      { fieldKey: "addressLine1", label: "Address", sortOrder: 2 },
      { fieldKey: "phone", label: "Phone", sortOrder: 3 },
    ],
  },
  {
    slug: "apple-business-connect",
    name: "Apple Business Connect",
    rail: "audit_only",
    websiteUrl: "https://businessconnect.apple.com",
    description: "Apple Maps business listings. Audit and manual update only at launch.",
    isCore: true,
    isHomeServices: false,
    sortOrder: 3,
    requiredFields: [
      { fieldKey: "name", label: "Business name", sortOrder: 1 },
      { fieldKey: "addressLine1", label: "Address", sortOrder: 2 },
      { fieldKey: "phone", label: "Phone", sortOrder: 3 },
    ],
  },
  {
    slug: "facebook",
    name: "Facebook",
    rail: "audit_only",
    websiteUrl: "https://www.facebook.com",
    description: "Facebook business page/listing presence.",
    isCore: true,
    isHomeServices: false,
    sortOrder: 4,
    requiredFields: [
      { fieldKey: "name", label: "Page name", sortOrder: 1 },
      { fieldKey: "phone", label: "Phone", sortOrder: 2 },
      { fieldKey: "website", label: "Website", sortOrder: 3 },
    ],
  },
  {
    slug: "yelp",
    name: "Yelp",
    rail: "audit_only",
    websiteUrl: "https://www.yelp.com",
    description: "Yelp business profile. Audit-only at launch.",
    isCore: true,
    isHomeServices: false,
    sortOrder: 5,
    requiredFields: [
      { fieldKey: "name", label: "Business name", sortOrder: 1 },
      { fieldKey: "addressLine1", label: "Address", sortOrder: 2 },
      { fieldKey: "phone", label: "Phone", sortOrder: 3 },
    ],
  },
  {
    slug: "nextdoor",
    name: "Nextdoor",
    rail: "manual",
    websiteUrl: "https://business.nextdoor.com",
    description: "Neighborhood business listings for local home services demand.",
    isCore: true,
    isHomeServices: true,
    sortOrder: 6,
    requiredFields: [
      { fieldKey: "name", label: "Business name", sortOrder: 1 },
      { fieldKey: "city", label: "Service area", sortOrder: 2 },
      { fieldKey: "phone", label: "Phone", sortOrder: 3 },
    ],
  },
  {
    slug: "bbb",
    name: "Better Business Bureau",
    rail: "manual",
    websiteUrl: "https://www.bbb.org",
    description: "Trust and accreditation listing for local service businesses.",
    isCore: true,
    isHomeServices: false,
    sortOrder: 7,
    requiredFields: [
      { fieldKey: "name", label: "Business name", sortOrder: 1 },
      { fieldKey: "addressLine1", label: "Address", sortOrder: 2 },
      { fieldKey: "phone", label: "Phone", sortOrder: 3 },
    ],
  },
  {
    slug: "angi",
    name: "Angi",
    rail: "manual",
    websiteUrl: "https://www.angi.com",
    description: "Home services lead marketplace and directory.",
    isCore: false,
    isHomeServices: true,
    sortOrder: 8,
    requiredFields: [
      { fieldKey: "name", label: "Business name", sortOrder: 1 },
      { fieldKey: "serviceSlugs", label: "Services offered", sortOrder: 2 },
      { fieldKey: "phone", label: "Phone", sortOrder: 3 },
    ],
  },
  {
    slug: "homeadvisor",
    name: "HomeAdvisor",
    rail: "manual",
    websiteUrl: "https://www.homeadvisor.com",
    description: "Home services contractor directory and lead platform.",
    isCore: false,
    isHomeServices: true,
    sortOrder: 9,
    requiredFields: [
      { fieldKey: "name", label: "Business name", sortOrder: 1 },
      { fieldKey: "serviceSlugs", label: "Services offered", sortOrder: 2 },
      { fieldKey: "phone", label: "Phone", sortOrder: 3 },
    ],
  },
  {
    slug: "thumbtack",
    name: "Thumbtack",
    rail: "manual",
    websiteUrl: "https://www.thumbtack.com",
    description: "Local pro marketplace for home services.",
    isCore: false,
    isHomeServices: true,
    sortOrder: 10,
    requiredFields: [
      { fieldKey: "name", label: "Business name", sortOrder: 1 },
      { fieldKey: "serviceSlugs", label: "Services offered", sortOrder: 2 },
    ],
  },
  {
    slug: "houzz",
    name: "Houzz",
    rail: "manual",
    websiteUrl: "https://www.houzz.com",
    description: "Home improvement and contractor discovery platform.",
    isCore: false,
    isHomeServices: true,
    sortOrder: 11,
    requiredFields: [
      { fieldKey: "name", label: "Business name", sortOrder: 1 },
      { fieldKey: "website", label: "Website", sortOrder: 2 },
    ],
  },
  {
    slug: "porch",
    name: "Porch",
    rail: "manual",
    websiteUrl: "https://porch.com",
    description: "Home services professional directory.",
    isCore: false,
    isHomeServices: true,
    sortOrder: 12,
    requiredFields: [
      { fieldKey: "name", label: "Business name", sortOrder: 1 },
      { fieldKey: "phone", label: "Phone", sortOrder: 2 },
    ],
  },
  {
    slug: "buildzoom",
    name: "BuildZoom",
    rail: "audit_only",
    websiteUrl: "https://www.buildzoom.com",
    description: "Contractor licensing and project history directory.",
    isCore: false,
    isHomeServices: true,
    sortOrder: 13,
    requiredFields: [
      { fieldKey: "name", label: "Business name", sortOrder: 1 },
      { fieldKey: "state", label: "License state", sortOrder: 2 },
    ],
  },
  {
    slug: "yellow-pages",
    name: "Yellow Pages",
    rail: "manual",
    websiteUrl: "https://www.yellowpages.com",
    description: "Legacy directory still referenced by data aggregators.",
    isCore: true,
    isHomeServices: false,
    sortOrder: 14,
    requiredFields: [
      { fieldKey: "name", label: "Business name", sortOrder: 1 },
      { fieldKey: "addressLine1", label: "Address", sortOrder: 2 },
      { fieldKey: "phone", label: "Phone", sortOrder: 3 },
    ],
  },
  {
    slug: "foursquare",
    name: "Foursquare",
    rail: "audit_only",
    websiteUrl: "https://foursquare.com",
    description: "Location data platform consumed by many apps and aggregators.",
    isCore: true,
    isHomeServices: false,
    sortOrder: 15,
    requiredFields: [
      { fieldKey: "name", label: "Business name", sortOrder: 1 },
      { fieldKey: "addressLine1", label: "Address", sortOrder: 2 },
    ],
  },
  {
    slug: "mapquest",
    name: "MapQuest",
    rail: "audit_only",
    websiteUrl: "https://www.mapquest.com",
    description: "Map and local listing presence.",
    isCore: true,
    isHomeServices: false,
    sortOrder: 16,
    requiredFields: [
      { fieldKey: "name", label: "Business name", sortOrder: 1 },
      { fieldKey: "addressLine1", label: "Address", sortOrder: 2 },
    ],
  },
  {
    slug: "citysearch",
    name: "Citysearch",
    rail: "audit_only",
    websiteUrl: "https://www.citysearch.com",
    description: "Local business directory.",
    isCore: false,
    isHomeServices: false,
    sortOrder: 17,
    requiredFields: [
      { fieldKey: "name", label: "Business name", sortOrder: 1 },
      { fieldKey: "city", label: "City", sortOrder: 2 },
    ],
  },
  {
    slug: "merchantcircle",
    name: "MerchantCircle",
    rail: "manual",
    websiteUrl: "https://www.merchantcircle.com",
    description: "Small business directory and reviews.",
    isCore: false,
    isHomeServices: true,
    sortOrder: 18,
    requiredFields: [
      { fieldKey: "name", label: "Business name", sortOrder: 1 },
      { fieldKey: "phone", label: "Phone", sortOrder: 2 },
    ],
  },
  {
    slug: "expertise",
    name: "Expertise.com",
    rail: "audit_only",
    websiteUrl: "https://www.expertise.com",
    description: "Curated local service provider lists.",
    isCore: false,
    isHomeServices: true,
    sortOrder: 19,
    requiredFields: [
      { fieldKey: "name", label: "Business name", sortOrder: 1 },
      { fieldKey: "city", label: "City", sortOrder: 2 },
    ],
  },
  {
    slug: "manta",
    name: "Manta",
    rail: "audit_only",
    websiteUrl: "https://www.manta.com",
    description: "Small business directory and data syndication source.",
    isCore: false,
    isHomeServices: false,
    sortOrder: 20,
    requiredFields: [
      { fieldKey: "name", label: "Business name", sortOrder: 1 },
      { fieldKey: "addressLine1", label: "Address", sortOrder: 2 },
      { fieldKey: "phone", label: "Phone", sortOrder: 3 },
    ],
  },
];
