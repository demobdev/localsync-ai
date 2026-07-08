import Link from "next/link";
import {
  ArrowRightIcon,
  FileBarChart2Icon,
  RadarIcon,
  SearchIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { RecentMarketingInsight } from "@/lib/grader/dashboard";

function intentLabel(intent: string | undefined) {
  switch (intent) {
    case "protecting":
      return "Protect";
    case "competing":
      return "Gain ground";
    case "opportunity":
      return "Opportunity";
    default:
      return null;
  }
}

export function RecentMarketingInsightCard({
  insight,
}: {
  insight: RecentMarketingInsight;
}) {
  const isGrader = insight.kind === "grader";
  const title = insight.businessName ?? (isGrader ? "Grader audit" : "Free scan");
  const subtitle = insight.city ? `${title} · ${insight.city}` : title;
  const score = isGrader ? insight.totalScore : insight.score;

  return (
    <Card className="localmap-card-glow border-emerald-500/20 bg-emerald-500/5">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="secondary"
              className="rounded-full border border-emerald-500/25 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
            >
              {isGrader ? "Grader audit" : "Free scan"}
            </Badge>
            {isGrader && insight.grade ? (
              <Badge variant="outline">Grade {insight.grade}</Badge>
            ) : null}
          </div>
          <CardTitle className="text-xl">{subtitle}</CardTitle>
          <CardDescription>
            {isGrader
              ? `${insight.failedChecks} visibility leaks found — continue fixing them from your workspace.`
              : "Your scan results are linked to this business — keep improving visibility from here."}
          </CardDescription>
        </div>
        <div className="flex shrink-0 items-center gap-2 rounded-2xl border bg-background/80 px-4 py-3">
          {isGrader ? (
            <FileBarChart2Icon className="size-5 text-emerald-600" />
          ) : (
            <RadarIcon className="size-5 text-emerald-600" />
          )}
          <div>
            <p className="text-xs text-muted-foreground">Score</p>
            <p className="text-2xl font-bold tabular-nums">{score}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isGrader && insight.topKeywords.length > 0 ? (
          <div className="space-y-2">
            <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <SearchIcon className="size-3.5" />
              Top local keywords from your audit
            </p>
            <div className="flex flex-wrap gap-2">
              {insight.topKeywords.map((keyword) => {
                const label = intentLabel(keyword.intent);
                return (
                  <span
                    key={keyword.keyword}
                    className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1 text-xs"
                  >
                    <span className="font-medium">{keyword.keyword}</span>
                    {label ? (
                      <span className="text-muted-foreground">· {label}</span>
                    ) : null}
                  </span>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {isGrader ? (
            <Button
              size="sm"
              nativeButton={false}
              render={<Link href={`/grader/${insight.auditId}`} />}
            >
              View full audit report
              <ArrowRightIcon className="size-4" />
            </Button>
          ) : (
            <Button
              size="sm"
              nativeButton={false}
              render={<Link href="/grader" />}
            >
              Run another audit
              <ArrowRightIcon className="size-4" />
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            nativeButton={false}
            render={
              <Link
                href={
                  isGrader
                    ? `/dashboard/onboarding?auditId=${insight.auditId}&intent=fix`
                    : "/dashboard/locations"
                }
              />
            }
          >
            {isGrader ? "Continue fixing leaks" : "Open business profile"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
