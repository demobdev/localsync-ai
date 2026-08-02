import type {
  PublisherApprovalStatus,
  PublisherCostCadence,
  PublisherDeliveryRail,
  PublisherOperation,
  PublisherVerificationOwner,
} from "../../lib/publishers/delivery";

export type PublisherRail = "api" | "guided_import" | "manual" | "audit_only";

type BasePublisherSeed = {
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

export type PublisherCapabilitySeed = {
  deliveryRail: PublisherDeliveryRail;
  approvalStatus: PublisherApprovalStatus;
  verificationOwner: PublisherVerificationOwner;
  costCadence: PublisherCostCadence;
  estimatedCostCents: number;
  costNotes: string;
  ownershipPersists: boolean;
  supportedOperations: PublisherOperation[];
  evidenceRequirement: string;
};

export type PublisherSeed = BasePublisherSeed & PublisherCapabilitySeed;

const BASE_PUBLISHER_SEEDS: BasePublisherSeed[] = [
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
    description:
      "Microsoft Bing local listings. Guided import works now; the Trusted Partner API is the automation target.",
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
    description:
      "Apple Maps business listings. Direct management requires verified third-party partner access and customer delegation.",
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
    description:
      "Yelp business profile. Free claiming works now; direct ingestion requires an approved partner agreement.",
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

const noPublisherFee =
  "No per-listing publisher fee is currently modeled; engineering, verification, and partner costs are separate.";
const freeProfileManaged =
  "The base publisher profile is free; managed fulfillment labor or optional publisher products are separate.";

const PUBLISHER_CAPABILITIES: Record<string, PublisherCapabilitySeed> = {
  "google-business-profile": {
    deliveryRail: "approval_gated_direct",
    approvalStatus: "not_applied",
    verificationOwner: "customer",
    costCadence: "none",
    estimatedCostCents: 0,
    costNotes: noPublisherFee,
    ownershipPersists: true,
    supportedOperations: [
      "discover",
      "create",
      "claim",
      "update",
      "verify",
      "monitor",
      "analytics",
      "suppress_duplicates",
    ],
    evidenceRequirement:
      "Customer authorization plus a live API re-read confirming the approved fields.",
  },
  "bing-places": {
    deliveryRail: "approval_gated_direct",
    approvalStatus: "not_applied",
    verificationOwner: "publisher",
    costCadence: "none",
    estimatedCostCents: 0,
    costNotes: noPublisherFee,
    ownershipPersists: true,
    supportedOperations: [
      "discover",
      "create",
      "update",
      "verify",
      "monitor",
      "analytics",
    ],
    evidenceRequirement:
      "Trusted Partner production status plus a successful Bing status response and live listing URL.",
  },
  "apple-business-connect": {
    deliveryRail: "approval_gated_direct",
    approvalStatus: "not_applied",
    verificationOwner: "customer",
    costCadence: "none",
    estimatedCostCents: 0,
    costNotes: noPublisherFee,
    ownershipPersists: true,
    supportedOperations: [
      "discover",
      "create",
      "update",
      "verify",
      "monitor",
    ],
    evidenceRequirement:
      "Verified partner account, customer delegation, and a live Apple place-card re-read.",
  },
  facebook: {
    deliveryRail: "approval_gated_direct",
    approvalStatus: "not_applied",
    verificationOwner: "customer",
    costCadence: "none",
    estimatedCostCents: 0,
    costNotes: noPublisherFee,
    ownershipPersists: true,
    supportedOperations: ["discover", "update", "verify", "monitor", "analytics"],
    evidenceRequirement:
      "Customer Page access, required Meta app permissions, and a live Page re-read.",
  },
  yelp: {
    deliveryRail: "approval_gated_direct",
    approvalStatus: "not_applied",
    verificationOwner: "publisher",
    costCadence: "quote",
    estimatedCostCents: 0,
    costNotes:
      "The business page is free; Data Ingestion API commercial terms require a Yelp partner agreement.",
    ownershipPersists: true,
    supportedOperations: [
      "discover",
      "create",
      "claim",
      "update",
      "verify",
      "monitor",
      "analytics",
    ],
    evidenceRequirement:
      "Approved partner ingestion result followed by Yelp claim status and live page confirmation.",
  },
  nextdoor: {
    deliveryRail: "customer_action",
    approvalStatus: "not_required",
    verificationOwner: "customer",
    costCadence: "none",
    estimatedCostCents: 0,
    costNotes: freeProfileManaged,
    ownershipPersists: true,
    supportedOperations: ["discover", "create", "claim", "verify", "monitor"],
    evidenceRequirement:
      "Customer completes Nextdoor ownership verification and LocalSync records the public page URL.",
  },
  bbb: {
    deliveryRail: "managed_submission",
    approvalStatus: "not_required",
    verificationOwner: "publisher",
    costCadence: "none",
    estimatedCostCents: 0,
    costNotes:
      "A basic profile can be managed without buying accreditation; accreditation and advertising are separate.",
    ownershipPersists: true,
    supportedOperations: ["discover", "create", "claim", "verify", "monitor"],
    evidenceRequirement:
      "Publisher-approved BBB profile URL with matching core business information.",
  },
  angi: {
    deliveryRail: "managed_submission",
    approvalStatus: "not_required",
    verificationOwner: "publisher",
    costCadence: "quote",
    estimatedCostCents: 0,
    costNotes:
      "Profile setup is managed separately from optional lead and advertising spend.",
    ownershipPersists: true,
    supportedOperations: ["discover", "create", "claim", "verify", "monitor"],
    evidenceRequirement:
      "Approved public professional profile with customer-owned credentials.",
  },
  homeadvisor: {
    deliveryRail: "managed_submission",
    approvalStatus: "not_required",
    verificationOwner: "publisher",
    costCadence: "quote",
    estimatedCostCents: 0,
    costNotes:
      "Profile setup is managed separately from optional lead and advertising spend.",
    ownershipPersists: true,
    supportedOperations: ["discover", "create", "claim", "verify", "monitor"],
    evidenceRequirement:
      "Approved public professional profile with customer-owned credentials.",
  },
  thumbtack: {
    deliveryRail: "managed_submission",
    approvalStatus: "not_required",
    verificationOwner: "publisher",
    costCadence: "none",
    estimatedCostCents: 0,
    costNotes:
      "Creating a professional profile is free; paid leads are outside the listings subscription.",
    ownershipPersists: true,
    supportedOperations: ["discover", "create", "claim", "verify", "monitor"],
    evidenceRequirement:
      "Complete public professional profile with services, coverage, and customer-owned credentials.",
  },
  houzz: {
    deliveryRail: "managed_submission",
    approvalStatus: "not_required",
    verificationOwner: "publisher",
    costCadence: "none",
    estimatedCostCents: 0,
    costNotes: freeProfileManaged,
    ownershipPersists: true,
    supportedOperations: ["discover", "create", "claim", "verify", "monitor"],
    evidenceRequirement:
      "Live professional-directory URL with matching location, services, and website.",
  },
  porch: {
    deliveryRail: "managed_submission",
    approvalStatus: "not_required",
    verificationOwner: "publisher",
    costCadence: "quote",
    estimatedCostCents: 0,
    costNotes:
      "Managed profile submission; optional marketplace and lead products are separate.",
    ownershipPersists: true,
    supportedOperations: ["discover", "create", "claim", "verify", "monitor"],
    evidenceRequirement:
      "Publisher-approved professional profile and public listing URL.",
  },
  buildzoom: {
    deliveryRail: "monitor_only",
    approvalStatus: "unavailable",
    verificationOwner: "publisher",
    costCadence: "none",
    estimatedCostCents: 0,
    costNotes: "No general production write rail has been validated for LocalSync.",
    ownershipPersists: true,
    supportedOperations: ["discover", "verify", "monitor"],
    evidenceRequirement:
      "Public profile evidence compared against authoritative license and website information.",
  },
  "yellow-pages": {
    deliveryRail: "managed_submission",
    approvalStatus: "not_required",
    verificationOwner: "customer",
    costCadence: "none",
    estimatedCostCents: 0,
    costNotes:
      "Basic claiming is separated from optional enhanced profile and advertising products.",
    ownershipPersists: true,
    supportedOperations: ["discover", "create", "claim", "verify", "monitor"],
    evidenceRequirement:
      "Claimed public YP listing with matching NAP and customer-owned access.",
  },
  foursquare: {
    deliveryRail: "approval_gated_direct",
    approvalStatus: "not_applied",
    verificationOwner: "publisher",
    costCadence: "quote",
    estimatedCostCents: 0,
    costNotes:
      "Discovery and contribution have low-cost access; merchant-grade synchronization requires approved access or an aggregator.",
    ownershipPersists: true,
    supportedOperations: ["discover", "create", "claim", "update", "verify", "monitor"],
    evidenceRequirement:
      "Approved place edit or merchant claim followed by a canonical Foursquare place re-read.",
  },
  mapquest: {
    deliveryRail: "monitor_only",
    approvalStatus: "unavailable",
    verificationOwner: "publisher",
    costCadence: "none",
    estimatedCostCents: 0,
    costNotes:
      "Treat as a downstream or managed correction source until a production partner feed is contracted.",
    ownershipPersists: true,
    supportedOperations: ["discover", "verify", "monitor"],
    evidenceRequirement: "Public MapQuest place URL with matching NAP evidence.",
  },
  citysearch: {
    deliveryRail: "monitor_only",
    approvalStatus: "unavailable",
    verificationOwner: "publisher",
    costCadence: "none",
    estimatedCostCents: 0,
    costNotes: "No general production write rail has been validated for LocalSync.",
    ownershipPersists: true,
    supportedOperations: ["discover", "verify", "monitor"],
    evidenceRequirement: "Public directory URL with matching NAP evidence.",
  },
  merchantcircle: {
    deliveryRail: "managed_submission",
    approvalStatus: "not_required",
    verificationOwner: "customer",
    costCadence: "none",
    estimatedCostCents: 0,
    costNotes: freeProfileManaged,
    ownershipPersists: true,
    supportedOperations: ["discover", "create", "claim", "verify", "monitor"],
    evidenceRequirement:
      "Claimed public profile with matching NAP and customer-owned credentials.",
  },
  expertise: {
    deliveryRail: "monitor_only",
    approvalStatus: "unavailable",
    verificationOwner: "publisher",
    costCadence: "none",
    estimatedCostCents: 0,
    costNotes:
      "Expertise.com is curated; LocalSync can monitor inclusion and prepare publisher outreach.",
    ownershipPersists: true,
    supportedOperations: ["discover", "verify", "monitor"],
    evidenceRequirement:
      "Public curated profile or category inclusion with matching business information.",
  },
  manta: {
    deliveryRail: "managed_submission",
    approvalStatus: "not_required",
    verificationOwner: "customer",
    costCadence: "none",
    estimatedCostCents: 0,
    costNotes:
      "The base listing is free; Manta's optional 70+ directory product is outside this rail.",
    ownershipPersists: true,
    supportedOperations: ["discover", "create", "claim", "verify", "monitor"],
    evidenceRequirement:
      "Claimed public Manta profile with matching NAP and customer-owned access.",
  },
};

export const PUBLISHER_SEEDS: PublisherSeed[] = BASE_PUBLISHER_SEEDS.map(
  (publisher) => {
    const capability = PUBLISHER_CAPABILITIES[publisher.slug];
    if (!capability) {
      throw new Error(`Missing capability metadata for ${publisher.slug}`);
    }
    return { ...publisher, ...capability };
  },
);
