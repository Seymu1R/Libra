# Changelog

Hər iş sessiyasının sonunda yeni qeyd **yuxarıya** əlavə olunur (tarix, nə edildi, harada). Köhnə qeydlər dəyişdirilmir.

## 2026-10-20 — Sessiya 1: struktur + Epic 0–5

**Struktur**
- AviDelux-Latest-Platform-dan BMAD/WDS iş strukturu köçürüldü: `_bmad/`, `.claude/skills/`, `.agents/skills/` (86 skill), `_bmad-output/`.
- Konfiqurasiya Tərəzi-yə uyğunlaşdırıldı (layihə adı, istifadəçi Seymur, ünsiyyət dili Azərbaycan dili).
- Yaradıldı: `CLAUDE.md`, `_bmad-output/project-context.md`, PRD, arxitektura, epiklər, `sprint-status.yaml`, `ProjectDocs/original-brief.md` (tapşırıq olduğu kimi), `docs/decisions.md`, `docs/open-issues.md`.
- `git init` (commit yoxdur).

**Kod (Epic 0–5)**
- Scaffold: Next.js 16.4, React 19.3, TS 5.9, Tailwind 4, Vitest 5, Prisma 7.10 + SQLite, zod 4.
- `lib/config.ts` — bütün hədlər və turnir açarları.
- `lib/odds-api/` (zod sxemləri, kvota), `server/odds-client.ts` (real + mock), `scripts/verify-sports.ts`, `scripts/generate-fixtures.ts`, `fixtures/`.
- `prisma/schema.prisma` + `init` miqrasiyası (Sync, Match, OddsSnapshot, Template, TemplateLeg, ApiCallLog).
- `server/sync.service.ts`, `analysis.service.ts`, `templates.service.ts`, `status.service.ts`; route-lar `/api/sync`, `/api/status`, `/api/templates`, `/api/templates/custom`.
- `lib/analysis/` (median konsensus, fikir ayrılığı, ikili şans, ən yaxşı əmsal), `lib/templates/` (greedy kupon, combine).
- UI: `app/`, `components/` (Header, SyncPanel, MatchesView, MatchCard, TemplatesView, CustomBuilder, Disclaimer).
- Düzəliş: ikili şans sırası (`"12"` açarı JS-də birinci gəlirdi); tarix/rəqəm formatı deterministik edildi.
- README (Azərbaycan dilində), `docs/HANDOFF.md`, bu changelog.

**Yoxlama:** 52 test ✔ · tsc ✔ · eslint ✔ · next build ✔ · mock rejimdə dev server + brauzer yoxlaması ✔
