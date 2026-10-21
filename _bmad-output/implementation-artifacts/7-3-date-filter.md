# Story 7.3 — Tarix filtri (Kuponlar)

Status: review · Spec: [`../specs/7-3-date-filter.md`](../specs/7-3-date-filter.md) · Date: 2026-10-21

## Story
As the owner, I want to limit coupons to a time window, so that I get probabilities for today, this week or a chosen day.

## Acceptance criteria
1. One filter at the top of `/templates`; it applies to the generator, the system suggestions and the manual builder.
2. Options: **24 saat** (default, now → +24 h) · **Bu həftə** (now → +7 days) · **Ümumi** (all not-started matches, as before) ·
   **Tarix** (one Asia/Baku calendar day) · **Aralıq** (from-day 00:00 → to-day 24:00, Baku).
3. Stored in the URL (`?filtr=24saat|hefte|umumi|tarix|araliq&tarix=&bas=&son=`); invalid params fall back to the default; a reversed range is swapped.
4. System suggestions are computed live for the window (same rules + repeat rule); saved coupons are not filtered.
5. Changing the filter resets the generator result and the manual builder picks.

## Tasks
- [x] `lib/date-filter.ts` + tests (7) · `DISPLAY.utcOffset` in config
- [x] `components/DateFilter.tsx`; `TemplatesView` (filter on top, `key` remount, "Yenidən hesabla" removed — suggestions are live)
- [x] `server/templates.service.ts` `buildAutoTemplates` (shared by page and `regenerateTemplates`)
- [x] `app/templates/page.tsx`: parse filter, filter analyses/legs, live auto templates
- [x] Headless Chrome on real data: 24 saat 10 matç · Tarix 22.10 36 · Aralıq 21–23 51 (→25: 92) · Bu həftə/Ümumi 97; light/dark/mobile

## Dev notes
Owner answers 2026-10-21: default = next 24 h; "Bu həftə" = next 7 days; filter once at the top.
Sync loads 7 days ahead, so "Bu həftə" and "Ümumi" currently show the same matches.
Small windows may leave Riskli empty (no-repeat rule: Sabit + Balanslı use up to 7 matches first).
