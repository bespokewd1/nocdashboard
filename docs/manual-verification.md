# Manual Verification Checklist

Use this checklist before calling the upload-driven MVP review-ready.

The checklist should be run twice:

- A developer completes it locally before deployment.
- A stakeholder completes it on the Netlify review link using both the repo verification fixture and their own report.

## Setup

- Run `pnpm typecheck`.
- Run `pnpm test`.
- Run `pnpm build`.
- Start the app locally or open the Netlify review deployment.

## Initial State

- The dashboard opens with no report data loaded.
- The upload area clearly accepts CSV and XLSX reports.
- The upload area states that files are processed locally in the browser and are not uploaded or saved.
- KPI, LTE, upload result, and issue table areas clearly ask for a report upload instead of implying zero incidents.

## Report Upload

- Upload `mock_data_for_noc_dashboard_sheet1.csv` from the repo root.
- The report imports successfully.
- The report name and updated time are visible.
- The upload result shows processed rows, valid issues, invalid rows, and warnings.
- Parser warnings are visible when uploading a malformed or partial test report.
- Stakeholder verification also uploads a real operational report.
- If the fixture passes but the real report fails, treat it as report-format drift or data-quality feedback.
- Report-format drift blocks MVP approval only when the current real report cannot be imported.
- Minor warnings or data-quality issues can become follow-up fixes when valid issues still import and warnings are clear.

## Dashboard Data

- KPI cards update after upload.
- Priority overview matches the imported report data.
- Device and network overview matches the imported report data.
- LTE usage rows display GB values and highlight high usage.
- Ticket links open in a new tab when present.

## Filters And Table

- Store search filters the issue list.
- Priority filter updates the issue list and URL search params.
- Device filter updates the issue list and URL search params.
- Category filter updates the issue list and URL search params.
- Clear filters resets table filters and URL search params.
- Table sorting works for store, priority, category, device/network, and data usage.
- Empty filtered results show a clear no-match state.

## Clear Report

- Clear report appears after a successful upload.
- Clear report returns the dashboard to the initial no-report state without a confirmation dialog.
- Clear report clears active filters and sorting.

## Responsive Review

- Desktop layout is usable without overlapping content.
- Tablet layout is usable without overlapping content.
- The issue table scrolls horizontally when needed.
- Phone-sized mobile is best-effort only and is not a required review target.

## Netlify Review Deployment

- The Netlify site opens from a public review link.
- The site starts with no bundled report data.
- Uploading a report on Netlify behaves the same as local verification.
- Refreshing the page clears the uploaded report and returns to the no-report state.
