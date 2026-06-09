# NOC Dashboard

Domain language for the NOC dashboard used to review quick service restaurant network operations from exported report data.

## Language

**Upload-driven MVP**:
The first reviewable dashboard version that uses uploaded CSV or XLSX reports as the source of operational data. It does not include saved reports, login, API ingestion, or real-time updates.
_Avoid_: Backend MVP, database-backed MVP, real-time MVP

**Backend-backed operation**:
A later operating mode where reports or issues are saved, queried, or ingested through a backend service or external API.
_Avoid_: MVP backend, upload workflow

**Temporary report upload**:
An uploaded report that is parsed for the current browser session only and is not saved for later retrieval. Users upload the latest report again when they need a fresh dashboard view.
_Avoid_: Saved report, report history, persisted upload

**Review target**:
The device class stakeholders are expected to use when evaluating the MVP. Desktop and tablet are required review targets; phone-sized mobile is best-effort only.
_Avoid_: Full mobile support, phone-first dashboard

**Report data source**:
A source that provides normalized NOC report results to the dashboard, whether from a temporary upload now or another ingestion path later. The MVP report data source is the user's uploaded CSV or XLSX report.
_Avoid_: API source, backend source, database source

**Report import result**:
The normalized dashboard-ready result of reading one NOC report, including valid issues, import warnings, detected sections, and row counts.
_Avoid_: Issue list, raw report, parsed file

**Future API ingestion**:
A possible later ingestion path only if the product scope changes. There is no current plan to add backend or API ingestion to the local-processing dashboard.
_Avoid_: Planned API work, separate API dashboard model, live-data model

**Review-ready dashboard**:
An MVP dashboard that has passed automated checks and manual browser verification with realistic report data on desktop and tablet review targets.
_Avoid_: Code-complete dashboard, unverified dashboard

**Component test**:
A focused automated check for dashboard UI behavior that is added only when a concrete risk cannot be covered well by parser tests, schema tests, or manual browser verification.
_Avoid_: Required MVP test, broad UI test suite

**Review deployment**:
A Netlify-hosted version of the upload-driven MVP that stakeholders can open without setting up the repository. It must not depend on bundled operational report data or saved uploads, and should deploy automatically from the main branch.
_Avoid_: Production backend, internal-only build

**Public review link**:
A review deployment that anyone with the URL can open, but that contains no bundled operational report data and stores no uploaded reports.
_Avoid_: Private app, authenticated dashboard

**User-provided report**:
The CSV or XLSX report selected by a dashboard user to populate the dashboard. The MVP should require this user action instead of preloading bundled mock report data.
_Avoid_: Bundled sample report, default loaded report

**Local report processing**:
The browser-only handling of a user-provided report where the selected file is read, parsed, and displayed without being uploaded or saved by the dashboard.
_Avoid_: Report upload storage, server-side import, saved report processing

**Upload-only review**:
The review deployment mode where CSV and XLSX files are the only ingestion methods. API ingestion is deferred until the dashboard workflow has been validated.
_Avoid_: API-enabled review, live data review, backend review

**Current scope**:
The agreed product scope for this dashboard: a hosted, local-processing app where users provide CSV or XLSX reports manually. Backend persistence, API ingestion, authentication, report history, and real-time updates are not current work.
_Avoid_: Backend roadmap, API phase, live dashboard scope

**Out-of-scope backend features**:
Features intentionally excluded from the current dashboard scope, including saved uploads, authentication, report history, databases, API ingestion, and real-time updates.
_Avoid_: Optional MVP backend, planned persistence, current backend phase

**Current status reference**:
The document that describes the active project scope and remaining work. `docs/project-status.md` is the current status reference; `implementation_plan.md` remains the historical full plan.
_Avoid_: Rewritten implementation plan, historical plan as active scope

**Supported report file**:
A user-provided CSV or XLSX report that can be read by the dashboard during upload-only review. Both formats remain in scope for the MVP review deployment.
_Avoid_: CSV-only report, API report

**Verification fixture**:
A report file used by developers or reviewers to validate dashboard behavior without being bundled as default dashboard data.
_Avoid_: Default report, preloaded sample, production report

**Initial dashboard state**:
The dashboard state shown before a user-provided report is selected. It should show the dashboard shell with clear empty states that explain a report upload is required.
_Avoid_: Zero-incident state, preloaded sample state

**Clear report**:
A user action that removes the currently displayed temporary report from the page and returns the dashboard to the initial dashboard state.
_Avoid_: Delete report, remove saved report

**Unconfirmed clear**:
The clear report behavior where the dashboard resets immediately without a confirmation dialog because the report is temporary and can be re-uploaded.
_Avoid_: Delete confirmation, destructive clear
