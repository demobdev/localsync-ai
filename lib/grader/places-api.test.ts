import { describe, expect, it } from "vitest";

import {
  GooglePlacesRequestError,
  parseGooglePlacesResponse,
} from "@/lib/grader/places-api";

describe("Google Places response handling", () => {
  it("does not misclassify a referrer restriction as an empty search", async () => {
    const response = new Response(
      JSON.stringify({
        error: {
          code: 403,
          status: "PERMISSION_DENIED",
          message: "Requests from referer http://localhost:3012/ are blocked.",
        },
      }),
      { status: 403, headers: { "Content-Type": "application/json" } },
    );

    await expect(parseGooglePlacesResponse(response)).rejects.toMatchObject({
      name: "GooglePlacesRequestError",
      code: "configuration",
      status: 403,
      userMessage:
        "Business search is temporarily unavailable because this site origin is not allowed by Google Places.",
    } satisfies Partial<GooglePlacesRequestError>);
  });

  it("keeps a successful empty result distinct from an upstream failure", async () => {
    const response = new Response(JSON.stringify({ suggestions: [] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

    await expect(
      parseGooglePlacesResponse<{ suggestions: unknown[] }>(response),
    ).resolves.toEqual({ suggestions: [] });
  });

  it("classifies quota responses as retryable availability errors", async () => {
    const response = new Response(
      JSON.stringify({
        error: {
          code: 429,
          status: "RESOURCE_EXHAUSTED",
          message: "Quota exceeded.",
        },
      }),
      { status: 429, headers: { "Content-Type": "application/json" } },
    );

    await expect(parseGooglePlacesResponse(response)).rejects.toMatchObject({
      code: "rate_limited",
      status: 429,
    } satisfies Partial<GooglePlacesRequestError>);
  });
});
