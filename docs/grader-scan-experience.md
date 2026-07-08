# LocalSync Grader — Scan Experience Creative Brief (v2)

**Audience:** Creative/design agent building the scan-loading experience
**Product:** LocalSync Grader — "Local Visibility & Revenue Leak Audit" at `/grader`
**Reference:** Owner.com's grader scan sequence — we match the *pattern and emotional arc*, then surpass it
**Date:** July 2026 · v2 (creative direction merged)

---

## 0. Creative direction — the one-paragraph version

What Owner sells during those 30–45 seconds isn't "loading." **It's confidence.** Every animation answers the subconscious question: *"Are they actually analyzing MY business?"* Every scene is evidence. LocalSync goes one step further: **Owner shows evidence — we show reasoning.** The user isn't watching a scanner; they're watching an AI consultant think. Treat the scan as a documentary of an AI employee doing real work. By the time the report appears, they should already believe it.

**Core principles:**

1. **Never fake it.** No spinners. No 45-second skeletons. Every 2–3 seconds something REAL appears — their photo, their reviews, their homepage, their competitors.
2. **Reasoning over evidence.** Not "Found 23 reviews" → "Reading 23 customer reviews… AI identified recurring themes… *'Customers consistently praise food quality but frequently mention slow service during peak hours.'*"
3. **Expose the pipeline.** Name the engines: Google Business Profile → Connected. Firecrawl → Website captured. Gemini → Extracting services. Google PageSpeed → Running tests. LocalSync AI → Generating recommendations. Naming real infrastructure makes the product feel technically expensive.
4. **The animation is just the visualization of work actually happening.** Progress maps to real pipeline events — non-linear (12% → 28% → 31% → 59% → 61% → 88% → 100%), because real scans aren't linear and authentic jitter reads as honesty.
5. **Branding like Cursor:** "LocalSync Intelligence" top center. Small. Subtle. Don't hide it, don't shout it.

---

## 1. What this funnel is

The Grader is our top-of-funnel lead magnet. A business owner types their business name (Google Places autocomplete) or pastes their website URL. We run a ~30–60 second audit pipeline, then show a full diagnostic report (score ring, revenue-leak estimate, competitor rankings, 44 checks) blurred behind a 2-step lead-capture modal. After unlock, CTAs push them into sign-up → onboarding, where the audit follows them (prefill + claim).

```
/grader (search) → SCAN EXPERIENCE (this brief) → /grader/[auditId] report
  → report ASSEMBLES ITSELF on screen → blur → unlock modal (name/email → relationship)
  → full report → "Fix with LocalSync" → /sign-up?audit=… → onboarding (prefilled, claimed)
```

The scan is the make-or-break moment: the user just handed us their business identity and is deciding whether this is a real analysis or a gimmick.

---

## 2. What Owner.com does (observed) — and where we beat them

Layout: **left rail checklist + center evidence stage**, full-screen takeover, warm off-white background.

- Left rail: "Scanning…" header, 6 checklist items (done ✓ / active spinner / pending dim), progress bar, "27 seconds remaining" countdown.
- Center stage scenes (crossfade, one at a time): typewriter map search with competitor pins → business identity card with leaked warnings ("⚠ No description found") → real reviews scrolling → GBP photo collage → desktop homepage in browser chrome → mobile frame scrolling.
- A green scan-line sweeps across scenes — the "being scanned" flourish.
- Hard cut to report: score ring counts up, report blurred behind unlock modal.

**Their psychological wins we keep:** real data live, countdown, early leaked warnings, the blur ("the report already exists").

**Where we surpass:**

| Owner | LocalSync |
|---|---|
| Shows evidence | Shows **reasoning** (AI narration of findings) |
| Hard cuts between scenes | **Morph transitions** — map morphs into card, card into browser, browser into phone, phone into chart (Apple-keynote feel) |
| Generic step labels | **Named pipeline engines** (Firecrawl, Gemini, PageSpeed, LocalSync AI) |
| Linear-ish progress | **Event-driven non-linear progress** |
| Cut to finished report | **Report assembles itself** on screen, then blurs — watching it finish makes the blur hurt more |

---

## 3. Our data timeline (what's actually available, when)

Pipeline (`app/actions/grader.ts`): audit row created instantly; processing continues server-side; the client polls a status endpoint (~1.5s) that streams stage + evidence.

| Stage | Real data available for evidence | Approx timing |
|---|---|---|
| 0. Place selected (instant) | Name, address, phone, rating, review count, category, lat/lng, **up to 6 GBP photos, up to 5 reviews** (fetched client-side at selection) | 0s |
| 1. Website crawl (Firecrawl) | Homepage screenshot, final URL, page title | ~5–15s |
| 2. PageSpeed (parallel) | LCP/FCP/CLS metrics | ~10–30s |
| 3. AI extraction (Gemini) | Services, hours, description, industry, visibility judgments, **early warnings** | ~5–10s after crawl |
| 4. Keywords + competitors | 5–6 local keywords, competitor names/ratings/pins | fast |
| 5. Scoring | Final score, grade, category scores, $ leak estimate | fast |

**No-website mode:** stages 1–3 skip; lean on place/map/reviews scenes. **URL-only mode** (no Places selection): no photos/reviews/rating — scenes degrade per §5. Both are first-class variants, not error states.

---

## 4. The scan experience — "LocalSync Intelligence" storyboard

Persistent chrome:
- **Top center:** "LocalSync Intelligence" wordmark, small and quiet.
- **Left rail (the pipeline, exposed):** engine rows, each with name + live status line + state icon:

```
Google Business Profile   Connected ✓
Firecrawl                 Capturing website…  ⟳
Gemini                    Waiting
Google PageSpeed          Waiting
LocalSync AI              Waiting
Scoring engine            Waiting
```

- Bottom of rail: glowing progress bar driven by real events (non-linear jumps), countdown "~40 seconds remaining" (clamps to "Almost done…", never hits 0 while running).
- **Scan reveal:** soft emerald **gradient veil** that sweeps downward; as it passes, new information fades in beneath it — "reality being revealed." Not a hard laser line.

### The seven scenes (center workspace — one continuous space that transforms, not slides)

**Scene 1 — Map: business found.** Light map fills the stage. Search pill types `"{Business Name} in {City}"` (typewriter + blinking cursor). Their pin drops with a small spring. Competitor pins drop after, each with a "Competitor" chip.

**Scene 2 — Google Business Profile assembles.** The map **morphs** into an identity card. Fields materialize one at a time, each with a micro-spring: photo → name → star rating counting up → category chip → hours → phone → description. Missing fields tick in as warnings with a soft pulse: "⚠ No description found."

**Scene 3 — Review intelligence.** Review cards slide upward like a feed. Key phrases highlight inline as they pass ("amazing food", "friendly staff", "slow service", "parking"). Then the cards **regroup into AI theme rows**:

```
Atmosphere  ★★★★★
Food        ★★★★★
Service     ★★★★☆
Parking     ★★★☆☆
```

Narration line (typewriter): *"Customers consistently praise food quality but frequently mention slow service during peak hours."*

**Scene 4 — Website inspection.** Card morphs into a browser-chrome frame with their real homepage screenshot, panning slowly. Inspection boxes draw themselves over regions with pass/fail tags popping in: Phone found ✓ · Address found ✓ · CTA found ✓ · SSL ✓ · Schema ✗ · Meta description ✓ · OpenGraph ✗. Narration: *"AI detected missing LocalBusiness schema."*

**Scene 5 — Mobile + speed.** Desktop frame collapses/morphs into a phone frame; the page scrolls inside it. Lighthouse-style gauges animate in beside it (LCP, CLS, TTFB) with pass/warn colors.

**Scene 6 — Competitor comparison.** Phone morphs back out to the map, which zooms out; pins reanimate as a ranked stack — You ↓ Competitor ↓ Competitor ↓ Competitor — then summary stats count in: Average rating · Average reviews · Distance · Visibility. Benchmark narration: *"Only 11 photos found. Top competitors average 43."*

**Scene 7 — AI summary (the consultant thinks).** Stage quiets to a document card. Text streams in ChatGPT-style:

```
Analyzing findings…
We found several opportunities.
Missing business description.
Only 18 photos.
Website loads slower than competitors.
Calculating revenue impact…
```

### The reveal (Owner's biggest missed opportunity)

No hard cut. The workspace background fades; **the report assembles itself**: cards slide upward into place, charts draw, the score ring counts 0→N (`@number-flow/react`). The user watches the finished report exist for ~1.5s — *then* the blur rolls over it and the unlock modal rises. Now the blur hurts. That's the point.

### Micro-interaction language

Checkmarks: tiny spring. Photos: drop into place. Reviews: slide upward. Warnings: single soft pulse. Progress updates: brief glow. Nothing flashy — everything deliberate. Scene dwell: min ~2.5s, hold with subtle shimmer if the next stage's data is late; skip silently if data is absent.

---

## 5. Degraded variants (first-class, not error states)

| Variant | What changes |
|---|---|
| **URL-only** (no Places selection) | No photos/reviews/rating. Scene 1 keeps the map only if we geocode from crawl; otherwise open on Scene 4 with a domain identity card ("Scanning ownersboxgvl.com"). Scenes 2–3 are skipped; rail rows for GBP show "Limited — profile not connected" (soft, not alarming). |
| **No-website** (Places pick without a site) | Scenes 4–5 replaced with a single card: "No website found — the single biggest local visibility leak." Red, direct. |
| **Reduced motion** | Instant cuts instead of morphs, no marquee/scan veil/typewriter (text renders complete), checklist still ticks. |
| **Mobile** | Rail collapses to a slim top bar (current engine + progress); stage goes full-width; scenes identical. |

---

## 6. Style tokens (ours, not Owner's)

| Token | Value |
|---|---|
| Stage background | `#faf7ef` cream (grader pages) — NOT the marketing mesh |
| Cards | `rounded-3xl bg-white/90 border border-black/5 shadow-sm` |
| Primary / progress / checks | emerald-500/600 |
| Scan veil | soft emerald gradient, `mix-blend-mode: screen`, low opacity |
| Warnings | red-500 fails, amber-500 warnings |
| Text | zinc-900 headings, zinc-500 secondary |
| Score ring | emerald (Good/Excellent), amber (Fair), red (Poor) |
| Pins | numbered red/zinc competitor pins, emerald "You" pin (match `MapPackComparisonCard`) |
| Wordmark | "LocalSync Intelligence", top center, small |

Voice: confident, direct, second person. "Checking who outranks you," not "Fetching SERP data." Narration lines are written by the AI pipeline (see §7) — the design must accommodate variable-length streamed text.

---

## 7. Motion + library stack (decided)

- **`motion` (Framer Motion)** — all scene transitions, morphs (layout animations / `layoutId` for map→card→browser→phone continuity), staggered reveals, pin drops, card springs.
- **`@number-flow/react`** — score rings, percentages, counters.
- **Google Maps Static API** for map imagery + a lightweight absolutely-positioned overlay layer for animated pins (no live interactive map during loading).
- **Browser/phone mockups:** pure CSS frames with clipped screenshots and subtle parallax. No SVG-heavy device libraries.
- **Charts:** reuse the report's existing chart components with entry animations.
- **CSS keyframes** for: scan veil sweep, shimmer, glowing progress, floating photos, scrolling reviews, blinking cursor, typewriter.
- **No GSAP. No Lottie. No Three.js. No particles.** The user is already waiting on network-bound work (Firecrawl, GBP, Gemini, PageSpeed) — the experience must stay lightweight and route-level code-split so the marketing bundle is untouched. Everything above is achievable with `motion` + CSS; GSAP would add bundle weight and licensing surface for zero capability we need. (If a specific morph proves impossible in `motion`, escalate before reaching for GSAP.)

Accessibility: honor `prefers-reduced-motion` per §5.

---

## 8. Engineering contract (what the scan UI consumes)

```ts
// GET /api/grader/status/[auditId] — poll ~1.5s
type GraderProgress = {
  status: "scanning" | "complete" | "failed";
  stage: "place" | "crawl" | "extract" | "keywords" | "scoring" | "done";
  stagesDone: string[];
  startedAt: number;              // for the countdown heuristic
  evidence: {
    place?: {
      name: string; rating: number | null; reviewCount: number | null;
      address: string | null; category: string | null;
      lat: number | null; lng: number | null;
      photoUrls: string[];        // 0–6 real GBP photos
      reviews: Array<{ author: string; rating: number; text: string; when: string }>;
    };
    screenshotUrl?: string;       // Firecrawl homepage screenshot
    services?: string[];          // Gemini extraction
    warnings?: string[];          // early findings ("No description found")
    competitors?: Array<{ name: string; rating: number; lat: number; lng: number }>;
    pageSpeed?: { lcp?: string; cls?: string; status: "pass" | "fail" | "unknown" };
    // v2 additions (reasoning layer — backend follow-up):
    reviewThemes?: Array<{ theme: string; rating: number }>;   // Scene 3 grouping
    narration?: string[];          // streamed consultant lines (Scenes 3/4/6/7)
    photoBenchmark?: { yours: number; competitorAvg: number }; // Scene 6 line
  };
};
```

Notes for the creative agent (from the shipped backend):
- Poll-driven, not websockets — design tolerates 1.5s granularity; use dwell-time minimums so scenes don't flash.
- **Fast sites finish in 8–15s.** Scene pacing needs minimum dwell times or the finale arrives before Scenes 3–6 play. `stagesDone` is the truth; never assume 45s.
- Scenes must tolerate any evidence field being absent forever (skip) or arriving late (hold + shimmer).
- `competitors[].lat/lng` are **nullable** (URL-only audits have no anchor coordinates) — the map scene must tolerate null pins.
- `evidence.warnings` arrive at the `extract` stage for website audits, but immediately at insert for no-website audits.
- The final checklist item completes on `status: "complete"`, not on a 6th stage event.
- Screenshot URLs are full-page captures (tall) — crop with `object-top` or pan.
- `startedAt` is an ISO string — countdown anchor.
- The `narration`, `reviewThemes`, and `photoBenchmark` fields are the reasoning-layer follow-up; design Scenes 3/7 to degrade to the evidence-only version when they're empty.
- The scan lives at `/grader/[auditId]` while `status === "scanning"` — refresh-safe, shareable; the same URL becomes the report.

---

## 9. Deliverables requested from the creative agent

1. High-fidelity motion spec (or coded prototype) for the 7 scenes + pipeline rail on our tokens, including the morph continuity map (which element carries between scenes via `layoutId`)
2. Scene timing map: min/max dwell, late-data hold behavior, skip rules
3. The report self-assembly reveal (assemble → 1.5s beauty pause → blur roll → modal rise → score count-up)
4. Reduced-motion variant
5. Mobile layout
---

## 10. Operating models (multi-niche vs Owner)

Owner assumes **brick-and-mortar + GBP**. LocalSync supports multiple paths:

| Model | GBP required? | Audit tier | What we score |
|---|---|---|---|
| **Storefront / office** | Yes | `full_local` | Map pack, listings, reviews, website — Owner-equivalent |
| **Truck / pop-up / mobile** | No (preferred) | `full_local` or `website_local` | Website + local keywords + real competitors; listings section = gap analysis |
| **Home-based / service area** | No (preferred) | same | Same; encourage service-area GBP |
| **Mostly online, local buyers** | No | `website_local` | Website, SEO, social/directory footprint |

**UI:** user picks model first → search gate adapts → report shows `AuditScopeBanner` when tier is `website_local`.

**Rule:** never fake GBP data. If no listing, label the report honestly and weight guest/search sections; listings checks become “create/claim profile” recommendations.

**Stored on** `grader_audits.progress`: `operatingModel`, `auditTier`.

**Routing moat (active phase):** see [`docs/phase-operating-model-routing.md`](./phase-operating-model-routing.md) — model persists on location profile after claim and drives onboarding, setup guide, and fix CTAs.
