import type { LocationProfileSnapshot } from "@/lib/types/location-profile";

export type DemoReviewSeed = {
  authorName: string;
  rating: number;
  text: string;
  daysAgo: number;
};

export function buildDemoReviews(
  profile: LocationProfileSnapshot,
): DemoReviewSeed[] {
  const name = profile.name.trim() || "this business";

  return [
    {
      authorName: "Sarah M.",
      rating: 5,
      text: `${name} came out same day when our AC stopped working. Technician was professional and explained everything clearly. Highly recommend.`,
      daysAgo: 3,
    },
    {
      authorName: "James T.",
      rating: 4,
      text: "Good service overall. Scheduling was easy and the repair held up through a heat wave. Would use again.",
      daysAgo: 11,
    },
    {
      authorName: "Maria L.",
      rating: 5,
      text: "Fair pricing and no upselling. They fixed our furnace quickly and left the work area clean.",
      daysAgo: 18,
    },
    {
      authorName: "Chris P.",
      rating: 3,
      text: "Repair was fine but the arrival window was wider than expected. Communication could be better.",
      daysAgo: 24,
    },
    {
      authorName: "Dana R.",
      rating: 5,
      text: "Emergency call on a Sunday — they showed up within two hours. Lifesavers.",
      daysAgo: 31,
    },
  ];
}
