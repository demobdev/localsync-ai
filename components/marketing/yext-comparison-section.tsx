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
    localmap: "Master Business Profile + version history",
    localmapWin: true,
  },
  {
    area: "Publisher sync",
    yext: "200+ direct API integrations",
    localmap: "~20 publishers, honestly labeled rails (API / guided / manual / audit)",
    localmapWin: false,
  },
  {
    area: "Listings verification",
    yext: "Listings Verifier vs Knowledge Graph",
    localmap: "Firecrawl audits + evidence + pgvector embeddings",
    localmapWin: true,
  },
  {
    area: "AI visibility",
    yext: "Structured for Google, Apple, ChatGPT, Gemini",
    localmap: "Hosted /l/[id] page, schema.org, llms.txt, IndexNow, crawler checks",
    localmapWin: true,
  },
  {
    area: "Reviews",
    yext: "Review monitoring + response",
    localmap: "Review inbox + AI reply drafts (approve before save)",
    localmapWin: true,
  },
  {
    area: "Scores",
    yext: "Visibility + optimization scorecard",
    localmap: "Visibility score + review score + setup checklist",
    localmapWin: true,
  },
  {
    area: "Industry packs",
    yext: "Restaurant menus, retail inventory, healthcare NPI",
    localmap: "Category packs (20 niches) — services + description today; field schemas next",
    localmapWin: false,
  },
  {
    area: "Governance",
    yext: "Enterprise RBAC + audit trails",
    localmap: "Approve-before-publish guardrail (FAQs, replies, profile)",
    localmapWin: true,
  },
  {
    area: "Positioning",
    yext: "Enterprise listings platform",
    localmap: "Agency-native local intelligence platform (LocalMap + LocalSync engine)",
    localmapWin: true,
  },
];

export function YextComparisonSection() {
  return (
    <section className="border-y bg-muted/20">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="mb-10 max-w-3xl">
          <Badge variant="secondary" className="mb-3 rounded-full">
            Same diagram as Yext — different execution
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight">
            What Don saw on Yext is what we&apos;re building
          </h2>
          <p className="mt-4 text-muted-foreground">
            Canonical profile in the middle → distribution out → intelligence
            and AI on top. LocalSync is the honest-rails, agency-first,
            AI-native version — built for LocalMap clients today, enterprise
            scale tomorrow.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="grid grid-cols-1 border-b bg-muted/40 text-sm font-semibold md:grid-cols-3">
            <div className="px-4 py-3">Capability</div>
            <div className="border-t px-4 py-3 md:border-t-0 md:border-l">
              Yext Listings
            </div>
            <div className="border-t px-4 py-3 text-primary md:border-t-0 md:border-l">
              LocalMap / LocalSync
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
              title: "AI-first",
              body: "We generate structured pages for LLMs — not just push to directories.",
            },
            {
              icon: WorkflowIcon,
              title: "Approve-first",
              body: "AI writes to drafts; humans approve before anything goes live.",
            },
            {
              icon: RadarIcon,
              title: "Honest rails",
              body: "No fake syndication. Every publisher is labeled API, guided, manual, or audit.",
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
