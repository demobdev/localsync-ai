# LocalSync — Unified Vision Brief

For: collaborating agent/team proposing the "LocalMap OS / Local Intelligence Platform" direction.
From: the team that shipped LocalSync Sprint 1.
Status: Sprint 1 (Foundation, Identity, Master Profile) is **built, committed, and running** at `~/localsync-ai`.

## TL;DR

Your product vision is ~80% aligned with what is already designed and partially built. Your **tech-stack advice is behind where we are** — we already made (and shipped) better Vercel-native choices than the starters/BullMQ path you suggested. The genuinely new ideas worth merging are: **AI memory / entity knowledge graph, the CallRail learning loop, and bulk-importing the agency's existing client base with per-client scores.**

## What exists today (do not rebuild)

Live code, one commit, `npm run check` green, running on localhost:3002:

| Your pillar | Our implementation | Status |
|---|---|---|
| **1. Identity** | Master Business Profile: NAP, hours, holiday hours, services, attributes, photos (Vercel Blob), sameAs links. Immutable `location_versions` on every save with actor + source + field-level diff view. Clerk orgs → clients → locations (agency-ready from day one). | **Built** |
| **2. Distribution** | Publisher registry, 20 publishers seeded, each honestly typed `api / guided_import / manual / audit_only` with required-field definitions. Per-location publisher status. Manual-task tables. Home-services vertical pack (HVAC/plumbing/restoration/roofing/electrical taxonomy, 28 services). GBP write sync is Phase 2. | **Built (registry) / Planned (sync)** |
| **3. Intelligence** | Firecrawl audit engine (crawl listings, extract NAP via AI SDK + Zod, compare to master, store evidence with **pgvector embeddings**), visibility score, crawler checks of our own pages. | **Schema built, engine is Sprint 2** |
| **4. Automation** | Your "Notice → Recommend → Approve → Execute" is already our non-negotiable guardrail, verbatim: *AI only writes to suggestion/draft tables (`approval_requests`, review reply drafts, page drafts). Only user approval or the sync engine acting on an approved version mutates the master profile or pushes to a publisher.* | **Schema built, flows land Sprints 2–4** |

Also already in the plan: AI visibility engine (vertical schema.org types, FAQs, llms.txt, sitemap, IndexNow, crawlability checks) in Sprint 3; review ingestion + AI-drafted replies with one-click approve in Sprint 4; agency mode (white label, approval workflows, multi-client dashboards) in Phase 3.

## Where your notes are behind our decisions (please adopt ours)

Your "build on a SaaS starter + BullMQ + Redis + Prisma" advice was pre-empted — the master plan explicitly rejected that stack and Sprint 1 shipped the alternative:

- **Inngest** (durable, Vercel-native, step functions) instead of BullMQ/Redis — no worker service to operate.
- **Drizzle + Neon (pgvector)** instead of Prisma — already migrated, seeded, and serving the app.
- **Clerk organizations** already model agency → client → location. Roles and billing entitlements (`has()`) come with it.
- We effectively **built our own starter in Sprint 1** — auth, orgs, dashboard, schema, seeds, CI checks. Starting over on `ixartz/SaaS-Boilerplate` would be a net loss.
- Agreed on: GBP API first (access request is a day-1 action item, docs in `docs/gbp-api-request.md`), Firecrawl for audits, no scraper-repo foundations, honest rails instead of pretend syndication.

## What we're adopting from your notes (net-new, real value)

1. **Agency flywheel / LocalMap client import.** New backlog item: bulk import of existing agency clients (CSV + GBP OAuth), every client gets a workspace + scores on day one. This reshapes Phase 3 from "agency mode later" to "agency is the first customer." Biggest single change to sequencing.
2. **Entity knowledge graph / AI memory.** Our `audit_evidence` table already carries pgvector embeddings — that is the seed of the per-location knowledge graph. New concept: a `location_facts` layer (source-attributed facts about the business from website, reviews, calls, socials) feeding both audits and generated assets.
3. **Behavioral learning loop (CallRail etc.).** Genuinely differentiated: ingest transcripts → detect unlisted services/questions → create `approval_requests` suggesting profile/services/FAQ updates. Fits our existing guardrail perfectly (it's just a new *source* of suggestions). Phase 2.5–3 scope.
4. **Positioning language.** "Local Intelligence Platform" / "digital identity, not listings" is stronger than "listing management" and consistent with what we built (the master profile is already the canonical identity record, not a listings mirror).
5. **Per-client scorecards** (listing / review / website / AI visibility scores) — our Sprint 3 visibility score generalizes into this.

## Proposed unified roadmap (merge)

- **Sprint 2 (unchanged):** GBP OAuth import + diff/merge, Firecrawl audit engine v1, manual-task tracker.
- **Sprint 3 (unchanged + rename):** AI visibility engine + dashboard **scorecards** (adopt your multi-score framing). Onboard Tim's shop end-to-end.
- **Sprint 4 (unchanged):** GBP write sync + review ingestion + AI reply drafts.
- **Sprint 5 (modified):** Bing guided connector + duplicate detection + **agency bulk client import** (moved up from Phase 3 — this is the flywheel).
- **Sprint 6 (unchanged):** Billing with base plan vs vertical-pack upsell; aggregator export.
- **Phase 3 (expanded):** White label + approval workflows + **entity knowledge graph + CallRail/interaction learning loop** as the Intelligence pillar's second layer.

## Ground rules for collaborating in this repo

- Stack is settled: Next.js 16 / Drizzle / Neon / Clerk orgs / Inngest / shadcn / AI SDK via Gateway / Firecrawl. No Prisma, no Redis, no BullMQ, no separate worker service.
- The AI guardrail is non-negotiable: AI writes to suggestion tables only.
- Publisher honesty is a product feature: every rail is labeled truthfully.
- Every schema change goes through `db/schema.ts` + `npm run db:push`; seeds live in `db/seed/`.
