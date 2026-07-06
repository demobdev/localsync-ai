import { generateObject } from "ai";
import { z } from "zod";

import type { LocationProfileSnapshot } from "@/lib/types/location-profile";

const replyDraftSchema = z.object({
  reply: z
    .string()
    .describe(
      "A professional, warm public reply to the customer review. Thank them, address specifics when possible, and invite offline follow-up for unresolved issues. Keep under 120 words.",
    ),
});

const REVIEW_REPLY_MODEL =
  process.env.REVIEW_REPLY_MODEL ?? "google/gemini-2.5-flash";

export async function generateReviewReplyDraft(input: {
  profile: LocationProfileSnapshot;
  authorName: string;
  rating: number;
  reviewText: string;
}): Promise<string> {
  const { profile, authorName, rating, reviewText } = input;

  const { object } = await generateObject({
    model: REVIEW_REPLY_MODEL,
    schema: replyDraftSchema,
    prompt: [
      "Write a public reply to a customer review for a local home-services business.",
      "Be genuine and professional. Do not invent policies, discounts, or contact details not provided.",
      "For low ratings, acknowledge the concern and offer to make it right offline.",
      "Do not use hashtags or emojis.",
      "",
      `Business: ${profile.name}`,
      profile.phone ? `Phone: ${profile.phone}` : "",
      profile.city ? `City: ${profile.city}` : "",
      "",
      `Reviewer: ${authorName}`,
      `Rating: ${rating}/5`,
      `Review: ${reviewText}`,
    ]
      .filter(Boolean)
      .join("\n"),
  });

  return object.reply.trim();
}
