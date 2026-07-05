import { generateObject } from "ai";
import { z } from "zod";

export const extractedListingSchema = z.object({
  businessName: z.string().nullable().describe("The business name as shown on the listing"),
  phone: z.string().nullable().describe("Primary phone number"),
  addressLine1: z.string().nullable().describe("Street address line"),
  city: z.string().nullable(),
  state: z.string().nullable().describe("State or region, abbreviated if shown that way"),
  postalCode: z.string().nullable(),
  website: z.string().nullable().describe("Business website URL if listed"),
  hoursSummary: z
    .string()
    .nullable()
    .describe("Business hours as free text, e.g. 'Mon-Fri 8am-5pm'"),
  categories: z
    .array(z.string())
    .describe("Business categories or service types shown on the listing"),
  confidence: z
    .enum(["high", "medium", "low"])
    .describe("How confident you are this page is a listing for a specific business"),
});

export type ExtractedListing = z.infer<typeof extractedListingSchema>;

const EXTRACTION_MODEL = process.env.AUDIT_EXTRACTION_MODEL ?? "google/gemini-2.5-flash";

export async function extractListingData(
  markdown: string,
  sourceUrl: string,
): Promise<ExtractedListing> {
  const { object } = await generateObject({
    model: EXTRACTION_MODEL,
    schema: extractedListingSchema,
    prompt: [
      "You are auditing a local business listing page for NAP (name, address, phone) consistency.",
      `Source URL: ${sourceUrl}`,
      "Extract ONLY information that is explicitly present on the page. Use null for anything not shown.",
      "Do not guess or normalize values — return them exactly as displayed.",
      "",
      "Page content (markdown):",
      markdown.slice(0, 30000),
    ].join("\n"),
  });

  return object;
}
