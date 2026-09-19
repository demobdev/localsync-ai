"use client";

import { useRouter } from "next/navigation";
import { useMemo, useTransition } from "react";
import {
  ArrowRightIcon,
  CheckCircle2Icon,
  CircleDotIcon,
  Clock3Icon,
  ListChecksIcon,
  LockKeyholeIcon,
  RadioTowerIcon,
  SendIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { toast } from "sonner";

import {
  approveSubmissionTargetAction,
  startSubmissionCampaignAction,
  type LatestSubmissionCampaign,
  type SubmissionCampaignTargetRow,
} from "@/app/actions/listing-campaigns";
import { createChecklistTasksAction } from "@/app/actions/tasks";
import { PublisherIcon } from "@/components/brand/publisher-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  submissionCampaignProgress,
  submissionTargetLabel,
  type SubmissionTargetStatus,
} from "@/lib/publishers/campaign";
import { publisherDeliveryLabel } from "@/lib/publishers/delivery";
import { cn } from "@/lib/utils";

function statusVariant(status: SubmissionTargetStatus) {
  if (status === "verified") return "default" as const;
  if (status === "failed" || status === "blocked") {
    return "destructive" as const;
  }
  if (
    status === "ready_for_review" ||
    status === "approved" ||
    status === "verification_required" ||
    status === "submitted"
  ) {
    return "secondary" as const;
  }
  return "outline" as const;
}

function CampaignMetric({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="min-w-0 border-r px-4 py-3 last:border-r-0">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="truncate text-[11px] font-semibold tracking-wide uppercase">
          {label}
        </span>
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function TargetAction({
  target,
  pending,
  approve,
  createVerificationTasks,
}: {
  target: SubmissionCampaignTargetRow;
  pending: boolean;
  approve: (target: SubmissionCampaignTargetRow) => void;
  createVerificationTasks: (target: SubmissionCampaignTargetRow) => void;
}) {
  if (target.status === "ready_for_review") {
    return (
      <Button size="sm" onClick={() => approve(target)} disabled={pending}>
        Approve &amp; queue
        <SendIcon className="size-3.5" />
      </Button>
    );
  }

  if (target.status === "verification_required") {
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={() => createVerificationTasks(target)}
        disabled={pending}
      >
        Create verification steps
        <ListChecksIcon className="size-3.5" />
      </Button>
    );
  }

  if (target.status === "planned") {
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={() => {
          document
            .getElementById("submission-workspace")
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
      >
        Find listing
        <ArrowRightIcon className="size-3.5" />
      </Button>
    );
  }

  if (target.status === "blocked") {
    return (
      <Button size="sm" variant="ghost" disabled>
        <LockKeyholeIcon className="size-3.5" />
        Approval pending
      </Button>
    );
  }

  return null;
}

export function SubmissionCampaignPanel({
  locationId,
  sourceCount,
  campaign,
}: {
  locationId: string;
  sourceCount: number;
  campaign: LatestSubmissionCampaign | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const progress = useMemo(
    () => submissionCampaignProgress(campaign?.targets.map((target) => target.status) ?? []),
    [campaign],
  );
  const attentionTargets = useMemo(
    () =>
      campaign?.targets
        .filter((target) =>
          [
            "ready_for_review",
            "verification_required",
            "failed",
            "blocked",
            "planned",
          ].includes(target.status),
        )
        .slice(0, 8) ?? [],
    [campaign],
  );

  function startCampaign() {
    startTransition(async () => {
      try {
        const result = await startSubmissionCampaignAction(locationId);
        toast.success(
          result.reused
            ? "Opened the active submission campaign"
            : `Campaign created across ${result.targetCount} publisher sources`,
        );
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Could not start the campaign",
        );
      }
    });
  }

  function approve(target: SubmissionCampaignTargetRow) {
    startTransition(async () => {
      try {
        await approveSubmissionTargetAction({ locationId, targetId: target.id });
        toast.success(`${target.publisherName} approved — no external success claimed yet`);
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Could not approve the submission",
        );
      }
    });
  }

  function createVerificationTasks(target: SubmissionCampaignTargetRow) {
    startTransition(async () => {
      try {
        const tasks = await createChecklistTasksAction({
          locationId,
          publisherId: target.publisherId,
        });
        toast.success(
          tasks.length > 0
            ? `${tasks.length} ${target.publisherName} verification step${tasks.length === 1 ? "" : "s"} created`
            : "No new verification steps were needed",
        );
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Could not create verification steps",
        );
      }
    });
  }

  if (!campaign) {
    return (
      <Card className="localmap-card-glow overflow-hidden border-primary/20">
        <div className="grid lg:grid-cols-[1.3fr_.7fr]">
          <CardHeader className="p-6 sm:p-7">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <RadioTowerIcon className="size-5" />
            </div>
            <CardTitle className="mt-5 text-xl">Start the submission campaign</CardTitle>
            <CardDescription className="max-w-2xl text-sm leading-relaxed">
              Route the approved Master Profile across {sourceCount} configured
              sources. Every publisher receives an honest job state: direct,
              partner, managed, customer verification, or monitoring.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col justify-center border-t bg-muted/20 p-6 lg:border-t-0 lg:border-l sm:p-7">
            <p className="text-sm font-semibold">What happens immediately</p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>• Snapshot the current Master Profile</li>
              <li>• Create one durable job per publisher</li>
              <li>• Surface approvals and customer verification</li>
              <li>• Preserve an evidence-ready activity ledger</li>
            </ul>
            <Button className="mt-5" onClick={startCampaign} disabled={pending}>
              {pending ? "Creating campaign…" : "Start submission campaign"}
              <ArrowRightIcon className="size-4" />
            </Button>
          </CardContent>
        </div>
      </Card>
    );
  }

  return (
    <Card className="localmap-card-glow overflow-hidden">
      <CardHeader className="gap-5 border-b bg-muted/10 p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle>Submission campaign</CardTitle>
              <Badge variant="default" className="capitalize">
                {campaign.status}
              </Badge>
            </div>
            <CardDescription className="mt-1.5">
              Started {new Date(campaign.startedAt).toLocaleDateString()} · {progress.total}{" "}
              publisher jobs · each state backed by a durable event record
            </CardDescription>
          </div>
          <div className="min-w-48">
            <div className="flex items-center justify-between text-xs font-medium">
              <span>Campaign progress</span>
              <span className="tabular-nums">{progress.progressPercent}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-[width]"
                style={{ width: `${progress.progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        <div className="grid overflow-hidden rounded-2xl border bg-background sm:grid-cols-3 xl:grid-cols-6">
          <CampaignMetric
            label="Sources"
            value={progress.total}
            icon={<CircleDotIcon className="size-3.5" />}
          />
          <CampaignMetric
            label="Verified"
            value={progress.verified}
            icon={<ShieldCheckIcon className="size-3.5" />}
          />
          <CampaignMetric
            label="In flight"
            value={progress.inFlight}
            icon={<SendIcon className="size-3.5" />}
          />
          <CampaignMetric
            label="Approve"
            value={progress.awaitingApproval}
            icon={<ListChecksIcon className="size-3.5" />}
          />
          <CampaignMetric
            label="Your action"
            value={progress.customerAction}
            icon={<Clock3Icon className="size-3.5" />}
          />
          <CampaignMetric
            label="Monitored"
            value={progress.monitored}
            icon={<RadioTowerIcon className="size-3.5" />}
          />
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="flex items-center justify-between border-b px-5 py-4 sm:px-6">
          <div>
            <p className="text-sm font-semibold">Next campaign actions</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Approval queues work; it never marks a publisher submitted or live.
            </p>
          </div>
          <Badge variant="outline">{attentionTargets.length} shown</Badge>
        </div>

        {attentionTargets.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <CheckCircle2Icon className="mx-auto size-6 text-emerald-600" />
            <p className="mt-3 text-sm font-semibold">No immediate actions</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Delivery and monitoring jobs are progressing without customer input.
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {attentionTargets.map((target) => (
              <div
                key={target.id}
                className="grid gap-4 px-5 py-5 sm:px-6 lg:grid-cols-[minmax(200px,.8fr)_minmax(280px,1.4fr)_auto] lg:items-center"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <PublisherIcon slug={target.publisherSlug} badge size={38} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {target.publisherName}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {publisherDeliveryLabel({
                        deliveryRail: target.deliveryRail,
                        approvalStatus:
                          target.status === "blocked" ? "pending" : "production",
                      })}
                    </p>
                  </div>
                </div>

                <div>
                  <Badge variant={statusVariant(target.status)}>
                    {submissionTargetLabel(target.status)}
                  </Badge>
                  <p className="mt-2 max-w-2xl text-xs leading-relaxed text-muted-foreground">
                    {target.statusDetail}
                  </p>
                </div>

                <div className={cn("flex lg:justify-end", pending && "opacity-70")}>
                  <TargetAction
                    target={target}
                    pending={pending}
                    approve={approve}
                    createVerificationTasks={createVerificationTasks}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {campaign.recentEvents.length > 0 ? (
          <div className="border-t bg-muted/10 px-5 py-4 sm:px-6">
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Latest event
            </p>
            <p className="mt-1.5 text-sm">
              {campaign.recentEvents[0]?.message}
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
