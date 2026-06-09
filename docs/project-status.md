# Project Status

The current scope is the upload-only, local-processing NOC dashboard.

This document is the current source of truth for active scope and remaining work. `implementation_plan.md` remains the historical full plan.

## Active Remaining Work

- Complete Phase 8 manual browser verification using `docs/manual-verification.md`: automated checks are enough to deploy, then manual verification happens immediately on the Netlify review link by a developer and stakeholder.
- Complete Phase 11 Netlify review deployment from the main branch.
- Review and address any issues found during stakeholder testing.
- Track actionable stakeholder bugs and product feedback in the repo as issues or tasks using `docs/review-feedback-template.md`.

## Closed As Out Of Scope

- Phase 9 optional persistence.
- Phase 10 future API readiness beyond the existing lightweight report data-source boundary.

## Out Of Current Scope

- Saved uploads.
- Backend persistence.
- API ingestion.
- Authentication.
- Report history.
- Real-time updates.
- Role-based permissions.

## Notes

- The dashboard starts with no bundled report data.
- Users provide CSV or XLSX reports manually.
- Report files are processed locally in the browser and are not uploaded or saved by the app.
- The existing report data-source boundary keeps upload parsing separate from dashboard presentation; it is not a commitment to API integration.
- The production build currently reports a large Vite route chunk warning. This is known and non-blocking for MVP review unless stakeholder testing shows load-time problems.
- Netlify deployment runs `pnpm typecheck && pnpm test && pnpm build` so automated checks gate the review site.
