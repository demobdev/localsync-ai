export type CategoryPackRail = "guided_import" | "manual" | "audit_only";

export type CategoryPackPublisher = {
  name: string;
  rail: CategoryPackRail;
  role: string;
  url: string;
};

export type CategoryPack = {
  slug: string;
  name: string;
  shortName: string;
  audience: string;
  categorySlugs: readonly string[];
  outcome: string;
  profileFields: readonly string[];
  publishers: readonly CategoryPackPublisher[];
};

export const CATEGORY_PACK_PRICE_MONTHLY = 15;

export const CATEGORY_PACKS: readonly CategoryPack[] = [
  {
    slug: "professional-growth",
    name: "Professional services",
    shortName: "Professional",
    audience: "Agencies, consultants, software firms, and IT providers",
    categorySlugs: [
      "internet-saas",
      "marketing-agency",
      "it-services",
      "consulting",
    ],
    outcome:
      "A credible service profile across the comparison and trust surfaces buyers use before they contact a specialist.",
    profileFields: [
      "Service specialties",
      "Industries served",
      "Consultation details",
      "Portfolio and credentials",
    ],
    publishers: [
      {
        name: "Clutch",
        rail: "manual",
        role: "Service comparison profile",
        url: "https://clutch.co/",
      },
      {
        name: "Better Business Bureau",
        rail: "manual",
        role: "Trust and accreditation profile",
        url: "https://www.bbb.org/",
      },
      {
        name: "Yelp",
        rail: "audit_only",
        role: "Local discovery and reviews",
        url: "https://www.yelp.com/",
      },
    ],
  },
  {
    slug: "legal-authority",
    name: "Legal",
    shortName: "Legal",
    audience: "Law firms and solo attorneys",
    categorySlugs: ["legal"],
    outcome:
      "A complete attorney identity across legal directories, with practice areas and credentials ready for review.",
    profileFields: [
      "Attorney profiles",
      "Practice areas",
      "Bar admissions",
      "Consultation details",
    ],
    publishers: [
      {
        name: "Avvo",
        rail: "manual",
        role: "Claimed attorney profile",
        url: "https://www.avvo.com/for-lawyers/avvo-profile",
      },
      {
        name: "FindLaw",
        rail: "audit_only",
        role: "Attorney and firm directory",
        url: "https://lawyers.findlaw.com/profile/",
      },
      {
        name: "Justia",
        rail: "manual",
        role: "Free lawyer directory profile",
        url: "https://www.justia.com/marketing/lawyer-directory/",
      },
      {
        name: "Martindale",
        rail: "audit_only",
        role: "Attorney directory and reviews",
        url: "https://www.martindale.com/",
      },
    ],
  },
  {
    slug: "financial-trust",
    name: "Financial & accounting",
    shortName: "Finance",
    audience: "Accounting firms, tax practices, and financial professionals",
    categorySlugs: ["accounting"],
    outcome:
      "A credentials-first profile that makes licensing, specialties, and advisory services easier to verify.",
    profileFields: [
      "Professional credentials",
      "Services and specialties",
      "License jurisdiction",
      "Appointment details",
    ],
    publishers: [
      {
        name: "CPA Directory",
        rail: "audit_only",
        role: "Licensed accountant discovery",
        url: "https://cpadirectory.com/",
      },
      {
        name: "State license directory",
        rail: "audit_only",
        role: "Credential verification",
        url: "https://nasba.org/stateboards/",
      },
      {
        name: "Better Business Bureau",
        rail: "manual",
        role: "Trust and accreditation profile",
        url: "https://www.bbb.org/",
      },
      {
        name: "Clutch",
        rail: "manual",
        role: "Accounting service comparison",
        url: "https://clutch.co/us/accounting",
      },
    ],
  },
  {
    slug: "real-estate-discovery",
    name: "Real estate",
    shortName: "Real estate",
    audience: "Agents, teams, and brokerages",
    categorySlugs: ["real-estate"],
    outcome:
      "A consistent agent and brokerage identity across property-search and licensing surfaces.",
    profileFields: [
      "Agent and brokerage name",
      "License details",
      "Markets served",
      "Property specialties",
    ],
    publishers: [
      {
        name: "Zillow",
        rail: "manual",
        role: "Agent profile and reviews",
        url: "https://www.zillow.com/professionals/real-estate-agent-reviews/",
      },
      {
        name: "Realtor.com",
        rail: "manual",
        role: "Agent and team profile",
        url: "https://www.realtor.com/realestateagents/",
      },
      {
        name: "Homes.com",
        rail: "audit_only",
        role: "Agent discovery profile",
        url: "https://www.homes.com/real-estate-agents/",
      },
      {
        name: "State license directory",
        rail: "audit_only",
        role: "Credential verification",
        url: "https://www.arello.org/",
      },
    ],
  },
  {
    slug: "home-services-demand",
    name: "Home services",
    shortName: "Home services",
    audience: "HVAC, plumbing, roofing, electrical, restoration, lawn, and pest",
    categorySlugs: [
      "hvac",
      "plumbing",
      "restoration",
      "roofing",
      "electrical",
      "landscaping",
      "pest-control",
    ],
    outcome:
      "A service-area profile built for homeowner comparison, lead marketplaces, licensing checks, and project proof.",
    profileFields: [
      "Service areas",
      "Trade licenses",
      "Emergency availability",
      "Services and project gallery",
    ],
    publishers: [
      {
        name: "Angi Pro",
        rail: "manual",
        role: "Homeowner demand and leads",
        url: "https://signup.angi.com/pro",
      },
      {
        name: "Thumbtack",
        rail: "manual",
        role: "Service marketplace profile",
        url: "https://www.thumbtack.com/pro",
      },
      {
        name: "Houzz",
        rail: "manual",
        role: "Home professional portfolio",
        url: "https://www.houzz.com/professionals/",
      },
      {
        name: "BuildZoom",
        rail: "audit_only",
        role: "License and project history",
        url: "https://www.buildzoom.com/",
      },
      {
        name: "Better Business Bureau",
        rail: "manual",
        role: "Trust and accreditation profile",
        url: "https://www.bbb.org/",
      },
    ],
  },
  {
    slug: "healthcare-discovery",
    name: "Healthcare",
    shortName: "Healthcare",
    audience: "Medical and dental practices",
    categorySlugs: ["dental", "medical"],
    outcome:
      "A provider-ready profile across the research and booking surfaces patients use to choose care.",
    profileFields: [
      "Provider profiles",
      "Specialties",
      "Insurance acceptance",
      "Appointment and telehealth details",
    ],
    publishers: [
      {
        name: "Healthgrades",
        rail: "manual",
        role: "Claimed provider profile",
        url: "https://www.healthgrades.com/",
      },
      {
        name: "WebMD Care",
        rail: "audit_only",
        role: "Provider research profile",
        url: "https://doctor.webmd.com/",
      },
      {
        name: "Vitals",
        rail: "audit_only",
        role: "Provider directory and reviews",
        url: "https://www.vitals.com/",
      },
      {
        name: "Zocdoc",
        rail: "manual",
        role: "Appointment and insurance discovery",
        url: "https://www.zocdoc.com/about/join/",
      },
    ],
  },
  {
    slug: "veterinary-care",
    name: "Veterinary",
    shortName: "Veterinary",
    audience: "Veterinary clinics and animal hospitals",
    categorySlugs: ["veterinary"],
    outcome:
      "A care profile that keeps services, emergency availability, and professional trust signals aligned.",
    profileFields: [
      "Veterinarian profiles",
      "Species and services",
      "Emergency availability",
      "Accreditations",
    ],
    publishers: [
      {
        name: "AAHA Hospital Locator",
        rail: "audit_only",
        role: "Accreditation and hospital discovery",
        url: "https://www.aaha.org/your-pet/hospital-locator/",
      },
      {
        name: "Vetstreet",
        rail: "audit_only",
        role: "Veterinarian and clinic directory",
        url: "https://www.vetstreet.com/veterinarians/",
      },
      {
        name: "Yelp",
        rail: "audit_only",
        role: "Local discovery and reviews",
        url: "https://www.yelp.com/",
      },
    ],
  },
  {
    slug: "restaurant-conversion",
    name: "Restaurant",
    shortName: "Restaurant",
    audience: "Restaurants, cafés, bars, and food service",
    categorySlugs: ["restaurant"],
    outcome:
      "A dining profile with menus, reservations, ordering, and hours aligned across discovery and conversion surfaces.",
    profileFields: [
      "Menu URL",
      "Reservation URL",
      "Ordering and delivery links",
      "Cuisine and holiday hours",
    ],
    publishers: [
      {
        name: "Tripadvisor",
        rail: "audit_only",
        role: "Dining discovery and reviews",
        url: "https://www.tripadvisor.com/Owners",
      },
      {
        name: "OpenTable",
        rail: "manual",
        role: "Reservation profile",
        url: "https://restaurant.opentable.com/",
      },
      {
        name: "DoorDash",
        rail: "manual",
        role: "Ordering and delivery profile",
        url: "https://get.doordash.com/",
      },
      {
        name: "Yelp",
        rail: "audit_only",
        role: "Local discovery, menu, and reviews",
        url: "https://www.yelp.com/",
      },
    ],
  },
  {
    slug: "retail-discovery",
    name: "Retail",
    shortName: "Retail",
    audience: "Local shops and specialty retailers",
    categorySlugs: ["retail"],
    outcome:
      "A shopping profile that keeps store details, product categories, and fulfillment options easy to verify.",
    profileFields: [
      "Product categories",
      "Shopping and pickup options",
      "Local delivery",
      "Holiday hours",
    ],
    publishers: [
      {
        name: "Yelp",
        rail: "audit_only",
        role: "Local shopping discovery",
        url: "https://www.yelp.com/",
      },
      {
        name: "Nextdoor",
        rail: "manual",
        role: "Neighborhood discovery",
        url: "https://business.nextdoor.com/",
      },
      {
        name: "Facebook",
        rail: "audit_only",
        role: "Store profile and social proof",
        url: "https://www.facebook.com/business/",
      },
    ],
  },
  {
    slug: "automotive-trust",
    name: "Automotive",
    shortName: "Automotive",
    audience: "Repair shops, maintenance centers, and specialty garages",
    categorySlugs: ["auto-repair"],
    outcome:
      "A service profile that makes certifications, specialties, estimates, and customer trust easier to compare.",
    profileFields: [
      "Repair specialties",
      "Technician certifications",
      "Vehicle makes served",
      "Warranty and estimate details",
    ],
    publishers: [
      {
        name: "RepairPal",
        rail: "audit_only",
        role: "Certified shop discovery",
        url: "https://repairpal.com/",
      },
      {
        name: "CARFAX Service Shop",
        rail: "manual",
        role: "Maintenance and service discovery",
        url: "https://www.carfaxserviceshops.com/",
      },
      {
        name: "Better Business Bureau",
        rail: "manual",
        role: "Trust and accreditation profile",
        url: "https://www.bbb.org/",
      },
      {
        name: "Yelp",
        rail: "audit_only",
        role: "Local discovery and reviews",
        url: "https://www.yelp.com/",
      },
    ],
  },
] as const;

export const CATEGORY_PACK_BY_CATEGORY = new Map(
  CATEGORY_PACKS.flatMap((pack) =>
    pack.categorySlugs.map((categorySlug) => [categorySlug, pack] as const),
  ),
);

export function categoryPackForCategory(
  categorySlug: string | null | undefined,
): CategoryPack | null {
  if (!categorySlug) return null;
  return CATEGORY_PACK_BY_CATEGORY.get(categorySlug) ?? null;
}

export function categoryPackRailLabel(rail: CategoryPackRail): string {
  switch (rail) {
    case "guided_import":
      return "Guided";
    case "manual":
      return "Manual";
    case "audit_only":
      return "Audit-only";
  }
}
