/**
 * Per-industry constants for the grader: display names, keyword nouns,
 * revenue-model inputs, and competitor-name pools. Slugs match
 * lib/taxonomy/category-packs.ts so the taxonomy stays the single source of
 * industry identity.
 */

export type IndustryProfile = {
  slug: string;
  /** Human noun used in keyword templates, e.g. "hvac company". */
  categoryNoun: string;
  /** Shorter noun for competitor names, e.g. "Heating & Air". */
  tradeNoun: string;
  /** Two representative services used in keyword templates. */
  serviceTerms: [string, string];
  /** Average revenue from one new customer (used in the leak estimate). */
  avgCustomerValue: number;
  /** Rough local monthly searches across the audited keyword set. */
  estimatedMonthlySearches: number;
  /** Name fragments for plausible sample competitors. */
  competitorStyles: string[];
};

const DEFAULT_PROFILE: IndustryProfile = {
  slug: "retail",
  categoryNoun: "local business",
  tradeNoun: "Services",
  serviceTerms: ["services", "shop"],
  avgCustomerValue: 120,
  estimatedMonthlySearches: 900,
  competitorStyles: ["{city} {trade} Co.", "Main Street {trade}", "Premier {trade}"],
};

const PROFILES: Record<string, IndustryProfile> = {
  hvac: {
    slug: "hvac",
    categoryNoun: "hvac company",
    tradeNoun: "Heating & Air",
    serviceTerms: ["ac repair", "furnace repair"],
    avgCustomerValue: 450,
    estimatedMonthlySearches: 1400,
    competitorStyles: [
      "{city} {trade}",
      "Comfort Pro {trade}",
      "All Seasons {trade}",
      "Reliable Air & Heat",
    ],
  },
  plumbing: {
    slug: "plumbing",
    categoryNoun: "plumber",
    tradeNoun: "Plumbing",
    serviceTerms: ["drain cleaning", "water heater repair"],
    avgCustomerValue: 380,
    estimatedMonthlySearches: 1600,
    competitorStyles: [
      "{city} {trade} Pros",
      "Rapid Rooter {trade}",
      "BlueLine {trade}",
      "First Call {trade}",
    ],
  },
  restoration: {
    slug: "restoration",
    categoryNoun: "restoration company",
    tradeNoun: "Restoration",
    serviceTerms: ["water damage restoration", "mold remediation"],
    avgCustomerValue: 2800,
    estimatedMonthlySearches: 500,
    competitorStyles: ["{city} {trade}", "Rescue One {trade}", "DryFast {trade}"],
  },
  roofing: {
    slug: "roofing",
    categoryNoun: "roofing company",
    tradeNoun: "Roofing",
    serviceTerms: ["roof repair", "roof replacement"],
    avgCustomerValue: 8500,
    estimatedMonthlySearches: 800,
    competitorStyles: ["{city} {trade}", "Summit {trade}", "TopShield {trade}"],
  },
  electrical: {
    slug: "electrical",
    categoryNoun: "electrician",
    tradeNoun: "Electric",
    serviceTerms: ["panel upgrade", "ev charger installation"],
    avgCustomerValue: 420,
    estimatedMonthlySearches: 1100,
    competitorStyles: ["{city} {trade}", "Bright Spark {trade}", "Volt Pro {trade}"],
  },
  landscaping: {
    slug: "landscaping",
    categoryNoun: "landscaping company",
    tradeNoun: "Landscaping",
    serviceTerms: ["lawn care", "landscape design"],
    avgCustomerValue: 350,
    estimatedMonthlySearches: 1000,
    competitorStyles: ["{city} {trade}", "GreenScape {trade}", "Evergreen {trade}"],
  },
  "pest-control": {
    slug: "pest-control",
    categoryNoun: "pest control company",
    tradeNoun: "Pest Control",
    serviceTerms: ["termite treatment", "rodent control"],
    avgCustomerValue: 320,
    estimatedMonthlySearches: 950,
    competitorStyles: ["{city} {trade}", "Shield {trade}", "BugOut {trade}"],
  },
  "internet-saas": {
    slug: "internet-saas",
    categoryNoun: "software company",
    tradeNoun: "Software",
    serviceTerms: ["local seo software", "listing management"],
    avgCustomerValue: 1200,
    estimatedMonthlySearches: 600,
    competitorStyles: ["{trade} Labs", "Nimbus {trade}", "Signal {trade}"],
  },
  "marketing-agency": {
    slug: "marketing-agency",
    categoryNoun: "marketing agency",
    tradeNoun: "Marketing",
    serviceTerms: ["local seo services", "google business profile management"],
    avgCustomerValue: 2400,
    estimatedMonthlySearches: 700,
    competitorStyles: ["{city} {trade} Group", "Beacon {trade}", "GrowthWorks {trade}"],
  },
  "it-services": {
    slug: "it-services",
    categoryNoun: "it services company",
    tradeNoun: "IT Services",
    serviceTerms: ["managed it support", "cybersecurity services"],
    avgCustomerValue: 3200,
    estimatedMonthlySearches: 450,
    competitorStyles: ["{city} {trade}", "NetCore {trade}", "TrueNorth {trade}"],
  },
  legal: {
    slug: "legal",
    categoryNoun: "law firm",
    tradeNoun: "Law",
    serviceTerms: ["personal injury lawyer", "estate planning attorney"],
    avgCustomerValue: 5200,
    estimatedMonthlySearches: 1300,
    competitorStyles: ["{city} {trade} Group", "Harper & Stone {trade}", "Landmark {trade}"],
  },
  accounting: {
    slug: "accounting",
    categoryNoun: "accounting firm",
    tradeNoun: "Accounting",
    serviceTerms: ["tax preparation", "bookkeeping services"],
    avgCustomerValue: 1500,
    estimatedMonthlySearches: 800,
    competitorStyles: ["{city} {trade} Partners", "Ledger & Co.", "ClearBooks {trade}"],
  },
  consulting: {
    slug: "consulting",
    categoryNoun: "business consultant",
    tradeNoun: "Consulting",
    serviceTerms: ["business strategy", "operations consulting"],
    avgCustomerValue: 4500,
    estimatedMonthlySearches: 350,
    competitorStyles: ["{city} {trade} Group", "NorthPeak {trade}", "Catalyst {trade}"],
  },
  dental: {
    slug: "dental",
    categoryNoun: "dentist",
    tradeNoun: "Dental",
    serviceTerms: ["teeth cleaning", "emergency dentist"],
    avgCustomerValue: 1800,
    estimatedMonthlySearches: 1700,
    competitorStyles: ["{city} Family {trade}", "BrightSmile {trade}", "Lakeside {trade}"],
  },
  medical: {
    slug: "medical",
    categoryNoun: "medical clinic",
    tradeNoun: "Medical",
    serviceTerms: ["primary care", "urgent care"],
    avgCustomerValue: 900,
    estimatedMonthlySearches: 1500,
    competitorStyles: ["{city} {trade} Center", "CarePoint {trade}", "Wellness One {trade}"],
  },
  veterinary: {
    slug: "veterinary",
    categoryNoun: "veterinarian",
    tradeNoun: "Animal Hospital",
    serviceTerms: ["pet vaccinations", "emergency vet"],
    avgCustomerValue: 650,
    estimatedMonthlySearches: 1200,
    competitorStyles: ["{city} {trade}", "Paws & Claws Vet", "Companion {trade}"],
  },
  restaurant: {
    slug: "restaurant",
    categoryNoun: "restaurant",
    tradeNoun: "Kitchen",
    serviceTerms: ["takeout", "catering"],
    avgCustomerValue: 45,
    estimatedMonthlySearches: 2600,
    competitorStyles: ["The {city} {trade}", "Harvest Table", "Corner {trade}"],
  },
  retail: {
    slug: "retail",
    categoryNoun: "shop",
    tradeNoun: "Mercantile",
    serviceTerms: ["gift shop", "local delivery"],
    avgCustomerValue: 85,
    estimatedMonthlySearches: 1100,
    competitorStyles: ["{city} {trade}", "Main Street Goods", "The Local {trade}"],
  },
  "real-estate": {
    slug: "real-estate",
    categoryNoun: "real estate agent",
    tradeNoun: "Realty",
    serviceTerms: ["homes for sale", "sell my house"],
    avgCustomerValue: 9000,
    estimatedMonthlySearches: 1900,
    competitorStyles: ["{city} {trade} Group", "Keystone {trade}", "Homestead {trade}"],
  },
  "auto-repair": {
    slug: "auto-repair",
    categoryNoun: "auto repair shop",
    tradeNoun: "Auto Care",
    serviceTerms: ["brake service", "oil change"],
    avgCustomerValue: 380,
    estimatedMonthlySearches: 1400,
    competitorStyles: ["{city} {trade}", "Precision {trade}", "TrustWorthy {trade}"],
  },
};

export const INDUSTRY_SLUGS = Object.keys(PROFILES);

export function getIndustryProfile(slug: string | null | undefined): IndustryProfile {
  if (!slug) return DEFAULT_PROFILE;
  return PROFILES[slug] ?? DEFAULT_PROFILE;
}
