# Yext vs LocalMap / LocalSync — One-Pager for Don

**Purpose:** Show Don we’re building the same diagram he sent — with honest positioning on where we lead vs where Yext is ahead today.

**Audience:** Don / agency stakeholders  
**Date:** July 2026

---

## TL;DR

Don shared Yext Listings: Knowledge Graph → 200+ publishers → visibility scores → AI-ready structured data. **That is our architecture.** LocalSync is the **agency-native, AI-first, honest-rails** version — smaller publisher surface today, stronger on approve-first automation and LLM-native visibility pages.

---

## The diagram (same story)

```
Master profile (source of truth)
        ↓
   Sync / audit engine
        ↓
Google · Apple · Yelp · Bing · Facebook · AI assistants
        ↑
Visibility + optimization scores
```

| Layer | Yext name | LocalSync name |
|-------|-----------|----------------|
| Identity | Knowledge Graph | Master Business Profile + `location_versions` |
| Distribution | 200+ direct APIs | Publisher registry (~20), rails labeled honestly |
| Intelligence | Listings Verifier, scores | Firecrawl audits, evidence, visibility + review scores |
| AI | Structured for ChatGPT/Gemini | `/l/[id]`, schema.org, llms.txt, IndexNow |
| Automation | Enterprise workflows | Notice → recommend → **approve** → execute |

---

## Where LocalMap leads (say this confidently)

1. **AI-native visibility** — We don’t only push to directories; we publish machine-readable pages *for* LLMs.
2. **Approve-before-publish** — FAQs, review replies, profile suggestions never go live without human approval.
3. **Honest distribution** — Every publisher is API, guided import, manual, or audit-only. No pretend syndication.
4. **Agency model** — Clerk orgs → clients → locations from day one; built for LocalMap’s client base.
5. **Audit evidence + embeddings** — Seed of a per-location knowledge graph (Yext’s “Knowledge Graph” at SMB/agency scale).

---

## Where Yext is ahead (be honest)

| Yext | Us today | Our path |
|------|----------|----------|
| 200+ direct write APIs | ~20 tracked, GBP write pending quota | Add rails as APIs approve; never fake direct sync |
| Enterprise RBAC / 10k locations | Solo + agency MVP | Phase 3 agency mode + bulk import |
| Industry field schemas (menus, NPI, inventory) | Category packs: services + description | Vertical field tabs per pack |
| Publisher analytics (impressions, clicks) | Visibility + review scores | Sprint 5+ analytics layer |
| AI citation competitive intel | Crawler checks on our pages | Expand to competitor citation tracking |

---

## Category packs = Yext industry modules

When Yext shows **Restaurant → menus** or **Healthcare → NPI**, that’s a **vertical pack**. We now have **20 categories** including **Internet / SaaS** and **Marketing agency** so we can dogfood our own GBP case study.

**Today a pack preloads:** services, description, schema.org type, GBP category hint.  
**Next:** field schemas, publisher priorities, FAQ/review demo seeds per vertical.

---

## Demo talk track (2 min for Don)

1. **Homepage** — Publisher grid with real brand icons + honest rail badges; AI visibility mock (Google + AI answer).
2. **Onboarding** — Pick Internet/SaaS → profile preloads with product-style services.
3. **Connect → Google** — OAuth works; import when quota lands.
4. **Listings** — Audit Yelp/BBB vs master profile with evidence.
5. **Visibility** — Generate page, approve FAQs, publish `/l/[id]`.
6. **Reviews** — Demo reviews → AI draft reply → approve.

**Line for Don:** *“Same diagram as Yext — we’re just building the agency flywheel with honest rails and AI visibility built in, not bolted on.”*

---

## Related docs

- [demo-walkthrough.md](./demo-walkthrough.md) — Live demo script  
- [demo-for-don.md](./demo-for-don.md) — Pitch framing  
- [unified-vision-brief.md](./unified-vision-brief.md) — Full product vision
