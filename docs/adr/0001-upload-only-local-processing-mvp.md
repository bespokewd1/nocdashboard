# Upload-only local-processing MVP

The MVP is a Netlify-hosted dashboard that starts with no bundled report data and requires users to provide CSV or XLSX reports. Selected files are read, parsed, validated, and displayed locally in the browser without being uploaded, saved, or associated with a user account. We chose this over backend-backed operation so stakeholders can validate the dashboard workflow quickly while avoiding early database, authentication, report history, API ingestion, and sensitive-data storage decisions.

There is no current product plan to add backend persistence, authentication, report history, or API ingestion. The small report data-source boundary exists to keep the upload parsing separate from dashboard presentation, not to imply planned API work.

## Consequences

- Refreshing or closing the page clears the displayed report.
- Users must upload the latest report each time they need a fresh dashboard view.
- Persistence, authentication, report history, API ingestion, databases, role-based permissions, and real-time updates are outside the current scope.
