"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
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
  type SyncGoogleReviewsResult,
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

type ReviewsPanelProps = {
  locationId: string;
  reviews: LocationReviewRow[];
  summary: ReviewScoreBreakdown;
  googleLinked: boolean;
};

function syncMessage(result: SyncGoogleReviewsResult): string {
  if (!result.ok) throw new Error(result.error);
  const skipped = result.skipped > 0
    ? ` ${result.skipped} review(s) had unsupported data and were skipped.`
    : "";
  if (result.total === 0) {
    return (result.skipped > 0
      ? "Google returned no importable reviews. Existing saved reviews were kept."
      : "Google returned no reviews for this location. Existing saved reviews were kept.") + skipped;
  }
  return `Read ${result.total} Google review(s): ${result.inserted} added, ${result.updated} updated, ${result.unchanged} unchanged.` + skipped;
}

export function ReviewsPanel(props: ReviewsPanelProps) {
  // A different location must never inherit the previous location's sync status.
  return <ReviewsPanelContent key={props.locationId} {...props} />;
}

function ReviewsPanelContent({
  locationId,
  reviews,
  summary,
  googleLinked,
}: ReviewsPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [workingLabel, setWorkingLabel] = useState("Working on reviews…");
  const [outcome, setOutcome] = useState<{ error: boolean; message: string } | null>(null);
  const actionInFlight = useRef(false);
  const mounted = useRef(true);
  const googleCount = reviews.filter((review) => review.source === "google").length;
  const demoCount = reviews.filter((review) => review.source === "demo").length;

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  function run<T>(
    action: () => Promise<T>,
    success: string | ((result: T) => string),
    label = "Working on reviews…",
  ) {
    // A synchronous guard also covers clicks before React commits disabled state.
    if (actionInFlight.current || isPending) return;
    actionInFlight.current = true;
    setWorkingLabel(label);
    setOutcome(null);
    startTransition(async () => {
      try {
        const result = await action();
        if (!mounted.current) return;
        const message = typeof success === "function" ? success(result) : success;
        setOutcome({ error: false, message });
        toast.success(message);
        router.refresh();
      } catch (error) {
        if (!mounted.current) return;
        const message = error instanceof Error ? error.message : "Action failed. Please try again.";
        setOutcome({ error: true, message });
        toast.error(message);
      } finally {
        actionInFlight.current = false;
      }
    });
  }

  return (
    <div className="relative space-y-6" aria-busy={isPending}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Review score",
            value: summary.totalCount > 0 ? String(summary.score) : "—",
            hint: "Rating + saved-reply coverage (0–100)",
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
            hint: "Includes local saves; not a Google posting rate",
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
              Sync reads reviews and existing replies from Google only when you
              click. Approving an AI reply saves it in LocalSync; it does not post
              to Google.
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
                  syncMessage,
                  "Reading reviews from Google…",
                )
              }
            >
              {isPending && workingLabel === "Reading reviews from Google…"
                ? "Syncing from Google…"
                : "Sync from Google"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {outcome ? (
            <p
              role={outcome.error ? "alert" : "status"}
              className={cn("rounded-xl border px-4 py-3 text-sm", outcome.error && "border-destructive/40 text-destructive")}
            >
              {outcome.message}
            </p>
          ) : null}
          <p className="text-sm text-muted-foreground">
            {googleCount} Google review(s) saved · {demoCount} demo review(s)
          </p>
          {demoCount > 0 ? (
            <p className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm">
              Demo reviews are sample data. The summary figures above include
              these samples, so they do not represent your Google-only results.
            </p>
          ) : null}
          {!googleLinked ? (
            <p className="rounded-xl border border-dashed bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
              Import from Google in{" "}
              <Link href="/dashboard/connect/google" className="font-medium text-foreground underline">Connect → Google</Link>{" "}
              to link this location for review sync. You can also load clearly
              labeled demo reviews to try the reply flow.
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
                        {review.source === "demo" ? "Demo data" : review.source}
                      </Badge>
                      {review.replyStatus === "replied" ? (
                        <Badge>Reply saved</Badge>
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
                      This may be an imported Google reply or a reply saved here.
                      Approving a draft in LocalSync does not publish it to Google.
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
        label={workingLabel}
      />
    </div>
  );
}
