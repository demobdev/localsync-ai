import { z } from "zod";

import { googleReviewParent } from "./google-resource-names";
import { classifyGbpFetchError, type GbpFetchErrorCode } from "./google-errors";

export type GoogleReviewRecord = {
  externalId: string;
  authorName: string;
  rating: number;
  text: string;
  publishedAt: Date | null;
  existingReply: string | null;
  replyUpdatedAt: Date | null;
};

export type FetchGoogleReviewsResult =
  | {
      ok: true;
      reviews: GoogleReviewRecord[];
      skipped: number;
      pagesFetched: number;
      totalReviewCount: number | null;
      averageRating: number | null;
    }
  | {
      ok: false;
      error: { code: GbpFetchErrorCode; message: string };
    };

const reviewSchema = z.object({
  reviewId: z.string().trim().min(1),
  reviewer: z.object({ displayName: z.string().optional() }).optional(),
  starRating: z.enum(["ONE", "TWO", "THREE", "FOUR", "FIVE"]),
  comment: z.string().optional(),
  createTime: z.string().optional(),
  reviewReply: z
    .object({ comment: z.string().optional(), updateTime: z.string().optional() })
    .optional(),
});
const pageSchema = z.object({
  nextPageToken: z.string().optional(),
  reviews: z.array(z.unknown()).optional(),
  totalReviewCount: z.number().int().nonnegative().optional(),
  averageRating: z.number().min(0).max(5).optional(),
});

const STAR_MAP = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };

function parseDate(value: string | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

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

  const reviews = new Map<string, GoogleReviewRecord>();
  const seenPageTokens = new Set<string>();
  let pageToken: string | undefined;
  let skipped = 0;
  let pagesFetched = 0;
  let totalReviewCount: number | null = null;
  let averageRating: number | null = null;

  try {
    do {
      const params = new URLSearchParams({ pageSize: "50" });
      if (pageToken) params.set("pageToken", pageToken);
      const response = await fetch(
        `https://mybusiness.googleapis.com/v4/${parent}/reviews?${params}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          cache: "no-store",
          signal: AbortSignal.timeout(30_000),
        },
      );

      if (!response.ok) {
        return {
          ok: false,
          error: classifyGbpFetchError(await response.text(), response.status),
        };
      }

      const parsed = pageSchema.safeParse(await response.json());
      if (!parsed.success) {
        return {
          ok: false,
          error: {
            code: "unknown",
            message:
              "Google returned an unexpected reviews response. Retry the sync; partial results were not saved.",
          },
        };
      }
      const payload = parsed.data;
      pagesFetched += 1;
      totalReviewCount ??= payload.totalReviewCount ?? null;
      averageRating ??= payload.averageRating ?? null;

      for (const item of payload.reviews ?? []) {
        const parsedReview = reviewSchema.safeParse(item);
        if (!parsedReview.success) {
          skipped += 1;
          continue;
        }
        const review = parsedReview.data;
        // Google sorts by updateTime desc. A changing page boundary may repeat a
        // review; keep the first version and never insert the same ID twice.
        if (reviews.has(review.reviewId)) continue;
        reviews.set(review.reviewId, {
          externalId: review.reviewId,
          authorName: review.reviewer?.displayName?.trim() || "Google user",
          rating: STAR_MAP[review.starRating],
          text: review.comment?.trim() || "(No comment)",
          publishedAt: parseDate(review.createTime),
          existingReply: review.reviewReply?.comment?.trim() || null,
          replyUpdatedAt: parseDate(review.reviewReply?.updateTime),
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
  } catch {
    // Do not expose tokens, upstream response bodies, or internal error details.
    return {
      ok: false,
      error: {
        code: "unknown",
        message:
          "Could not finish reading Google reviews. The connection timed out, failed, or returned unreadable data. Retry the sync; partial results were not saved.",
      },
    };
  }

  return {
    ok: true,
    reviews: [...reviews.values()],
    skipped,
    pagesFetched,
    totalReviewCount,
    averageRating,
  };
}
