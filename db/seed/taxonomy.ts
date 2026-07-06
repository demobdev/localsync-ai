export type TaxonomyCategorySeed = {
  slug: string;
  name: string;
  vertical: string;
  schemaOrgType: string;
  description: string;
  sortOrder: number;
};

export type TaxonomyServiceSeed = {
  categorySlug: string;
  slug: string;
  name: string;
  description?: string;
  sortOrder: number;
};

export const TAXONOMY_CATEGORIES: TaxonomyCategorySeed[] = [
  // Professional & internet — first so LocalSync dogfood is easy to find
  {
    slug: "internet-saas",
    name: "Internet / SaaS",
    vertical: "professional",
    schemaOrgType: "ProfessionalService",
    description:
      "Software and internet companies serving local businesses (LocalSync-style).",
    sortOrder: 1,
  },
  {
    slug: "marketing-agency",
    name: "Marketing agency",
    vertical: "professional",
    schemaOrgType: "ProfessionalService",
    description: "Local SEO, listings, reputation, and digital marketing agencies.",
    sortOrder: 2,
  },
  {
    slug: "it-services",
    name: "IT services",
    vertical: "professional",
    schemaOrgType: "ProfessionalService",
    description: "Managed IT, networking, and cybersecurity for local businesses.",
    sortOrder: 3,
  },
  {
    slug: "legal",
    name: "Law firm",
    vertical: "professional",
    schemaOrgType: "LegalService",
    description: "Attorneys and legal practices serving individuals and businesses.",
    sortOrder: 4,
  },
  {
    slug: "accounting",
    name: "Accounting",
    vertical: "professional",
    schemaOrgType: "AccountingService",
    description: "Tax, bookkeeping, payroll, and advisory for local businesses.",
    sortOrder: 5,
  },
  {
    slug: "consulting",
    name: "Business consulting",
    vertical: "professional",
    schemaOrgType: "ProfessionalService",
    description: "Strategy, operations, and growth consulting.",
    sortOrder: 6,
  },
  {
    slug: "real-estate",
    name: "Real estate",
    vertical: "professional",
    schemaOrgType: "RealEstateAgent",
    description: "Residential and commercial real estate agencies.",
    sortOrder: 7,
  },
  // Home services
  {
    slug: "hvac",
    name: "HVAC",
    vertical: "home_services",
    schemaOrgType: "HVACBusiness",
    description: "Heating, ventilation, air conditioning, and indoor comfort systems.",
    sortOrder: 10,
  },
  {
    slug: "plumbing",
    name: "Plumbing",
    vertical: "home_services",
    schemaOrgType: "Plumber",
    description: "Residential and light commercial plumbing repair and installation.",
    sortOrder: 11,
  },
  {
    slug: "restoration",
    name: "Restoration",
    vertical: "home_services",
    schemaOrgType: "HomeAndConstructionBusiness",
    description: "Water, fire, mold, and disaster restoration services.",
    sortOrder: 12,
  },
  {
    slug: "roofing",
    name: "Roofing",
    vertical: "home_services",
    schemaOrgType: "RoofingContractor",
    description: "Roof repair, replacement, and storm damage services.",
    sortOrder: 13,
  },
  {
    slug: "electrical",
    name: "Electrical",
    vertical: "home_services",
    schemaOrgType: "Electrician",
    description: "Residential electrical repair, panel upgrades, and installations.",
    sortOrder: 14,
  },
  {
    slug: "landscaping",
    name: "Landscaping",
    vertical: "home_services",
    schemaOrgType: "LandscapingBusiness",
    description: "Lawn care, landscape design, and outdoor maintenance.",
    sortOrder: 15,
  },
  {
    slug: "pest-control",
    name: "Pest control",
    vertical: "home_services",
    schemaOrgType: "HomeAndConstructionBusiness",
    description: "Pest prevention, treatment, and ongoing protection plans.",
    sortOrder: 16,
  },
  // Healthcare
  {
    slug: "dental",
    name: "Dental",
    vertical: "healthcare",
    schemaOrgType: "Dentist",
    description: "General and specialty dental practices.",
    sortOrder: 20,
  },
  {
    slug: "medical",
    name: "Medical practice",
    vertical: "healthcare",
    schemaOrgType: "MedicalClinic",
    description: "Primary care and specialty medical clinics.",
    sortOrder: 21,
  },
  {
    slug: "veterinary",
    name: "Veterinary",
    vertical: "healthcare",
    schemaOrgType: "VeterinaryCare",
    description: "Animal hospitals and veterinary clinics.",
    sortOrder: 22,
  },
  // Hospitality & retail
  {
    slug: "restaurant",
    name: "Restaurant",
    vertical: "hospitality_retail",
    schemaOrgType: "Restaurant",
    description: "Restaurants, cafés, and food service.",
    sortOrder: 30,
  },
  {
    slug: "retail",
    name: "Retail store",
    vertical: "hospitality_retail",
    schemaOrgType: "Store",
    description: "Local shops and specialty retail.",
    sortOrder: 31,
  },
  // Automotive
  {
    slug: "auto-repair",
    name: "Auto repair",
    vertical: "automotive",
    schemaOrgType: "AutoRepair",
    description: "Auto repair, maintenance, and diagnostics.",
    sortOrder: 40,
  },
];

export const TAXONOMY_SERVICES: TaxonomyServiceSeed[] = [
  // Internet / SaaS
  {
    categorySlug: "internet-saas",
    slug: "local-seo-software",
    name: "Local SEO software",
    sortOrder: 1,
  },
  {
    categorySlug: "internet-saas",
    slug: "listing-management-platform",
    name: "Listing management platform",
    sortOrder: 2,
  },
  {
    categorySlug: "internet-saas",
    slug: "ai-visibility-tools",
    name: "AI visibility tools",
    sortOrder: 3,
  },
  {
    categorySlug: "internet-saas",
    slug: "reputation-management-software",
    name: "Reputation management software",
    sortOrder: 4,
  },
  {
    categorySlug: "internet-saas",
    slug: "business-profile-sync",
    name: "Business profile sync",
    sortOrder: 5,
  },
  // Marketing agency
  {
    categorySlug: "marketing-agency",
    slug: "local-seo-services",
    name: "Local SEO services",
    sortOrder: 1,
  },
  {
    categorySlug: "marketing-agency",
    slug: "google-business-profile-management",
    name: "Google Business Profile management",
    sortOrder: 2,
  },
  {
    categorySlug: "marketing-agency",
    slug: "listing-audit-services",
    name: "Listing audit services",
    sortOrder: 3,
  },
  {
    categorySlug: "marketing-agency",
    slug: "review-response-management",
    name: "Review response management",
    sortOrder: 4,
  },
  // IT services
  {
    categorySlug: "it-services",
    slug: "managed-it-support",
    name: "Managed IT support",
    sortOrder: 1,
  },
  {
    categorySlug: "it-services",
    slug: "network-setup",
    name: "Network setup",
    sortOrder: 2,
  },
  {
    categorySlug: "it-services",
    slug: "cybersecurity-services",
    name: "Cybersecurity services",
    sortOrder: 3,
  },
  {
    categorySlug: "it-services",
    slug: "cloud-migration",
    name: "Cloud migration",
    sortOrder: 4,
  },
  // Legal
  {
    categorySlug: "legal",
    slug: "business-law",
    name: "Business law",
    sortOrder: 1,
  },
  {
    categorySlug: "legal",
    slug: "estate-planning",
    name: "Estate planning",
    sortOrder: 2,
  },
  {
    categorySlug: "legal",
    slug: "family-law",
    name: "Family law",
    sortOrder: 3,
  },
  {
    categorySlug: "legal",
    slug: "personal-injury",
    name: "Personal injury",
    sortOrder: 4,
  },
  // Accounting
  {
    categorySlug: "accounting",
    slug: "tax-preparation",
    name: "Tax preparation",
    sortOrder: 1,
  },
  {
    categorySlug: "accounting",
    slug: "bookkeeping",
    name: "Bookkeeping",
    sortOrder: 2,
  },
  {
    categorySlug: "accounting",
    slug: "payroll-services",
    name: "Payroll services",
    sortOrder: 3,
  },
  {
    categorySlug: "accounting",
    slug: "business-advisory",
    name: "Business advisory",
    sortOrder: 4,
  },
  // Consulting
  {
    categorySlug: "consulting",
    slug: "business-strategy",
    name: "Business strategy",
    sortOrder: 1,
  },
  {
    categorySlug: "consulting",
    slug: "operations-consulting",
    name: "Operations consulting",
    sortOrder: 2,
  },
  {
    categorySlug: "consulting",
    slug: "marketing-consulting",
    name: "Marketing consulting",
    sortOrder: 3,
  },
  {
    categorySlug: "consulting",
    slug: "fractional-leadership",
    name: "Fractional leadership",
    sortOrder: 4,
  },
  // Real estate
  {
    categorySlug: "real-estate",
    slug: "residential-sales",
    name: "Residential sales",
    sortOrder: 1,
  },
  {
    categorySlug: "real-estate",
    slug: "buyer-representation",
    name: "Buyer representation",
    sortOrder: 2,
  },
  {
    categorySlug: "real-estate",
    slug: "listing-services",
    name: "Listing services",
    sortOrder: 3,
  },
  {
    categorySlug: "real-estate",
    slug: "property-valuation",
    name: "Property valuation",
    sortOrder: 4,
  },
  // HVAC
  {
    categorySlug: "hvac",
    slug: "ac-repair",
    name: "AC Repair",
    description: "Air conditioning diagnostics, repair, and same-day cooling service.",
    sortOrder: 1,
  },
  {
    categorySlug: "hvac",
    slug: "heating-repair",
    name: "Heating Repair",
    description: "Furnace, heat pump, and heating system repair.",
    sortOrder: 2,
  },
  {
    categorySlug: "hvac",
    slug: "hvac-installation",
    name: "HVAC Installation",
    description: "New system installation, replacement, and load calculations.",
    sortOrder: 3,
  },
  {
    categorySlug: "hvac",
    slug: "hvac-maintenance",
    name: "HVAC Maintenance",
    description: "Seasonal tune-ups, maintenance plans, and preventive service.",
    sortOrder: 4,
  },
  {
    categorySlug: "hvac",
    slug: "heat-pump-service",
    name: "Heat Pump Service",
    description: "Heat pump repair, defrost issues, and performance tuning.",
    sortOrder: 5,
  },
  {
    categorySlug: "hvac",
    slug: "duct-cleaning",
    name: "Duct Cleaning",
    description: "Air duct cleaning and airflow improvement.",
    sortOrder: 6,
  },
  {
    categorySlug: "hvac",
    slug: "indoor-air-quality",
    name: "Indoor Air Quality",
    description: "Filtration, humidity control, and IAQ upgrades.",
    sortOrder: 7,
  },
  {
    categorySlug: "hvac",
    slug: "emergency-hvac",
    name: "Emergency HVAC Service",
    description: "After-hours and priority no-heat/no-cool response.",
    sortOrder: 8,
  },
  // Plumbing
  {
    categorySlug: "plumbing",
    slug: "drain-cleaning",
    name: "Drain Cleaning",
    sortOrder: 1,
  },
  {
    categorySlug: "plumbing",
    slug: "water-heater-repair",
    name: "Water Heater Repair",
    sortOrder: 2,
  },
  {
    categorySlug: "plumbing",
    slug: "leak-detection",
    name: "Leak Detection",
    sortOrder: 3,
  },
  {
    categorySlug: "plumbing",
    slug: "sewer-line-service",
    name: "Sewer Line Service",
    sortOrder: 4,
  },
  {
    categorySlug: "plumbing",
    slug: "fixture-installation",
    name: "Fixture Installation",
    sortOrder: 5,
  },
  // Restoration
  {
    categorySlug: "restoration",
    slug: "water-damage-restoration",
    name: "Water Damage Restoration",
    sortOrder: 1,
  },
  {
    categorySlug: "restoration",
    slug: "fire-damage-restoration",
    name: "Fire Damage Restoration",
    sortOrder: 2,
  },
  {
    categorySlug: "restoration",
    slug: "mold-remediation",
    name: "Mold Remediation",
    sortOrder: 3,
  },
  {
    categorySlug: "restoration",
    slug: "storm-damage-restoration",
    name: "Storm Damage Restoration",
    sortOrder: 4,
  },
  // Roofing
  {
    categorySlug: "roofing",
    slug: "roof-repair",
    name: "Roof Repair",
    sortOrder: 1,
  },
  {
    categorySlug: "roofing",
    slug: "roof-replacement",
    name: "Roof Replacement",
    sortOrder: 2,
  },
  {
    categorySlug: "roofing",
    slug: "storm-damage-roofing",
    name: "Storm Damage Roofing",
    sortOrder: 3,
  },
  {
    categorySlug: "roofing",
    slug: "gutter-service",
    name: "Gutter Service",
    sortOrder: 4,
  },
  // Electrical
  {
    categorySlug: "electrical",
    slug: "panel-upgrades",
    name: "Panel Upgrades",
    sortOrder: 1,
  },
  {
    categorySlug: "electrical",
    slug: "outlet-switch-repair",
    name: "Outlet & Switch Repair",
    sortOrder: 2,
  },
  {
    categorySlug: "electrical",
    slug: "lighting-installation",
    name: "Lighting Installation",
    sortOrder: 3,
  },
  {
    categorySlug: "electrical",
    slug: "ev-charger-installation",
    name: "EV Charger Installation",
    sortOrder: 4,
  },
  // Landscaping
  {
    categorySlug: "landscaping",
    slug: "lawn-care",
    name: "Lawn care",
    sortOrder: 1,
  },
  {
    categorySlug: "landscaping",
    slug: "landscape-design",
    name: "Landscape design",
    sortOrder: 2,
  },
  {
    categorySlug: "landscaping",
    slug: "irrigation-service",
    name: "Irrigation service",
    sortOrder: 3,
  },
  {
    categorySlug: "landscaping",
    slug: "tree-trimming",
    name: "Tree trimming",
    sortOrder: 4,
  },
  // Pest control
  {
    categorySlug: "pest-control",
    slug: "general-pest-control",
    name: "General pest control",
    sortOrder: 1,
  },
  {
    categorySlug: "pest-control",
    slug: "termite-treatment",
    name: "Termite treatment",
    sortOrder: 2,
  },
  {
    categorySlug: "pest-control",
    slug: "rodent-control",
    name: "Rodent control",
    sortOrder: 3,
  },
  {
    categorySlug: "pest-control",
    slug: "mosquito-treatment",
    name: "Mosquito treatment",
    sortOrder: 4,
  },
  // Dental
  {
    categorySlug: "dental",
    slug: "general-dentistry",
    name: "General dentistry",
    sortOrder: 1,
  },
  {
    categorySlug: "dental",
    slug: "teeth-cleaning",
    name: "Teeth cleaning",
    sortOrder: 2,
  },
  {
    categorySlug: "dental",
    slug: "cosmetic-dentistry",
    name: "Cosmetic dentistry",
    sortOrder: 3,
  },
  {
    categorySlug: "dental",
    slug: "emergency-dental",
    name: "Emergency dental",
    sortOrder: 4,
  },
  // Medical
  {
    categorySlug: "medical",
    slug: "primary-care",
    name: "Primary care",
    sortOrder: 1,
  },
  {
    categorySlug: "medical",
    slug: "preventive-care",
    name: "Preventive care",
    sortOrder: 2,
  },
  {
    categorySlug: "medical",
    slug: "chronic-care-management",
    name: "Chronic care management",
    sortOrder: 3,
  },
  {
    categorySlug: "medical",
    slug: "telehealth-visits",
    name: "Telehealth visits",
    sortOrder: 4,
  },
  // Veterinary
  {
    categorySlug: "veterinary",
    slug: "wellness-exams",
    name: "Wellness exams",
    sortOrder: 1,
  },
  {
    categorySlug: "veterinary",
    slug: "vaccinations",
    name: "Vaccinations",
    sortOrder: 2,
  },
  {
    categorySlug: "veterinary",
    slug: "dental-care-pets",
    name: "Pet dental care",
    sortOrder: 3,
  },
  {
    categorySlug: "veterinary",
    slug: "emergency-vet-care",
    name: "Emergency vet care",
    sortOrder: 4,
  },
  // Restaurant
  {
    categorySlug: "restaurant",
    slug: "dine-in",
    name: "Dine-in",
    sortOrder: 1,
  },
  {
    categorySlug: "restaurant",
    slug: "takeout",
    name: "Takeout",
    sortOrder: 2,
  },
  {
    categorySlug: "restaurant",
    slug: "catering",
    name: "Catering",
    sortOrder: 3,
  },
  {
    categorySlug: "restaurant",
    slug: "private-events",
    name: "Private events",
    sortOrder: 4,
  },
  // Retail
  {
    categorySlug: "retail",
    slug: "in-store-shopping",
    name: "In-store shopping",
    sortOrder: 1,
  },
  {
    categorySlug: "retail",
    slug: "online-ordering",
    name: "Online ordering",
    sortOrder: 2,
  },
  {
    categorySlug: "retail",
    slug: "local-delivery",
    name: "Local delivery",
    sortOrder: 3,
  },
  {
    categorySlug: "retail",
    slug: "gift-services",
    name: "Gift services",
    sortOrder: 4,
  },
  // Auto repair
  {
    categorySlug: "auto-repair",
    slug: "general-auto-repair",
    name: "General auto repair",
    sortOrder: 1,
  },
  {
    categorySlug: "auto-repair",
    slug: "brake-service",
    name: "Brake service",
    sortOrder: 2,
  },
  {
    categorySlug: "auto-repair",
    slug: "oil-change",
    name: "Oil change",
    sortOrder: 3,
  },
  {
    categorySlug: "auto-repair",
    slug: "diagnostics",
    name: "Diagnostics",
    sortOrder: 4,
  },
];
