# Continue LocalMap on the PC

From the existing `localsync-ai` repository, first check for local work:

```sh
git status --short
git fetch origin
git switch codex/listings-cohesion
git pull --ff-only
npm ci
npm run dev
```

If the branch is not available locally and automatic tracking does not resolve it:

```sh
git switch --track origin/codex/listings-cohesion
```

Do not reset or overwrite local PC changes if Git reports a conflict. Resolve or preserve them first.

Open http://localhost:3002/. The expected homepage says **Get your business listed. Keep it right.**

## Environment

`.env.local` is intentionally not in Git. Reuse the intended development environment through the team's secure credential channel. `.env.example` documents variable names; do not paste credentials into commits or chat. Clerk and database configuration are needed for authenticated flows. Google Places lookup and Google Business Profile OAuth are separate integrations.

Do not create a new Neon database, Clerk app, or Google Cloud project merely to use a second computer. Do not run `db:push`, `db:seed`, or migrations against the shared database as part of checkout setup.

## Verification and known gates

```sh
npm run check
npm run build
```

Run build separately from the development server if the machine has limited resources. A local build does not certify Google access, a live Vercel deployment, payment configuration, or successful publisher updates.

- The cohesion checkpoint passed a production build locally on the Mac.
- Campaign storage now requires all three campaign tables; partial migrations must remain blocked.
- Google approval/OAuth and the campaign migration still require deliberate verification.
- The six pre-existing local asset deletions on the Mac were not committed. Git retains those assets for the PC checkout.
- Review screenshots remain local on the Mac; report image paths are not portable Git artifacts.
- No production deployment, email send, publisher write, or database migration was performed for this handoff.

Next: finish authenticated/responsive acceptance, verify Google access, review and apply the migration in the agreed environment, then run one explicitly approved business pilot. See [the ordered recovery plan](plans/2026-09-19-listings-recovery-report.md).
