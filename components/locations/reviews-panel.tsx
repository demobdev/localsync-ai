"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { StarIcon } from "lucide-react";
import { toast } from "sonner";

import {
  approveReviewReplyAction,
  generateReviewReplyDraftAction,
  rejectReviewReplyAction,
  seedDemoReviewsAction,
  skipReviewAction,
  syncGoogleReviewsAction,
  type LocationReviewRow,
} from "@/app/actions/reviews";
import { ActionLoadingOverlay } from "@/components/ui/action-loading-overlay";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ReviewScoreBreakdown } from "@/lib/reviews/score";
import { cn } from "@/lib/utils";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <StarIcon
          key={index}
          className={cn(
            "size-4",
            index < rating
              ? "fill-amber-400 text-amber-400"
              : "text-muted-foreground/30",
          )}
        />
      ))}
    </div>
  );
}

function formatReviewDate(date: Date | null) {
  if (!date) {
    return "Unknown date";
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ReviewsPanel({
  locationId,
  reviews,
  summary,
  googleLinked,
}: {
  locationId: string;
  reviews: LocationReviewRow[];
  summary: ReviewScoreBreakdown;
  googleLinked: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function run(action: () => Promise<unknown>, success: string) {
    startTransition(async () => {
      try {
        await action();
        toast.success(success);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Action failed");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Review score",
            value: summary.totalCount > 0 ? String(summary.score) : "—",
            hint: "Rating + response rate (0–100)",
          },
          {
            label: "Average rating",
            value:
              summary.averageRating !== null
                ? `${summary.averageRating}★`
                : "—",
            hint: "Across all ingested reviews",
          },
          {
            label: "Response rate",
            value: summary.totalCount > 0 ? `${summary.responseRate}%` : "—",
            hint: "Replied vs total reviews",
          },
          {
            label: "Needs reply",
            value: String(summary.unrepliedCount),
            hint: "Unreplied or draft pending",
          },
        ].map((stat) => (
          <Card key={stat.label} className="localmap-card-glow">
            <CardHeader className="pb-2">
              <CardDescription>{stat.label}</CardDescription>
              <CardTitle className="text-2xl tabular-nums">{stat.value}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">{stat.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="localmap-card-glow">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Review inbox</CardTitle>
            <CardDescription>
              AI drafts replies — you approve before anything is saved. Google
              posting requires GBP write access (Phase 2).
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              disabled={isPending}
              onClick={() =>
                run(
                  () => seedDemoReviewsAction(locationId),
                  "Demo reviews loaded",
                )
              }
            >
              Load demo reviews
            </Button>
            <Button
              disabled={isPending || !googleLinked}
              onClick={() =>
                run(
                  () => syncGoogleReviewsAction(locationId),
                  "Google reviews synced",
                )
              }
            >
              Sync from Google
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!googleLinked ? (
            <p className="rounded-xl border border-dashed bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
              Import from Google in{" "}
              <span className="font-medium text-foreground">Connect → Google</span>{" "}
              to link this location for review sync. Until GBP API quota is
              approved, use demo reviews to try the reply flow.
            </p>
          ) : null}

          {reviews.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-muted/30 px-4 py-10 text-center">
              <p className="text-sm font-medium">No reviews yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Load demo reviews or sync from Google once connected.
              </p>
            </div>
          ) : (
            reviews.map((review) => (
              <article
                key={review.id}
                className="space-y-3 rounded-xl border bg-background/60 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{review.authorName}</p>
                      <Badge variant="outline" className="capitalize">
                        {review.source}
                      </Badge>
                      {review.replyStatus === "replied" ? (
                        <Badge>Replied</Badge>
                      ) : null}
                      {review.replyStatus === "skipped" ? (
                        <Badge variant="secondary">Skipped</Badge>
                      ) : null}
                      {review.replyStatus === "draft_pending" ? (
                        <Badge variant="secondary">Draft pending</Badge>
                      ) : null}
                    </div>
                    <StarRating rating={review.rating} />
                    <p className="text-xs text-muted-foreground">
                      {formatReviewDate(review.publishedAt)}
                    </p>
                  </div>
                  {review.replyStatus === "unreplied" ? (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        disabled={isPending}
                        onClick={() =>
                          run(
                            () => generateReviewReplyDraftAction(review.id),
                            "Reply draft ready for review",
                          )
                        }
                      >
                        Draft reply
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={isPending}
                        onClick={() =>
                          run(
                            () => skipReviewAction(review.id),
                            "Review skipped",
                          )
                        }
                      >
                        Skip
                      </Button>
                    </div>
                  ) : null}
                </div>

                <p className="text-sm leading-relaxed">{review.text}</p>

                {review.replyText ? (
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                    <p className="text-xs font-medium text-primary">
                      Saved reply
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {review.replyText}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Stored in LocalSync — GBP auto-post lands in Phase 2.
                    </p>
                  </div>
                ) : null}

                {review.pendingDraft ? (
                  <div className="space-y-3 rounded-lg border border-primary/30 bg-primary/5 p-4">
                    <p className="text-sm font-medium">Pending reply draft</p>
                    <p className="text-sm text-muted-foreground">
                      {review.pendingDraft.draftReply}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        disabled={isPending}
                        onClick={() =>
                          run(
                            () =>
                              approveReviewReplyAction(
                                review.pendingDraft!.requestId,
                              ),
                            "Reply approved and saved",
                          )
                        }
                      >
                        Approve reply
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isPending}
                        onClick={() =>
                          run(
                            () =>
                              rejectReviewReplyAction(
                                review.pendingDraft!.requestId,
                              ),
                            "Draft rejected",
                          )
                        }
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                ) : null}
              </article>
            ))
          )}
        </CardContent>
      </Card>

      <ActionLoadingOverlay
        active={isPending}
        label="Working on reviews…"
      />
    </div>
  );
}
