# Spec 7.8 — Data export

- `GET /api/export?format=xlsx` → all `EXPORT_TABLES` in one workbook. `GET /api/export?format=csv&table=<key>` → one table;
  keys `emsallar | ehtimallar | matclar | sinxronlar | api` (validated; else 400). `Content-Disposition: attachment`, `Cache-Control: no-store`.
- Table = `{ key, title, columns: {header, type: text|number|percent|date, width}, rows }`, built in `lib/export/tables.ts` from plain rows.
- Əmsallar: OddsSnapshot × Match × Sync.startedAt, newest sync first; API outcome mapped to 1 / X / 2 / Üst <line> / Alt <line> (raw outcome kept).
- Ehtimallar: `analyzeSync(latestDataSync)` — every market × selection with probability, fair odds, best odds + bookmaker, bookmaker count, disagreement.
- xlsx: dates shifted by `DISPLAY.utcOffset` (Excel has no time zone), formats `dd.mm.yyyy hh:mm`, `0.00%`, `0.####`; frozen header, autoFilter.
- CSV: RFC 4180 quoting, BOM, CRLF, dates `formatBaku`, percent ×100 (2 decimals, header "(%)"), numbers rounded to 4 decimals.
