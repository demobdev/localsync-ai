import {
  CheckCircle2Icon,
  RadarIcon,
  SparklesIcon,
  WorkflowIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";

const COMPARISON_ROWS = [
  {
    area: "Canonical identity",
    yext: "Knowledge Graph",
    localmap: "Master Business Profile with version history",
    localmapWin: true,
  },
  {
    area: "Publisher sync",
    yext: "200+ direct API integrations",
    localmap:
      "~20 publishers with clear rails: API, guided, manual, or audit-only",
    localmapWin: false,
  },
  {
    area: "Listings verification",
    yext: "Listings Verifier vs Knowledge Graph",
    localmap: "Live audits with screenshot evidence on every check",
    localmapWin: true,
  },
  {
    area: "AI visibility",
    yext: "Structured for Google, Apple, ChatGPT, Gemini",
    localmap:
      "Hosted citation pages, schema.org, llms.txt, and IndexNow (included in Pro)",
    localmapWin: true,
  },
  {
    area: "Reviews",
    yext: "Review monitoring + response",
    localmap: "Review inbox with AI reply drafts you approve before publish",
    localmapWin: true,
  },
  {
    area: "Scores",
    yext: "Visibility + optimization scorecard",
    localmap: "Visibility, review, and workspace health scores you can act on",
    localmapWin: true,
  },
  {
    area: "Industry networks",
    yext: "Bundled into top tiers and enterprise deals",
    localmap: "Optional vertical add-ons at +$15/mo. Only what you need",
    localmapWin: true,
  },
  {
    area: "Governance",
    yext: "Enterprise RBAC + audit trails",
    localmap: "Approve-before-publish on profile, FAQs, and review replies",
    localmapWin: true,
  },
  {
    area: "Buying experience",
    yext: "Annual contracts · sales demo required",
    localmap: "Self-serve · month-to-month · from $19/location",
    localmapWin: true,
  },
];

export function YextComparisonSection() {
  return (
    <section className="border-y bg-muted/20">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="mb-10 max-w-3xl">
          <Badge variant="secondary" className="mb-3 rounded-full">
            Built for how local search actually works
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight">
            The listings platform agencies expect, without the enterprise tax
          </h2>
          <p className="mt-4 text-muted-foreground">
            One master profile at the center. Distribution to the directories that
            matter. Intelligence and AI on top. LocalMap keeps the architecture
            clear, and tells you honestly which publishers sync, guide, or
            audit.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="grid grid-cols-1 border-b bg-muted/40 text-sm font-semibold md:grid-cols-3">
            <div className="px-4 py-3">Capability</div>
            <div className="border-t px-4 py-3 md:border-t-0 md:border-l">
              Yext
            </div>
            <div className="border-t px-4 py-3 text-primary md:border-t-0 md:border-l">
              LocalMap
            </div>
          </div>
          {COMPARISON_ROWS.map((row) => (
            <div
              key={row.area}
              className="grid grid-cols-1 border-b last:border-b-0 md:grid-cols-3"
            >
              <div className="px-4 py-4 font-medium">{row.area}</div>
              <div className="border-t px-4 py-4 text-sm text-muted-foreground md:border-t-0 md:border-l">
                {row.yext}
              </div>
              <div className="flex gap-2 border-t px-4 py-4 text-sm md:border-t-0 md:border-l">
                {row.localmapWin ? (
                  <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-primary" />
                ) : (
                  <RadarIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                )}
                <span>{row.localmap}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            {
              icon: SparklesIcon,
              title: "Built for AI discovery",
              body: "Structured pages assistants can cite, not just another push to directories.",
            },
            {
              icon: WorkflowIcon,
              title: "You approve first",
              body: "AI drafts profile fixes and review replies. Nothing publishes without you.",
            },
            {
              icon: RadarIcon,
              title: "Honest publisher rails",
              body: "Every directory is labeled API, guided, manual, or audit. No fake syndication.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-xl border bg-background p-4"
            >
              <item.icon className="mb-2 size-5 text-primary" />
              <p className="font-semibold">{item.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
