# NOC Dashboard Project Understanding

## Summary

This project is a modern Network Operations Center dashboard for quick service restaurant operations. Its purpose is to help executives, sales teams, and IT operations quickly understand store-level operational issues without digging through raw reports.

The dashboard should make it immediately clear:

- What is currently down
- How many stores are affected
- Which issues are most severe
- Which device or network type is involved
- Whether overall operations look healthy or degraded

## Primary Users

- Executives who need a high-level operational snapshot
- Sales teams who need visibility into store-impacting issues
- IT operations/NOC users who need to track outages, alerts, notes, and tickets

## Initial Data Source

The first version should use Excel or CSV uploads as the main data workflow.

Important constraints:

- Data comes from external systems
- No API is currently available
- File upload should be the primary update method
- Manual entry may be useful later for notes or small corrections

The uploaded file should be parsed, normalized, and transformed into dashboard-ready issue records.

## Future Data Source

The dashboard should be designed so the data layer can later be swapped from uploaded Excel/CSV files to API ingestion.

The dashboard UI should not need major changes when this happens. The app should separate:

- Data ingestion
- Data normalization
- Dashboard presentation

This keeps the MVP simple while leaving a clean path to real-time or scheduled API updates later.

## Issue Categories

The mock data is organized by priority:

- Priority 1: Business Central Offline / PBX
- Priority 2: InHand Offline
- Priority 3: Cradlepoint Offline
- Priority 4: Stores on LTE Backup
- Priority 5: CP and InHand Alerts

## Priority Meaning

Priority 1 is the most critical because it indicates a store phone system or communication outage.

Priority 2 and Priority 3 relate to backup connectivity devices being offline.

Priority 4 means stores are operating on LTE backup because primary internet is down. LTE data usage is important and should be tracked visually.

Priority 5 represents intermittent connectivity alerts that may cause high data usage, service disruption, poor VoIP quality, or network instability.

## Core Dashboard Features

The MVP should include:

- CSV/Excel upload
- Automatic parsing of priority sections
- Summary cards for total affected stores and counts by priority
- Severity-based issue grouping
- Store issue table with store number, priority, issue type, ticket link, notes, and data usage where available
- Filters by priority, device type, and issue status/type
- Visual indicators for high-severity issues
- LTE usage highlighting for stores consuming significant backup data
- Clean executive-friendly layout

## Recommended Stack

Recommended MVP stack:

- TanStack Start
- React
- TypeScript
- Tailwind CSS 4
- shadcn/ui for dashboard components
- Iconify using Tabler icons
- TanStack Router for type-safe routing and URL search params
- TanStack Query for server/client data loading patterns
- TanStack Table for the issue table
- Recharts for charts and summary visuals
- Papa Parse for CSV parsing
- SheetJS/xlsx for Excel parsing if `.xlsx` upload is needed
- Zod for validating and normalizing dashboard records

Optional backend/persistence:

- Supabase if login, saved uploads, audit history, or team access is needed
- PostgreSQL once uploaded reports need to be stored and compared over time

## Why This Stack Fits

TanStack Start is a strong fit because this is a dashboard-first application where routes, filters, search params, tables, and async data loading matter more than content publishing or marketing pages. It also keeps the app aligned with the broader TanStack ecosystem.

TanStack Router can store dashboard filters in the URL, such as priority, device type, store, severity, or issue category. This makes filtered dashboard views shareable and easier to revisit.

The UI can start by parsing uploaded files client-side, then later fetch normalized data from server functions, Supabase, or another backend without changing the dashboard components much.

TypeScript and Zod are useful because the uploaded reports are semi-structured and may change over time. They help prevent bad rows or unexpected file formats from breaking the dashboard.

TanStack Table and Recharts fit the operational dashboard use case well: users need filtering, scanning, counts, and quick visual summaries more than complex custom visualization.

Tailwind CSS 4 and shadcn/ui provide a modern, practical interface foundation without over-designing the application. Iconify with Tabler icons gives the dashboard a broad icon set that fits NOC concepts like routers, alerts, upload, filters, signal, phone systems, charts, and network devices.

Papa Parse and Zod serve different roles. Papa Parse reads CSV file text and turns it into rows. Zod validates and normalizes those rows into safe dashboard records. If Excel upload is required, SheetJS/xlsx can handle `.xlsx` parsing before the same Zod validation layer.

## Suggested Architecture

The app should be organized around a normalized issue model:

- Upload adapter: accepts CSV or Excel files
- Parser: extracts priority sections and rows
- Normalizer: converts raw rows into consistent issue records
- Dashboard data service: provides filtered and aggregated issue data
- UI components: render summary cards, charts, filters, and tables

This keeps the dashboard independent from the data source. Later, the upload adapter can be replaced or supplemented by an API adapter.

Example normalized issue shape:

```ts
type NocIssue = {
  storeId: string
  priority: 1 | 2 | 3 | 4 | 5
  category: string
  deviceType: "PBX" | "InHand" | "Cradlepoint" | "LTE" | "Unknown"
  ticketUrl?: string
  notes?: string
  dataUsageGb?: number
}
```

## MVP Build Order

1. Build the static dashboard layout.
2. Parse the provided mock CSV.
3. Normalize rows into issue records.
4. Add summary cards and priority counts.
5. Add table, filters, and ticket links.
6. Add LTE usage display and alert highlighting.
7. Polish the visual design for review.
8. Add persistence or API ingestion only after the dashboard is approved.

## Open Questions

- Should users need authentication?
- Should uploaded reports be saved, or only processed locally in the browser?
- Will users upload CSV only, or both CSV and Excel files?
- Should the dashboard compare the latest report with previous reports?
- Are ticket links always from the same support system?
- What thresholds define high LTE usage?
