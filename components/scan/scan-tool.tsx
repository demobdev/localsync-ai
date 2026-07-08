"use client";

import Link from "next/link";
import {
  ArrowRightIcon,
  BotIcon,
  CheckCircle2Icon,
  GlobeIcon,
  LoaderIcon,
  LockIcon,
  RadarIcon,
  SearchIcon,
  SparklesIcon,
  XCircleIcon,
} from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  runPublicScanAction,
  type PublicScanResult,
} from "@/app/actions/scan";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const AGENT_STEPS = [
  "Dispatching crawl agent to your site…",
  "Reading your pages the way ChatGPT does…",
  "Extracting name, phone, address, and hours…",
  "Checking for AI-readable structured data…",
  "Scoring your AI visibility…",
];

function ScanProgress() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((current) => Math.min(current + 1, AGENT_STEPS.length - 1));
    }, 2600);

    return () => clearInterval(timer);
  }, []);

  return (
    <Card className="localmap-card-glow">
      <CardContent className="space-y-4 py-8">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
            <BotIcon className="size-5 animate-pulse text-primary" />
          </div>
          <div>
            <p className="font-medium">AI agents scanning your business</p>
            <p className="text-sm text-muted-foreground">
              Usually takes 15–30 seconds
            </p>
          </div>
        </div>
        <ul className="space-y-2">
          {AGENT_STEPS.map((label, index) => (
            <li
              key={label}
              className={cn(
                "flex items-center gap-2 text-sm transition-opacity",
                index > step && "opacity-30",
              )}
            >
              {index < step ? (
                <CheckCircle2Icon className="size-4 shrink-0 text-primary" />
              ) : index === step ? (
                <LoaderIcon className="size-4 shrink-0 animate-spin text-primary" />
              ) : (
                <RadarIcon className="size-4 shrink-0 text-muted-foreground" />
              )}
              <span>{label}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

const GRADE_COPY: Record<
  PublicScanResult["grade"],
  { label: string; className: string; message: string }
> = {
  critical: {
    label: "Critical",
    className: "text-red-600 dark:text-red-400",
    message: "AI engines are nearly blind to this business.",
  },
  poor: {
    label: "Poor",
    className: "text-orange-600 dark:text-orange-400",
    message: "You're losing AI-driven customers to competitors.",
  },
  fair: {
    label: "Fair",
    className: "text-amber-600 dark:text-amber-400",
    message: "The basics exist, but AI answers are choosing rivals.",
  },
  good: {
    label: "Good start",
    className: "text-primary",
    message: "Solid foundation — the full profile takes you further.",
  },
};

const LOCKED_ITEMS = [
  "Directory coverage — Google, Yelp, Apple, BBB + 16 more",
  "NAP consistency across every listing",
  "Competitor visibility benchmark",
  "AI citation readiness (llms.txt, schema.org page)",
  "Review response health",
  "Prioritized action plan, ranked by impact",
];

function ScanResults({
  result,
  signedIn,
}: {
  result: PublicScanResult;
  signedIn: boolean;
}) {
  const grade = GRADE_COPY[result.grade];
  const claimHref = signedIn
    ? `/dashboard/onboarding?add=1&scan=${result.scanId}`
    : `/sign-up?scan=${result.scanId}`;

  return (
    <div className="space-y-6">
      <Card className="localmap-card-glow overflow-hidden">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <CardDescription>Website AI readability score</CardDescription>
              <CardTitle className="text-lg">
                {result.businessName ?? result.url}
              </CardTitle>
            </div>
            <div className="text-right">
              <p className="text-5xl font-bold tracking-tight">
                <span className={grade.className}>{result.score}</span>
                <span className="text-xl text-muted-foreground">/100</span>
              </p>
              <Badge variant="secondary" className={cn("mt-1", grade.className)}>
                {grade.label}
              </Badge>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{grade.message}</p>
        </CardHeader>
        <CardContent className="space-y-2">
          {result.checks.map((check) => (
            <div
              key={check.id}
              className="flex items-start gap-3 rounded-xl border px-3 py-2.5"
            >
              {check.passed ? (
                <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-primary" />
              ) : (
                <XCircleIcon className="mt-0.5 size-4 shrink-0 text-red-500" />
              )}
              <div>
                <p className="text-sm font-medium">{check.label}</p>
                <p className="text-xs text-muted-foreground">{check.detail}</p>
              </div>
            </div>
          ))}
          <p className="pt-1 text-xs text-muted-foreground">
            This scan reads your website only, so it maxes out at 70. Your full
            Visibility Score in the dashboard also counts profile completeness
            and listing audits across 20+ directories.
          </p>
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden border-primary/30">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-background/60 to-background" />
        <CardHeader>
          <div className="flex items-center gap-2">
            <LockIcon className="size-4 text-primary" />
            <CardTitle className="text-base">
              Your full report is waiting
            </CardTitle>
          </div>
          <CardDescription>
            This free scan only covers your website. Your complete AI
            visibility report checks 20+ directories and AI surfaces:
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-2">
            {LOCKED_ITEMS.map((item) => (
              <li
                key={item}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <LockIcon className="size-3.5 shrink-0 text-muted-foreground/60" />
                {item}
              </li>
            ))}
          </ul>
          <div className="relative flex flex-col gap-2 sm:flex-row">
            <Button
              size="lg"
              className="flex-1"
              nativeButton={false}
              render={<Link href={claimHref} />}
            >
              <SparklesIcon className="size-4" />
              {signedIn
                ? "Add this business to your workspace"
                : "Claim your free profile & full report"}
            </Button>
            <Button
              size="lg"
              variant="outline"
              nativeButton={false}
              render={<Link href="/grader" />}
            >
              Get the full audit
            </Button>
          </div>
          <p className="text-center text-xs text-muted-foreground">
            Free to start. We pre-fill your profile from this scan — setup
            takes about a minute.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export function ScanTool({ signedIn = false }: { signedIn?: boolean }) {
  const [result, setResult] = useState<PublicScanResult | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        const scan = await runPublicScanAction({
          url: String(formData.get("url") ?? ""),
        });
        setResult(scan);
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Scan failed — check the URL and try again",
        );
      }
    });
  }

  if (isPending) {
    return <ScanProgress />;
  }

  if (result) {
    return <ScanResults result={result} signedIn={signedIn} />;
  }

  return (
    <Card className="localmap-card-glow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GlobeIcon className="size-5 text-primary" />
          Scan your business website
        </CardTitle>
        <CardDescription>
          Our AI agents crawl your site the way ChatGPT, Gemini, and Google do
          — then show you exactly what they can (and can&apos;t) see.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
          <Input
            name="url"
            placeholder="yourbusiness.com"
            required
            autoFocus
            className="h-11 flex-1"
            inputMode="url"
          />
          <Button type="submit" size="lg" disabled={isPending}>
            <SearchIcon className="size-4" />
            Run free scan
            <ArrowRightIcon className="size-4" />
          </Button>
        </form>
        <p className="mt-3 text-xs text-muted-foreground">
          No signup required for the scan. Takes ~20 seconds.
        </p>
      </CardContent>
    </Card>
  );
}
