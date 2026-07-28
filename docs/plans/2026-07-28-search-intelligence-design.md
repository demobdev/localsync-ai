# Search Intelligence — end-to-end design

## Product boundary

Search Intelligence extends LocalSync's existing local-intelligence loop. It
does not turn LocalSync into a general-purpose Ahrefs/Semrush replacement.

The feature answers three location-level questions:

1. Is the website technically healthy and locally legible?
2. What search demand is Google already showing for this business?
3. Which evidence-backed fix should the owner or agency approve next?

The customer keeps their website. LocalSync observes it, compares public facts
to the master profile, recommends changes, and records improvement over time.
AI and automated analysis may create findings or approval requests, but never
mutate the master profile or an external website without approval.

## Information architecture

Each location gains a fifth workspace tab: **Search Intelligence**.

The primary screen contains:

- A separate **Website health** score (0–100). This is never blended into
  Workspace health, Market visibility audit, or Reputation score.
- Crawl summary: crawled pages, critical issues, opportunities, and last run.
- A 28-day Search Console trend for clicks and impressions.
- An opportunity queue combining search-performance opportunities and local
  identity mismatches.
- Website checks grouped into critical, warning, and passed.
- Recent audit history with score changes.

The primary actions are **Run website audit** and **Connect Search Console**.

## Data model

- `website_audit_runs`: durable crawl run, status, score, page/issue counts.
- `website_audit_pages`: page snapshot and technical/local signals.
- `website_findings`: normalized evidence with severity, remediation, and
  workflow status.
- `search_console_connections`: one selected GSC property per location.
- `search_performance_daily`: daily query/page grain. Page, device, and country
  are part of the grain so GSC rows cannot overwrite one another.

Substantial copied code retains the CrawlSEO MIT notice.

## Ingestion and processing

### Website audit

1. A server action authorizes the location and inserts a queued run.
2. It sends `search-intelligence/audit.requested` to Inngest.
3. The Inngest function marks the run running and crawls the canonical website.
4. The crawler honors page limits, blocks private/reserved targets, uses
   timeouts, and records page snapshots.
5. Rules produce technical and local-specific findings:
   broken pages, missing titles/descriptions/H1/canonical, robots/sitemap,
   LocalBusiness schema, phone/address mismatch, and slow responses.
6. A normalized score is calculated by affected-page rate and severity.
7. Findings and score are committed atomically and the location page is
   revalidated.

### Search Console

Google OAuth requests `webmasters.readonly` alongside Business Profile access.
After authorization, LocalSync lists available properties and selects the best
host match for the location website. Daily sync stores query/page/device/country
rows and derives:

- striking-distance queries,
- low-CTR queries,
- content decay,
- cannibalization.

When Search Console is not connected, the website audit remains fully usable.

## Frontend states

- **No website:** explain that a website is required; link to Profile.
- **Ready/no audit:** empty score state with Run website audit.
- **Queued/running:** persistent progress state and refresh-safe run record.
- **Complete:** score, findings, opportunities, and history.
- **Failed:** preserve prior successful results and show a retry action.
- **GSC disconnected:** show Connect Search Console without blocking audits.
- **GSC connected/no data:** show connection and invite the first sync.

Desktop uses the existing open, table-led LocalMap workspace. Mobile stacks the
score, metrics, trend, opportunity rows, checks, and history without horizontal
page overflow.

## Packaging

- Basic/Premium can receive a lightweight website audit.
- Pro includes recurring audits, GSC opportunities, history, and approval-ready
  recommendations.
- Agency workspaces receive cross-client prioritization in a later slice.
- Backlinks, broad keyword research, and MCP exposure remain later/managed-SEO
  capabilities rather than core listing workflow.

## Verification

- Unit tests cover scoring, opportunity derivation, local identity comparison,
  and URL safety.
- Server action tests cover organization isolation.
- Typecheck, test, lint, and production build must pass.
- Browser QA covers initial, running, complete, failed, desktop, and mobile
  states against the accepted concept.

