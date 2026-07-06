/**
 * What a category "pack" preloads when a user picks a niche.
 * Today we apply services + description on create; FAQ/publisher/GBP hints are next.
 */
export type CategoryPack = {
  slug: string;
  /** Applied to profile.serviceSlugs on onboarding (must exist in service_taxonomy). */
  defaultServiceSlugs: string[];
  /** Starter description; `{name}` is replaced with the business name. */
  descriptionTemplate?: string;
  /** GBP primary category hint for future write-sync (not shown in UI yet). */
  gbpPrimaryCategory?: string;
};

const PACKS: Record<string, CategoryPack> = {
  hvac: {
    slug: "hvac",
    defaultServiceSlugs: [
      "ac-repair",
      "heating-repair",
      "hvac-maintenance",
      "emergency-hvac",
    ],
    descriptionTemplate:
      "{name} provides heating, cooling, and indoor comfort services for homes and light commercial properties.",
    gbpPrimaryCategory: "HVAC contractor",
  },
  plumbing: {
    slug: "plumbing",
    defaultServiceSlugs: [
      "drain-cleaning",
      "water-heater-repair",
      "leak-detection",
      "fixture-installation",
    ],
    descriptionTemplate:
      "{name} offers residential and commercial plumbing repair, installation, and maintenance.",
    gbpPrimaryCategory: "Plumber",
  },
  restoration: {
    slug: "restoration",
    defaultServiceSlugs: [
      "water-damage-restoration",
      "fire-damage-restoration",
      "mold-remediation",
      "storm-damage-restoration",
    ],
    descriptionTemplate:
      "{name} restores properties after water, fire, mold, and storm damage.",
    gbpPrimaryCategory: "Water damage restoration service",
  },
  roofing: {
    slug: "roofing",
    defaultServiceSlugs: [
      "roof-repair",
      "roof-replacement",
      "storm-damage-roofing",
      "gutter-service",
    ],
    descriptionTemplate:
      "{name} handles roof repair, replacement, and storm damage for local homeowners.",
    gbpPrimaryCategory: "Roofing contractor",
  },
  electrical: {
    slug: "electrical",
    defaultServiceSlugs: [
      "panel-upgrades",
      "outlet-switch-repair",
      "lighting-installation",
      "ev-charger-installation",
    ],
    descriptionTemplate:
      "{name} provides licensed electrical repair, upgrades, and installations.",
    gbpPrimaryCategory: "Electrician",
  },
  landscaping: {
    slug: "landscaping",
    defaultServiceSlugs: [
      "lawn-care",
      "landscape-design",
      "irrigation-service",
      "tree-trimming",
    ],
    descriptionTemplate:
      "{name} keeps outdoor spaces healthy with lawn care, design, and maintenance.",
    gbpPrimaryCategory: "Landscaper",
  },
  "pest-control": {
    slug: "pest-control",
    defaultServiceSlugs: [
      "general-pest-control",
      "termite-treatment",
      "rodent-control",
      "mosquito-treatment",
    ],
    descriptionTemplate:
      "{name} protects homes and businesses with proactive pest control programs.",
    gbpPrimaryCategory: "Pest control service",
  },
  "internet-saas": {
    slug: "internet-saas",
    defaultServiceSlugs: [
      "local-seo-software",
      "listing-management-platform",
      "ai-visibility-tools",
      "reputation-management-software",
      "business-profile-sync",
    ],
    descriptionTemplate:
      "{name} builds software that helps local businesses manage listings, visibility, and reputation across the web.",
    gbpPrimaryCategory: "Software company",
  },
  "marketing-agency": {
    slug: "marketing-agency",
    defaultServiceSlugs: [
      "local-seo-services",
      "google-business-profile-management",
      "listing-audit-services",
      "review-response-management",
    ],
    descriptionTemplate:
      "{name} is a local marketing agency focused on search visibility, listings accuracy, and reputation.",
    gbpPrimaryCategory: "Internet marketing service",
  },
  "it-services": {
    slug: "it-services",
    defaultServiceSlugs: [
      "managed-it-support",
      "network-setup",
      "cybersecurity-services",
      "cloud-migration",
    ],
    descriptionTemplate:
      "{name} delivers managed IT, networking, and security for local businesses.",
    gbpPrimaryCategory: "Computer support and services",
  },
  legal: {
    slug: "legal",
    defaultServiceSlugs: [
      "business-law",
      "estate-planning",
      "family-law",
      "personal-injury",
    ],
    descriptionTemplate:
      "{name} provides trusted legal counsel for individuals and businesses in the community.",
    gbpPrimaryCategory: "Law firm",
  },
  accounting: {
    slug: "accounting",
    defaultServiceSlugs: [
      "tax-preparation",
      "bookkeeping",
      "payroll-services",
      "business-advisory",
    ],
    descriptionTemplate:
      "{name} helps local businesses stay compliant and make confident financial decisions.",
    gbpPrimaryCategory: "Accountant",
  },
  consulting: {
    slug: "consulting",
    defaultServiceSlugs: [
      "business-strategy",
      "operations-consulting",
      "marketing-consulting",
      "fractional-leadership",
    ],
    descriptionTemplate:
      "{name} partners with owners and operators to improve growth, operations, and marketing.",
    gbpPrimaryCategory: "Business management consultant",
  },
  dental: {
    slug: "dental",
    defaultServiceSlugs: [
      "general-dentistry",
      "teeth-cleaning",
      "cosmetic-dentistry",
      "emergency-dental",
    ],
    descriptionTemplate:
      "{name} offers comprehensive dental care for patients of all ages.",
    gbpPrimaryCategory: "Dentist",
  },
  medical: {
    slug: "medical",
    defaultServiceSlugs: [
      "primary-care",
      "preventive-care",
      "chronic-care-management",
      "telehealth-visits",
    ],
    descriptionTemplate:
      "{name} provides primary and preventive care for the local community.",
    gbpPrimaryCategory: "Medical clinic",
  },
  veterinary: {
    slug: "veterinary",
    defaultServiceSlugs: [
      "wellness-exams",
      "vaccinations",
      "dental-care-pets",
      "emergency-vet-care",
    ],
    descriptionTemplate:
      "{name} delivers compassionate veterinary care for pets and their families.",
    gbpPrimaryCategory: "Veterinarian",
  },
  restaurant: {
    slug: "restaurant",
    defaultServiceSlugs: [
      "dine-in",
      "takeout",
      "catering",
      "private-events",
    ],
    descriptionTemplate:
      "{name} serves the neighborhood with fresh food, warm hospitality, and reliable takeout.",
    gbpPrimaryCategory: "Restaurant",
  },
  retail: {
    slug: "retail",
    defaultServiceSlugs: [
      "in-store-shopping",
      "online-ordering",
      "local-delivery",
      "gift-services",
    ],
    descriptionTemplate:
      "{name} is a local shop serving customers in-store and online.",
    gbpPrimaryCategory: "Store",
  },
  "real-estate": {
    slug: "real-estate",
    defaultServiceSlugs: [
      "residential-sales",
      "buyer-representation",
      "listing-services",
      "property-valuation",
    ],
    descriptionTemplate:
      "{name} helps buyers and sellers navigate the local real estate market.",
    gbpPrimaryCategory: "Real estate agency",
  },
  "auto-repair": {
    slug: "auto-repair",
    defaultServiceSlugs: [
      "general-auto-repair",
      "brake-service",
      "oil-change",
      "diagnostics",
    ],
    descriptionTemplate:
      "{name} keeps vehicles safe and reliable with honest diagnostics and repair.",
    gbpPrimaryCategory: "Auto repair shop",
  },
};

export function getCategoryPack(categorySlug: string): CategoryPack | null {
  return PACKS[categorySlug] ?? null;
}

export function applyCategoryPackToProfile(input: {
  categorySlug: string;
  businessName: string;
  profile: {
    description?: string;
    serviceSlugs: string[];
  };
}): { description?: string; serviceSlugs: string[] } {
  const pack = getCategoryPack(input.categorySlug);
  if (!pack) {
    return {
      description: input.profile.description,
      serviceSlugs: input.profile.serviceSlugs,
    };
  }

  const description =
    input.profile.description ??
    pack.descriptionTemplate?.replace(/\{name\}/g, input.businessName.trim());

  const serviceSlugs =
    input.profile.serviceSlugs.length > 0
      ? input.profile.serviceSlugs
      : pack.defaultServiceSlugs;

  return { description, serviceSlugs };
}
