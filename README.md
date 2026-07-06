# LocalSync AI

The AI-readable local presence platform for home services.

LocalSync AI is a standalone Vercel-native SaaS for HVAC, plumbing, restoration, roofing, and electrical businesses. Phase 1 delivers a control center: Clerk orgs, client/location structure, a versioned Master Business Profile editor, seeded home-services taxonomy, and an honest publisher registry.

## Stack

- Next.js 16, React 19, TypeScript
- Drizzle ORM + Neon Postgres (pgvector ready)
- Clerk organizations
- Inngest (job scaffold)
- shadcn/ui + Tailwind CSS v4
- Vercel Blob, PostHog, Resend, AI SDK (wired for later sprints)

## Setup

1. Copy env template:

```bash
cp .env.example .env.local
```

2. Create infrastructure (separate from Restore):

| Service | Notes |
|---------|-------|
| Neon | New database + enable pgvector |
| Clerk | New application with Organizations enabled |
| Vercel | New project linked to this repo |
| Vercel Blob | For photo uploads |

3. Install and push schema:

```bash
npm install
npm run db:push
npm run db:seed
```

4. Start dev server:

```bash
npm run dev
```

5. **Day 1 action:** submit the Google Business Profile API access request — see [docs/gbp-api-request.md](docs/gbp-api-request.md).

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Next.js dev server |
| `npm run db:push` | Push Drizzle schema to Neon |
| `npm run db:generate` | Generate migrations |
| `npm run db:studio` | Drizzle Studio |
| `npm run db:seed` | Seed taxonomy + publisher registry |
| `npm run check` | typecheck + test + lint |

## Sprint 1 scope

- Org → client → location hierarchy
- Master Business Profile editor (NAP, hours, services, attributes, photos, links)
- Immutable `location_versions` on every save + diff view
- Seeded home-services taxonomy and ~20 publisher registry entries
- Dashboard shell

## Sprint 2 scope

- Google OAuth import (read-only) with field merge
- Firecrawl listing audits + findings/evidence
- Manual task tracker
- Publisher registry UI

## Sprint 3 scope

- AI visibility tab per location (score, schema.org JSON-LD, llms.txt)
- Hosted public pages at `/l/[locationId]` and `/l/[locationId]/llms.txt`
- Crawler checks (JSON-LD + optional Firecrawl validation)
- Dashboard visibility scorecards

## Sprint 4 scope

- Review inbox per location (ingest, score, response rate)
- Demo review seed for walkthroughs without GBP quota
- Google review sync when location is linked via GBP import
- AI-drafted reply suggestions with approve-before-save guardrail
- Dashboard review metrics and setup checklist steps

## Out of scope (Phase 2+)

GBP write sync (auto-post approved replies), Yelp review API, billing, agency white-label.

## Reference only

Restore 2.0 informed HVAC service naming and Tim's shop is the design partner — **no code or infra is shared**.
