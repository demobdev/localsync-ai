import { googleReviewParent } from "./google-resource-names";
import { classifyGbpFetchError, type GbpFetchErrorCode } from "./google-errors";

export type GoogleReviewRecord = {
  externalId: string;
  authorName: string;
  rating: number;
  text: string;
  publishedAt: Date | null;
  existingReply?: string | null;
};

export type FetchGoogleReviewsResult =
  | { ok: true; reviews: GoogleReviewRecord[] }
  | {
      ok: false;
      error: { code: GbpFetchErrorCode; message: string };
    };

type GbpReviewPayload = {
  nextPageToken?: string;
  reviews?: Array<{
    reviewId?: string;
    reviewer?: { displayName?: string };
    starRating?: string;
    comment?: string;
    createTime?: string;
    reviewReply?: { comment?: string };
  }>;
};

const STAR_MAP: Record<string, number> = {
  ONE: 1,
  TWO: 2,
  THREE: 3,
  FOUR: 4,
  FIVE: 5,
};

export async function fetchGoogleReviewsSafe(
  accessToken: string,
  gbpResourceName: string,
): Promise<FetchGoogleReviewsResult> {
  const parent = googleReviewParent(gbpResourceName);

  if (!parent) {
    return {
      ok: false,
      error: {
        code: "unknown",
        message:
          "The Google location link is missing its account ID or is invalid. Re-import this location from Google Business Profile to update the link before syncing reviews.",
      },
    };
  }

  const reviews: GoogleReviewRecord[] = [];
  const seenPageTokens = new Set<string>();
  let pageToken: string | undefined;
  do {
    const params = new URLSearchParams({ pageSize: "50" });
    if (pageToken) params.set("pageToken", pageToken);
    const response = await fetch(
      `https://mybusiness.googleapis.com/v4/${parent}/reviews?${params}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    if (!response.ok) {
      const body = await response.text();
      return {
        ok: false,
        error: classifyGbpFetchError(body, response.status),
      };
    }

    const payload = (await response.json()) as GbpReviewPayload;
    for (const review of payload.reviews ?? []) {
      const rating = review.starRating
        ? STAR_MAP[review.starRating]
        : undefined;
      if (!rating || !review.reviewId) {
        continue;
      }

      reviews.push({
        externalId: review.reviewId,
        authorName: review.reviewer?.displayName?.trim() || "Google user",
        rating,
        text: review.comment?.trim() || "(No comment)",
        publishedAt: review.createTime ? new Date(review.createTime) : null,
        existingReply: review.reviewReply?.comment ?? null,
      });
    }

    pageToken = payload.nextPageToken;
    if (pageToken && seenPageTokens.has(pageToken)) {
      return {
        ok: false,
        error: {
          code: "unknown",
          message:
            "Google returned a repeated reviews page token. Retry the sync; partial results were not saved.",
        },
      };
    }
    if (pageToken) seenPageTokens.add(pageToken);
  } while (pageToken);

  return { ok: true, reviews };
}
