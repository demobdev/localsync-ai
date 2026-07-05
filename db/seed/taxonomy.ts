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
  {
    slug: "hvac",
    name: "HVAC",
    vertical: "home_services",
    schemaOrgType: "HVACBusiness",
    description: "Heating, ventilation, air conditioning, and indoor comfort systems.",
    sortOrder: 1,
  },
  {
    slug: "plumbing",
    name: "Plumbing",
    vertical: "home_services",
    schemaOrgType: "Plumber",
    description: "Residential and light commercial plumbing repair and installation.",
    sortOrder: 2,
  },
  {
    slug: "restoration",
    name: "Restoration",
    vertical: "home_services",
    schemaOrgType: "HomeAndConstructionBusiness",
    description: "Water, fire, mold, and disaster restoration services.",
    sortOrder: 3,
  },
  {
    slug: "roofing",
    name: "Roofing",
    vertical: "home_services",
    schemaOrgType: "RoofingContractor",
    description: "Roof repair, replacement, and storm damage services.",
    sortOrder: 4,
  },
  {
    slug: "electrical",
    name: "Electrical",
    vertical: "home_services",
    schemaOrgType: "Electrician",
    description: "Residential electrical repair, panel upgrades, and installations.",
    sortOrder: 5,
  },
];

export const TAXONOMY_SERVICES: TaxonomyServiceSeed[] = [
  // HVAC — adapted from Restore Heating & Cooling service lines
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
];
