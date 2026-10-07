# Product funnels — audit → packages

**Purpose:** Map every grader finding and product surface to a conversion path for LocalMap packages (Basic / Premium / Pro listings, verticals, AI Citation, agency).

**Related:** [pricing-and-offerings.md](./pricing-and-offerings.md), [phase-cyclical-funnel.md](./phase-cyclical-funnel.md), [yext-product-funnels.md](./yext-product-funnels.md)

**Principle:** The audit is the hook. The report is the menu. Do not re-run acquisition gates (name/email/relationship) for signed-in org members adding location #2+.

**Automation workflow:** See [listings-automation-workflow.md](./listings-automation-workflow.md). The grader feeds profile discovery into one Fix Queue action rather than treating lookup failures or missing profiles as dead ends.

---

## Two audiences, two gates

| Audience | Unlock / lead gate | Primary CTA |
|----------|--------------------|-------------|
| Anonymous visitor | Step 1–2 (name, email, relationship) | Sign up → claim |
| Signed-in org (any location count) | **Skip** — report unlocked | **Add to workspace** / Continue fixing |

Relationship (`owner` | `provider` | `other`) is optional metadata when attaching a location, not a blocking modal. SMS opt-in is not live (no Twilio); prefer email via Resend when alerts ship.

---

## Finding → SKU doors

| Audit signal | Product door | Notes without full GBP write |
|--------------|--------------|------------------------------|
| Hours / phone / fields thin | Premium Listings + GBP connect | Guided fix + monitor |
| Weak directory footprint | Basic → Premium ladder | Coverage grid on Local Listings |
| Category = restaurant / HVAC / etc. | Vertical +$15 | Industry publisher row |
| Review themes, no reply workflow | Pro (Reputation included) | AI drafts, approve-first |
| Website live, AI invisible | AI Citation Network +$20 | `/l/[id]`, schema, llms.txt |
| Agency adding client location | Agency workspace + per-location | Owner vs client on attach |
| Competitor outranks on hours/NAP | Premium + re-grade loop | Jealousy CTA |

---

## Funnel rails (how people see LocalMap)

1. **Public hunter** — `/grader` → unlock → coverage tease → signup.
2. **Signed-in expander** — skip unlock → full report → Add to workspace → claim/create location → fix queue.
3. **Listings sweetener** — Local Listings section shows majors found vs missing → sticky Premium CTA with Yext price anchor.
4. **Check → task → upgrade** — each red/yellow check becomes a dashboard task tagged free / Premium / vertical / AI.
5. **Competitor jealousy** — name competitors + one missing field → Fix with LocalMap.
6. **Score postcard** — Resend digest (org + agency rollup). SMS later only with phone + Twilio.
7. **Agency handoff** — `provider` locations get “Invite owner to take over.”
8. **Product pages** — `/products/*` end in Run free audit; findings deep-link back to SKUs.

---

## Cyclical loop (must stay closed)

```
Grader → Report (unlocked if signed in) → Add/claim → MBP + listing tasks
  → Re-grade → higher score → upsell next SKU if gaps remain
```

Broken if post-claim ignores audit checks. Fixed when claim spawns fix queue from `grader_audits.checks`.

---

## Ship order (funnels first)

1. Signed-in auto-unlock + Add to workspace CTAs
2. Optional owner vs client on attach (no clutter)
3. Listings coverage ladder + Premium CTA in Local Listings
4. Email score alerts (Resend)
5. Product-page ↔ audit deep links

GBP API quota pending does not block 1–4: diagnose, guide, monitor, re-grade.
