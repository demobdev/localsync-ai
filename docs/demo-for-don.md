# LocalMap Demo Guide (for Don)

**Local demo URL:** http://localhost:3002

**Production app:** https://app.localmap.co

**Chosen GBP / demo business:** Owner's Box

**What this is:** LocalMap OS — the local intelligence platform. LocalSync is the software engine; LocalMap is the agency + product brand.

---

## 30-second pitch

> LocalMap answers one question: *What does the internet know about your business?*  
> We unify identity (master profile), distribution (honest listing rails), intelligence (audits + AI visibility), and automation (recommend → approve → execute). The agency runs on it; the software sells standalone.

---

## Demo flow (5 minutes)

### 1. Landing page (`/`)

- Show **LocalMap** branding, teal palette, light/dark toggle (moon/sun, top right)
- Walk through **Four pillars**: Identity, Distribution, Intelligence, Automation
- Mention **agency flywheel**: import → audit → fix → AI assets → visibility → results

### 2. Sign in → Dashboard (`/dashboard`)

- **Command center** hero with quick actions
- Stat cards: clients, locations, publishers
- **Next actions** panel — the product lifecycle in plain language
- Toggle dark mode on mobile (hamburger menu top-left on phone)

### 3. Locations (`/dashboard/locations`)

- Use the Owner's Box location if it is available; otherwise prepare it only from verified business details
- Open location → **Master Business Profile** editor (NAP, hours, services, photos)

### 4. Listings & Audits (location → Listings tab)

- Add listing URLs per publisher
- Run audit → Firecrawl crawls, AI extracts NAP, compares to master profile
- View findings with severity + evidence

### 5. Google Import (`/dashboard/import/google`)

- Connect with the Google account that can manage Owner's Box, after verifying the current OAuth client and callback setup
- Show field-by-field diff/merge only after locations load successfully; do not assume approval alone proves a working import

---

## What’s built vs coming

| Shipped now | Next |
|-------------|------|
| Master profile + versioning | GBP write sync (requires implementation, verified configuration, and user-approved writes; Basic API Access is already approved) |
| Publisher registry (~20, honest rails) | Review monitoring + AI replies |
| Firecrawl listing audits | CallRail / CRM learning loop |
| AI visibility pages + scores + llms.txt | Agency bulk onboarding |
| Search Intelligence website audits | Cross-client search opportunity queue |
| FAQ drafts with approve-before-publish | IndexNow (set `INDEXNOW_KEY` in prod) |
| Google OAuth import scaffold | |
| Solo onboarding + smart routing | |

---

## GBP note (internal)

**Current business:** Owner's Box. Verify the signed-in Google account's owner/manager access and the actual profile before the demo. No Owner's Box pre-optimization baseline has been captured in these docs.

**API approval:** `localsync-501521` / project number `249394741886`, approved **2026-10-06**, case **`1-3775000042082`**, default **300 QPM**. This is separate from OAuth app verification, API enablement, and any quota increase. The live app/client names, deployed client's project association, registered redirects, and actual quotas remain unverified.

**Callbacks:** `http://localhost:3002/api/connectors/google/callback` for development and `https://app.localmap.co/api/connectors/google/callback` for production. A read-only Vercel check confirmed the production app base and protected Google credential entries, not the Google Console settings.

If a **429 / quota** error appears, explain that quota troubleshooting is still needed. It does **not** mean approval is pending or the user should reapply. Use the [current setup and troubleshooting guide](./gbp-api-request.md).

The [Gift a Story baseline](./gift-a-story-baseline.md) and July application are **historical**, for a different business and project. Do not present those measurements as Owner's Box results. Tim remains a future HVAC use case only.

---

## Scope boundaries

- **LocalMap** = agency + platform brand (this demo)
- **LocalSync** = the SaaS engine (repo name: `localsync-ai`)
- **Restore** = separate product, separate repo — do not mention in this pitch
- **Tim** = future design partner / HVAC use case — not involved yet

---

## Tech stack (if asked)

Next.js 16 · Drizzle + Neon · Clerk orgs · Inngest · Firecrawl · AI SDK · Vercel-native — no Redis/BullMQ, no fake syndication.
