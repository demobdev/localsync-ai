# Listings rail control — implementation design

**Status:** accepted for implementation on `codex/dons-automated-listings-ux`

## Outcome

LocalSync owns the Master Profile, approval workflow, orchestration, evidence,
monitoring, and customer experience. Publisher delivery is intentionally
provider-neutral: LocalSync can use a direct publisher API, an approved partner
API, a distribution network, a managed submission, or a customer verification
step without changing the product contract.

The customer always sees the truthful delivery state. “Submitted” is not the
same as “live,” and “live” is not the same as “verified and synchronized.”

## Delivery rails

| Rail | Meaning | Customer label |
|---|---|---|
| `first_party_direct` | LocalSync has production API access and can write after approval | Directly synchronized |
| `approval_gated_direct` | A publisher API exists, but production access or customer delegation is still required | API approval required / Directly synchronized |
| `partner_network` | An approved distributor pushes and maintains the listing | Partner-distributed |
| `managed_submission` | LocalSync or its fulfillment partner completes the submission workflow | LocalSync-managed submission |
| `customer_action` | Publisher rules require the customer to claim, verify, or finish a step | Customer verification required |
| `monitor_only` | LocalSync can discover and audit the source but cannot promise a write | Monitoring only |

## Capability metadata

Each publisher records:

- delivery rail and approval state;
- verification owner;
- estimated variable cost and billing cadence;
- whether the listing persists after cancellation;
- supported operations such as discover, create, claim, update, verify,
  monitor, analytics, and duplicate suppression;
- the evidence required before LocalSync calls the listing verified.

The legacy `publisher_rail` column remains in place during this slice so the
existing Google import, audit, and task workflows remain compatible.

## Initial publisher map

- Approval-gated APIs: Google Business Profile, Bing Places, Apple Business,
  Facebook, Yelp, and Foursquare.
- Customer verification: Nextdoor.
- Managed submissions: BBB, Angi, HomeAdvisor, Thumbtack, Houzz, Porch,
  Yellow Pages, MerchantCircle, and Manta.
- Monitoring-first: BuildZoom, MapQuest, Citysearch, and Expertise.com.

Approval-gated publishers must not appear as synchronized until LocalSync has
production approval, customer authorization, a successful write, and a live
re-read that confirms the approved fields.

## Product behavior

The Listings workspace exposes the rail beside each publisher and summarizes
the campaign by delivery type. Publisher rows show the next honest action:
connect, review, submit, verify, add a listing URL, or inspect the live listing.

The first slice does not purchase a third-party network or represent an API
application as approved. Those are subsequent operational workstreams.

## Commercial guardrails

- Basic remains monitoring and guided work; it carries no paid distribution
  cost.
- Premium can remain $49 for the launch cohort only while the five-major rail
  costs no more than roughly $10 per location per month.
- Broad paid distribution belongs in Pro unless the negotiated cost is below
  $20–$25 per location per month.
- One-time authority campaigns remain separately priced because manual and
  aggregator costs occur at activation rather than evenly every month.

## Verification

This slice is complete when:

1. the database and seed catalog represent every rail without breaking legacy
   rows;
2. the server query returns the capability metadata;
3. the Listings UI uses truthful customer-facing labels and next actions;
4. unit tests cover label and action derivation;
5. typecheck, tests, lint, build, desktop, and mobile browser checks pass.
