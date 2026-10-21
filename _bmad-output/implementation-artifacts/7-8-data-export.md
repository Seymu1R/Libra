# Story 7.8 — Datanın ixracı (Excel / CSV)

Status: review · Spec: [`../specs/7-8-data-export.md`](../specs/7-8-data-export.md) · Date: 2026-10-21

## Story
As the owner, I want an "Export" button next to "Sinxron et" to download all data that came from the API, as Excel or CSV.

## Acceptance criteria
1. Header: "Export" button (download icon) next to "Sinxron et"; disabled until there is a sync. Menu closes on outside click / Esc.
2. "Excel (.xlsx)" — one workbook, one sheet per table: Əmsallar (raw odds, all syncs), Ehtimallar (latest sync consensus), Matçlar,
   Sinxronlar, API çağırışları. Bold frozen header, filters, widths; dates as Asia/Baku time, percents as %.
3. "CSV" — each table as its own file; UTF-8 BOM, comma-separated, Baku times, percents 0–100.
4. Read-only: export never calls the API and never writes to the DB. File names `terezi-<table|data>-YYYY-MM-DD-HHmm`.

## Tasks
- [x] `lib/export/tables.ts` (pure): table builders, `toCsv`, `exportFileName`
- [x] `server/export.service.ts`: DB queries, `toXlsx` (exceljs 4.4.0); `app/api/export/route.ts`
- [x] `components/ExportMenu.tsx` in `SyncPanel`
- [x] Tests: +3 (89 total)
- [x] Real DB: xlsx 700 KB, 5 sheets (15 087 odds rows, 752 probability rows, 130 matches, 5 syncs, 17 API calls); CSVs; menu light/dark/mobile
