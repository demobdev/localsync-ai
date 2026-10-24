# LocalSync Product Program Phases

This is the umbrella sequence for the public site, customer workspace, human operations, agent experience, publisher rails, billing, and launch. It complements [the automated listings roadmap](automated-listings-production-roadmap.md), which remains the detailed source for listing distribution and verification gates.

## Product contract

LocalSync helps a business understand what is out of sync, approve a canonical profile, and move each supported listing through the most reliable available path. The front end may feel coordinated and intelligent; the back end must still disclose whether a step is automated, owner-led, manually handled by LocalMap, audit-only, pending, or verified. The agent can organize work and prepare actions, but humans and explicit permissions control consequential external changes.

## Phases

### 0. Product boundaries and environment map

**Goal:** distinguish the LocalMap legacy dashboard, LocalSync product, marketing site, and internal operations surfaces.

- Assign a canonical purpose and route/domain to each surface.
- Confirm local, Preview, and Production hosts use the intended app, Clerk instance, database, and billing mode.
- Keep internal tools staff-only; do not route customers into the legacy dashboard when they intend to use LocalSync.
- Maintain one sitemap and redirect map for the customer-facing product.

**Status:** In progress. The local and production surfaces have been inspected, but deployment and route ownership still need a final verified map.
**Exit gate:** every public link and sign-in redirect lands in the intended product, and no feature is silently split across the legacy and new dashboards.

### 1. Positioning, offer, and truthful marketing

**Goal:** make the offer understandable before expanding the product surface.

- State who LocalSync serves, the outcome it provides, and which work is done by software versus by an owner or LocalMap operator.
- Finalize the workspace/location packaging, entitlements, add-ons, and agency volume rules against actual cost and capability.
- Redesign the home, pricing, product, publisher-network, and comparison pages using useful patterns from BrightLocal, Synup, Yext, and OpenAI Ads without copying their proprietary execution.
- Use scrollytelling or animated product demonstrations only when they explain a real approved-profile-to-outcome workflow.
- Keep competitor matrices evidence-based and time-stamped; avoid unsupported superiority or integration claims.

**Status:** In progress. Pricing direction and visual references exist; the final offer-to-entitlement mapping and complete page system remain open.
**Exit gate:** every claim on the site maps to a shipped feature, a clearly labelled guided service, or an explicitly future/planned capability.

### 2. Customer entry and canonical business setup

**Goal:** get a business from discovery to one approved source of truth without losing context.

- Support business discovery and a complete manual fallback.
- Preserve selected business, source evidence, and scan context through sign-in and onboarding.
- Create or link the correct workspace and location, then review and approve a versioned Master Profile.
- Explain duplicate, ownership, verification, and permissions issues before any external action.

**Status:** Implemented in parts; full regression across new and existing workspaces remains part of dogfood.
**Exit gate:** both discovered and manually entered businesses reach the same reviewable profile with all entered evidence intact.

### 3. Listings workspace and truthful lifecycle

**Goal:** turn the approved profile into a clear per-publisher work plan.

- Show coverage, eligibility, source version, owner action, LocalMap action, and audit-only destinations separately.
- Support durable routing, resumable owner tasks, retries, event history, and independent public readback.
- Distinguish prepared, waiting for owner, submitted, pending, rejected, verification required, verified, and drifted states.
- Never infer “live” from a prepared payload, click, or provider receipt alone.

**Status:** Core workflow and persistence are implemented; external write coverage is intentionally constrained.
**Exit gate:** statuses survive refresh and retries, each change has evidence, and no unsupported publisher is represented as automatically connected.

### 4. Internal fulfillment and operating procedures

**Goal:** let LocalMap staff coordinate manual rails safely while preserving the same customer-visible truth.

- Keep the internal queue isolated from customer navigation and gated by a server-side staff claim.
- Establish per-publisher operating records: official path, eligibility, authorization, required inputs, receipt, exceptions, timing, verification, cost, and source review date.
- Record assignment and handoff events without storing credentials or sensitive evidence in free-text notes.
- Add an approved receipt/evidence path and a distinct transition into the existing submission and verification lifecycle before handling real work.

**Status:** QA queue is deployed to an isolated Preview; claim/wait/resume works on one synthetic case. A fixture control is now gated to the exact QA Preview branch, database name, and Neon endpoint; it can stage two idempotent, synthetic manual cases without submitting, contacting owners, uploading receipts, or marking listings live. The operator runbook has been added.
**Exit gate:** a three-scenario synthetic dogfood, documented publisher rails, and separately reviewed receipt-to-verification handoff all pass; production customer records remain excluded until approval.

### 5. Agent-native customer experience

**Goal:** make an assistant useful on the front end while keeping LocalSync's operational rails authoritative.

- Start with contextual chat that can summarize a location, compare evidence, explain a status, and draft a proposed fix.
- Add scoped memory for approved brand preferences and prior decisions, with visibility, edit/delete controls, and clear provenance.
- Add single-action skills first; then playbooks that chain only supported, permissioned steps.
- Route consequential changes through approval and retain an audit trail of request, proposal, approver, execution, and readback.
- Keep MCP/CLI as optional interfaces to the same permission and audit layer, not privileged bypasses.

**Status:** Product direction and Synup references are captured; a customer-facing agent, durable memory, and playbooks are not yet a released workflow.
**Exit gate:** draft-only agent tasks are useful on synthetic data, memory is tenant-scoped and editable, approvals are enforced server-side, and unsupported actions fail closed.

### 6. Publisher rails and partner access

**Goal:** expand from prepared/manual workflows to dependable integrations without overstating coverage.

- Publish a country/category-specific catalog of API/distributor, owner-guided, LocalMap-manual, audit-only, and unavailable rails.
- Document and review each rail's official requirements and signed terms.
- Integrate one writable distributor in a sandbox with receipts, idempotency, webhooks, reconciliation, cancellation, and a kill switch.
- Add direct publisher APIs only when approved and more reliable or economical; preserve a guided fallback.
- Keep Google writes dormant until the required API access and quota are approved.

**Status:** Adapter architecture and readiness research exist; no general live write authority should be inferred.
**Exit gate:** a sandbox receipt, downstream state transition, replay, cancellation, and independent readback pass before any allowlisted live pilot.

### 7. Billing, plans, and workspace entitlements

**Goal:** charge the right workspace for only the capabilities it can actually use.

- Map plan quantities and add-ons to workspace/location entitlements in one source of truth.
- Verify checkout, success/cancel redirects, subscription webhooks, renewals, failed payment, upgrade/downgrade, cancellation, and access changes.
- Keep Stripe Connect/payout onboarding separate from LocalSync subscription billing unless the business explicitly needs it.
- Verify Production database migrations, Clerk Production configuration, and the correct live billing plan before changing Production behavior.

**Status:** Checkout and plan work have been exercised in non-production; Production migration, live plan, and tax/business identity gates require explicit verification.
**Exit gate:** no test configuration points at Production, no paid feature is exposed without an entitlement, and payment state reconciles from signed events.

### 8. Synthetic dogfood, security, and release rehearsal

**Goal:** prove cross-surface behavior without customers or unintended publisher activity.

- Use isolated Development/Preview identity and database, synthetic businesses, and no external publisher calls.
- Test one clean match, one partial match, and one manual intake from setup through approval, routing, owner/staff action, readback, retry, drift, and offboarding.
- Test role boundaries, stale revisions, duplicate clicks, sign-in redirects, refresh/session persistence, worker restart, and rollback.
- Add operational dashboards, alerts, support explanations, retention, privacy, and incident procedures.

**Status:** isolated staff-queue slice has passed 484 focused listings/fulfillment tests and one persisted synthetic queue case. Hosted Preview UI checks also passed for sample approval feedback, local-only chat, scoped temporary memory, and a simulated setup playbook; page state was reset afterward and the persisted queue remained unchanged. No AI or publisher calls were made. A fail-closed, idempotent Preview fixture control is implemented and covered by guard/page tests, but has not yet been exercised against hosted Preview. Clean-match, partial-match, and manual-intake remain distinct workflow gates; no Production/customer data or publisher calls are in scope.
**Exit gate:** all scenarios survive refresh and retries with zero external side effects and zero false-live outcomes.

### 9. Closed production beta

**Goal:** learn with the smallest authorized live cohort after all previous gates pass.

- Enable one approved rail for LocalMap's own authorized business first, then a small invited cohort with written permission.
- Verify every destination independently, alert on stuck work, cap retries/spend, and rehearse pause/offboarding.
- Measure time-to-verified, owner minutes, exceptions, cost, support burden, and gross margin.

**Status:** Not ready. Production database, live billing, provider authority, evidence handling, and dogfood gates remain.
**Exit gate:** predefined success and rollback metrics pass with zero false-live results and support can explain every attempt.

### 10. General availability and expansion

**Goal:** scale the service only after reliability, support, and economics are demonstrated.

- Load-test agency batches, webhooks, reconciliation, scheduled verification, and tenant isolation.
- Publish supported coverage, SLAs, privacy/data-retention controls, support routes, and truthful comparison pages.
- Expand publisher coverage and agent skills based on measured customer demand and contracted support.
- Reassess the competitor matrix regularly and update only evidence-backed positioning.

**Status:** Future.
**Exit gate:** written SLOs hold for the agreed observation period, recovery drills pass, margins meet plan thresholds, and all public claims remain verifiable.

## Immediate next actions

1. Keep using the canonical Preview deployment, not its failing branch alias, for the staff queue.
2. Exercise the guarded QA fixture control on Preview, then extend the matrix to the clean-match, partial-match, and manual-intake scenarios with mocked or disabled providers.
3. Build the publisher rail records from primary documentation and partner responses, starting with the publishers LocalMap has actually contacted.
4. Define and review the receipt/evidence handoff before adding any staff submission or completion control.
5. Finish Production database, Clerk, and live billing verification before promotion; keep billing and publisher writes disabled until their gates pass.
6. Once the backend gates are stable, move to the Synup-inspired customer workspace/agent MVP and the coordinated public-site redesign.
