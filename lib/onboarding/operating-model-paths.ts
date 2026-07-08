import type {
  GraderAuditTier,
  GraderOperatingModel,
} from "@/lib/grader/types";

export type OnboardingPathGuide = {
  badge: string;
  title: string;
  description: string;
  steps: string[];
  /** Shown when audit had no GBP — complements Google's create flow. */
  noGbpNote?: string;
};

const PATHS: Record<
  GraderOperatingModel,
  (tier: GraderAuditTier) => OnboardingPathGuide
> = {
  storefront: (tier) => ({
    badge: "Storefront · full local setup",
    title: "Your Google listing is the hub",
    description:
      "We'll sync your verified profile to 20+ directories, track NAP consistency, and draft review responses — you approve everything before it goes live.",
    steps: [
      "Confirm your business name, address, and hours",
      "Connect Google Business Profile for approve-first sync",
      "Pick publishers and categories for your vertical",
      "Review AI-drafted descriptions and fix audit leaks",
    ],
    noGbpNote:
      tier === "website_local"
        ? "Create or claim your Google profile first — it's the #1 unlock for map pack visibility."
        : undefined,
  }),
  mobile: (tier) => ({
    badge: "Mobile · truck, cart, or pop-up",
    title: "Be findable wherever you park",
    description:
      "Mobile businesses need a tight website, a Google profile (even service-area), and consistent listings. We'll tailor setup to how you actually operate.",
    steps: [
      "Add your business name and where customers find you online",
      "Set service area or event locations on your profile",
      "Sync website, social, and food/event directories",
      "Use posts and review replies to stay top-of-mind",
    ],
    noGbpNote:
      tier === "website_local"
        ? "No Google listing yet? Add one as a service-area business, or let us set it up on Premium."
        : undefined,
  }),
  service_area: (tier) => ({
    badge: "Service area · you go to them",
    title: "Own your service area online",
    description:
      "Home-based and traveling businesses rank on service area + reviews, not a storefront pin. We'll configure categories, service zones, and directory coverage.",
    steps: [
      "Define your service area cities and primary category",
      "Connect GBP as a service-area business (hide address if needed)",
      "Sync to home-services and local directories",
      "Fix website trust signals from your audit",
    ],
    noGbpNote:
      tier === "website_local"
        ? "Claim a service-area Google profile — customers search by trade + city, not your home address."
        : undefined,
  }),
  online: (tier) => ({
    badge: "Online-first · local buyers",
    title: "Website + citations, not just a map pin",
    description:
      "You may not need foot traffic, but you still need local trust: website SEO, Google presence, and directories where buyers compare options.",
    steps: [
      "Confirm website URL and how you describe what you sell locally",
      "Add or optimize Google Business Profile if you meet customers locally",
      "Sync social and niche directories (not only maps)",
      "Turn on AI visibility pages so search engines cite you correctly",
    ],
    noGbpNote:
      tier === "website_local"
        ? "Optional: add a Google profile if you serve customers in person or locally — it still drives discovery."
        : undefined,
  }),
};

export function onboardingGuideForModel(
  model: GraderOperatingModel = "storefront",
  tier: GraderAuditTier = "full_local",
): OnboardingPathGuide {
  return PATHS[model](tier);
}
