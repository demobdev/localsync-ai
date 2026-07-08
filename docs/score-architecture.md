# Score architecture

LocalSync shows several **0–100 style numbers**. They measure different things and must stay visually and verbally distinct so users are not comparing apples to oranges.

## Score families

| Label (UI) | Code | Range | What it measures |
|------------|------|-------|------------------|
| **Market visibility audit** | `lib/grader/scoring.ts` | 0–100 | External snapshot: local rankings, website quality, GBP/public signals. Produced by `/grader`, not the dashboard. |
| **Workspace health** | `lib/visibility/score.ts` | 0–100 | In-app readiness: **profile completeness (50)** + **listing consistency (50)** from Firecrawl listing audits run in the product. |
| **Reputation score** | `lib/reviews/score.ts` | 0–100 | Review average + reply rate. Lives on Reviews; **not** part of workspace health today. |

### Workspace health breakdown

```
Workspace health (0–100)
├── Profile completeness (0–50)  — setup workflow, NAP, services, hours, etc.
└── Listing consistency (0–50)   — latest listing audit match score (0 until first audit)
```

Publishing an AI page or completing grader tasks does **not** automatically change workspace health unless those actions fill profile fields or you run a listing audit.

### Grader vs workspace

- **Grader score** answers: “How visible is this business in the market right now?”
- **Workspace health** answers: “How much have we fixed and verified inside LocalSync?”

A location can have a high market audit and low workspace health (strong presence, empty profile) or the reverse after heavy in-app setup but no fresh grader run.

## UI naming rules (Phase 1)

1. Never use bare **“Visibility score”** for workspace health — use **Workspace health**.
2. Grader hero and reports use **Market visibility audit** (short: **Market audit**).
3. Dashboard stat formerly labeled “Profile score” shows **workspace health total** — label it **Workspace health**.
4. Dashboard “Listing audits” tile shows **listing consistency points (n/50)**, not audit run count.
5. Location header chip: **Workspace health**, not “Visibility”.
6. AI Visibility tab includes a **score context** card listing all linked scores and a glossary.

## Shared constants

Copy lives in `lib/scores/labels.ts` (`SCORE_LABELS`, `SCORE_DESCRIPTIONS`).

## Future (Phase 2+)

- Surface grader tasks as profile/setup checklist items.
- Re-score listing consistency after fix workflows.
- Optional unified “progress” dashboard card that links to each score’s drill-down without blending formulas.
- Gate E: operating-model-aware grader weighting (`docs/phase-operating-model-routing.md`).

## Related docs

- `docs/phase-cyclical-funnel.md` — grader → claim → dashboard funnel
- `docs/demo-walkthrough.md` — demo script; distinguish grader vs workspace scores when presenting
