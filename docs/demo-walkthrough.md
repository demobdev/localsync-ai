# LocalMap Demo Walkthrough

**URL:** http://localhost:3002  
**Audience:** Don / agency stakeholders  
**Duration:** ~8 minutes

---

## Before you start

1. Run `npm run dev` (port **3002**).
2. Sign in with a Clerk test user that has an org (or let onboarding create one).
3. Optional: delete duplicate test locations from **Locations** (trash icon).

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

## Act 4 — Google import (expect quota message)

| Step | Where | What to say |
|------|--------|-------------|
| 1 | `/dashboard/import/google` | OAuth works today. |
| 2 | After connect | If **429 / quota**: Basic API Access submitted (Gift a Story, case `0-0182000041521`, project `684836579110`). Import lists locations once Google approves (check Quotas for 300 QPM). See [gift-a-story-baseline.md](./gift-a-story-baseline.md). |

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
- **Restore / Tim** = separate — use generic HVAC examples only  

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Blank form after onboarding submit | Fixed — success uses URL params; refresh should show dashboard. |
| Duplicate locations | Delete from Locations list. |
| Org switcher visible | Hidden when user has only one org. |
| FAQ generate fails | Needs AI gateway / model env (same as audits). |

See also: [demo-for-don.md](./demo-for-don.md) for pitch framing and GBP setup notes.
