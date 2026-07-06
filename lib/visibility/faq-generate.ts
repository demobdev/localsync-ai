import { generateObject } from "ai";
import { z } from "zod";

import type { LocationProfileSnapshot } from "@/lib/types/location-profile";

const faqDraftSchema = z.object({
  faqs: z
    .array(
      z.object({
        question: z.string().describe("A question a customer might ask this business"),
        answer: z
          .string()
          .describe(
            "A factual answer based only on the provided business info. Do not invent services or policies.",
          ),
      }),
    )
    .min(3)
    .max(6),
});

export type FaqDraft = z.infer<typeof faqDraftSchema>["faqs"][number];

const FAQ_MODEL = process.env.VISIBILITY_FAQ_MODEL ?? "google/gemini-2.5-flash";

export async function generateFaqDrafts(input: {
  profile: LocationProfileSnapshot;
  categoryName?: string;
  serviceNames: string[];
}): Promise<FaqDraft[]> {
  const { profile, categoryName, serviceNames } = input;

  const { object } = await generateObject({
    model: FAQ_MODEL,
    schema: faqDraftSchema,
    prompt: [
      "Generate FAQ entries for a local business visibility page.",
      "Use ONLY facts from the business profile below. If you cannot answer from the data, write a conservative generic answer or skip that topic.",
      "Questions should be practical (hours, location, services, contact).",
      "",
      `Business: ${profile.name}`,
      categoryName ? `Category: ${categoryName}` : "",
      profile.description ? `Description: ${profile.description}` : "",
      profile.phone ? `Phone: ${profile.phone}` : "",
      profile.website ? `Website: ${profile.website}` : "",
      profile.city ? `City: ${profile.city}` : "",
      profile.state ? `State: ${profile.state}` : "",
      serviceNames.length > 0 ? `Services: ${serviceNames.join(", ")}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
  });

  return object.faqs;
}
