# LocalMap Demo Walkthrough

**Local demo URL:** http://localhost:3002

**Production app:** https://app.localmap.co

**Chosen GBP / demo business:** Owner's Box

**Audience:** Don / agency stakeholders  
**Duration:** ~8 minutes

---

## Before you start

1. Run `npm run dev` (port **3002**) with `NEXT_PUBLIC_APP_URL=http://localhost:3002`.
2. Sign in with a Clerk test user that has an org (or let onboarding create one).
3. Optional: delete duplicate test locations from **Locations** (trash icon).
4. Use verified Owner's Box business details. Its pre-optimization baseline and successful Google import are not yet established by these docs; Gift a Story data is historical.
5. Before a live Google demo, check the [OAuth / API verification checklist](./gbp-api-request.md). Expected callbacks are `http://localhost:3002/api/connectors/google/callback` and `https://app.localmap.co/api/connectors/google/callback`; Google Console registration still needs verification.

---

## Act 1 — First-time setup (solo operator)

| Step | Where | What to say |
|------|--------|-------------|
| 1 | `/` | LocalMap = agency + product; LocalSync = engine. Four pillars on the page. |
| 2 | Sign in | No org picker noise for solo users — workspace is automatic. |
| 3 | `/dashboard/onboarding` | One form: business name, city, category, phone. ~1 minute. |
| 4 | Success screen | **20 publishers** auto-tracked; workspace health starts low until profile fills out. |
| 5 | `/dashboard` | Stat cards are clickable. Explain **market audit** (grader) vs **workspace health** vs listing consistency. |

**If user already has a business:** onboarding redirects to dashboard automatically. Add more via **Locations → Add another business**.

---

## Act 2 — Master profile & audits

| Step | Where | What to show |
|------|--------|--------------|
| 1 | Location → **Profile** | NAP, hours, services, photos. Every save = version history. |
| 2 | Location → **Listings** | Paste Yelp/BBB URLs, run audit. Firecrawl + AI extraction vs master. |
| 3 | Findings | Critical / warning / info — evidence-backed, not black-box scores. |

---

## Act 3 — AI visibility (Sprint 3)

| Step | Where | What to show |
|------|--------|--------------|
| 1 | Location → **Visibility** | Score breakdown (profile 50 + audits 50). |
| 2 | **FAQ drafts** | Generate → review → **Approve all**. Guardrail: AI never writes live profile without approval. |
| 3 | **Generate page** | Schema.org JSON-LD, hosted HTML at `/l/[id]`. |
| 4 | **Publish** | Public page + `llms.txt`. IndexNow ping when `INDEXNOW_KEY` is set. |
| 5 | **Crawler check** | Validates the published page is reachable. |
| 6 | Open `/l/[id]` in new tab | Show structured data + FAQ section after approval. |

---

## Act 4 — Google import (verify the live connection)

| Step | Where | What to say |
|------|--------|-------------|
| 1 | `/dashboard/import/google` | Owner's Box is the chosen business. Connect with an authorized Google account; do not claim OAuth or import works until tested. |
| 2 | After connect | Basic API Access is **approved** for `localsync-501521` / `249394741886`, case `1-3775000042082`, dated **2026-10-06**, default **300 QPM**. If locations load, show the actual Owner's Box listing and review the field diff. |
| 3 | If a quota error occurs | A **429 / quota** response is not proof of missing approval. Check the deployed OAuth client's project, the failing API's effective quota / usage, and error details; do not reapply automatically. OAuth verification and API enablement remain separate. See [setup and troubleshooting](./gbp-api-request.md). |

---

## Numbers cheat sheet

| Dashboard number | Meaning |
|------------------|---------|
| **Market audit** | Grader score — external rankings, site, GBP signals (0–100). |
| **Workspace health** | In-app profile completeness + listing consistency (0–100). |
| **Listing consistency** | Listing audit half of workspace health (0–50 until first audit). |
| **Businesses** | Location count in workspace. |
| **Publishers tracked** | ~20 seeded directories linked per location. |

---

## Scope reminders

- **LocalMap** = brand + agency demo  
- **LocalSync** = this repo / engine  
- **Owner's Box** = chosen GBP / demo business; use verified details only
- **Gift a Story** = historical business and baseline, not current demo data
- **Restore / Tim** = separate; not the live GBP demo

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Blank form after onboarding submit | Fixed — success uses URL params; refresh should show dashboard. |
| Duplicate locations | Delete from Locations list. |
| Org switcher visible | Hidden when user has only one org. |
| FAQ generate fails | Needs AI gateway / model env (same as audits). |

See also: [demo-for-don.md](./demo-for-don.md) for pitch framing and GBP setup notes.
