export type ReviewScoreInput = {
  rating: number;
  replyStatus: "unreplied" | "draft_pending" | "replied" | "skipped";
};

export type ReviewScoreBreakdown = {
  averageRating: number | null;
  responseRate: number;
  unrepliedCount: number;
  totalCount: number;
  score: number;
};

export function computeReviewScore(
  reviews: ReviewScoreInput[],
): ReviewScoreBreakdown {
  if (reviews.length === 0) {
    return {
      averageRating: null,
      responseRate: 0,
      unrepliedCount: 0,
      totalCount: 0,
      score: 0,
    };
  }

  const averageRating =
    reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
  const repliedCount = reviews.filter(
    (review) => review.replyStatus === "replied",
  ).length;
  const responseRate = Math.round((repliedCount / reviews.length) * 100);
  const unrepliedCount = reviews.filter(
    (review) =>
      review.replyStatus === "unreplied" ||
      review.replyStatus === "draft_pending",
  ).length;

  const ratingScore = (averageRating / 5) * 50;
  const responseScore = (responseRate / 100) * 50;

  return {
    averageRating: Math.round(averageRating * 10) / 10,
    responseRate,
    unrepliedCount,
    totalCount: reviews.length,
    score: Math.round(ratingScore + responseScore),
  };
}
