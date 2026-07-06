import { classifyGbpFetchError, type GbpFetchErrorCode } from "./google";

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

function parseGbpLocationPath(gbpResourceName: string): {
  accountId: string;
  locationId: string;
} | null {
  // locations/{locationId} or accounts/{accountId}/locations/{locationId}
  const shortMatch = gbpResourceName.match(/^locations\/([^/]+)$/);
  if (shortMatch) {
    return { accountId: "-", locationId: shortMatch[1]! };
  }

  const fullMatch = gbpResourceName.match(
    /^accounts\/([^/]+)\/locations\/([^/]+)$/,
  );
  if (fullMatch) {
    return { accountId: fullMatch[1]!, locationId: fullMatch[2]! };
  }

  return null;
}

export async function fetchGoogleReviewsSafe(
  accessToken: string,
  gbpResourceName: string,
): Promise<FetchGoogleReviewsResult> {
  const parsed = parseGbpLocationPath(gbpResourceName);

  if (!parsed) {
    return {
      ok: false,
      error: {
        code: "unknown",
        message:
          "Invalid Google location link. Re-import from Google Business Profile first.",
      },
    };
  }

  const parent =
    parsed.accountId === "-"
      ? `locations/${parsed.locationId}`
      : `accounts/${parsed.accountId}/locations/${parsed.locationId}`;

  const response = await fetch(
    `https://mybusiness.googleapis.com/v4/${parent}/reviews?pageSize=50`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  if (!response.ok) {
    const body = await response.text();
    return {
      ok: false,
      error: classifyGbpFetchError(body),
    };
  }

  const payload = (await response.json()) as GbpReviewPayload;
  const reviews: GoogleReviewRecord[] = [];

  for (const review of payload.reviews ?? []) {
    const rating = review.starRating ? STAR_MAP[review.starRating] : undefined;
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

  return { ok: true, reviews };
}
