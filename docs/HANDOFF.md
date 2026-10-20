# Tərəzi — Handoff / Cari vəziyyət

> **Yeni kompüterdə və ya yeni Claude sessiyasında işə buradan başla.**
> Bu fayl həmişə layihənin *indiki* vəziyyətini göstərir və hər iş sessiyasının sonunda yenilənir.
> Tarixçə: [`CHANGELOG.md`](CHANGELOG.md) · Qərarlar: [`decisions.md`](decisions.md) · Açıq məsələlər: [`open-issues.md`](open-issues.md)

Son yenilənmə: **2026-10-20**

## 1. Layihə nədir

Futbol matçlarının bukmeker əmsallarından (The Odds API v4) bazarın konsensus (marjasız) ehtimallarını hesablayan
və yalnız baxış üçün kupon şablonları quran şəxsi, lokal veb tətbiq. Mərc qoymur, canlı funksiyası yoxdur.

- Orijinal tapşırıq (dəyişdirilmir): [`ProjectDocs/original-brief.md`](../ProjectDocs/original-brief.md)
- PRD / arxitektura / epiklər: [`_bmad-output/planning-artifacts/`](../_bmad-output/planning-artifacts/)
- Agent qaydaları: [`CLAUDE.md`](../CLAUDE.md) → [`_bmad-output/project-context.md`](../_bmad-output/project-context.md)

## 2. Hazır olanlar (Epic 0–5, status: `review`)

| Epic | Nə edilib |
|---|---|
| 0 — Scaffold | Next.js 16.4 (App Router) · React 19.3 · TS 5.9 strict · Tailwind 4 · Vitest 5 · Prisma 7.10 + SQLite (better-sqlite3 adapter) · zod 4 |
| 1 — API client | Rəsmi sənədlər oxunub → `ProjectDocs/APIDocs/the-odds-api-v4.md`. zod sxemləri, kvota header parser, real + mock client, hər çağırış `ApiCallLog`-a yazılır. `npm run verify:sports` skripti |
| 2 — Baza + sinxron | Prisma sxemi + ilk miqrasiya. `POST /api/sync`: cooldown, eyni anda iki sinxron bloku, turnir seçimi, 7 günlük pəncərə, turnir üzrə xəta izolyasiyası, pulsuz `events` yoxlaması ilə kredit qənaəti |
| 3 — Analiz (`lib/analysis`) | 1/əmsal → normallaşdırma, median konsensus + renormalizasiya, fikir ayrılığı, 1X2 / Ü/A 2.5 / ikili şans (1X2-dən), ən yaxşı əmsal, MIN_BOOKMAKERS |
| 4 — Kuponlar (`lib/templates`) | Deterministik greedy: Sabit / Balanslı / Riskli, matç başına 1 seçim, fərdi kupon (server ehtimalları yenidən hesablayır) |
| 5 — UI | Header (sinxron, turnir seçimi, son sinxron, kredit, gözləmə), Matçlar, Kuponlar + fərdi kupon qurucusu, xəbərdarlıq, mobil görünüş |

Yoxlama: **52 test keçir**, `tsc` / `eslint` / `next build` təmiz, mock rejimdə tam axın brauzerdə yoxlanıb.

## 3. Hələ edilməyənlər / növbəti addımlar

1. **API açarı yoxdur.** Açar alınanda: `.env` → `ODDS_API_KEY=...`, `USE_MOCK_DATA=false`, sonra `npm run verify:sports` (pulsuz). Nəticəni (✘ olan turnir varsa) sahibinə bildir.
2. İlk real sinxrondan sonra yoxla: Ü/A 2.5 üçün kifayət qədər bukmeker varmı, heç-heçə `"Draw"` adlanırmı (bax `open-issues.md`).
3. **Açıq məsələlər** — tam siyahı prioritetlə: [`open-issues.md`](open-issues.md) (13 bənd).
4. **Epic 6 (Phase 2)** — final hesablar, kuponların qazandı/uduzdu statusu, kalibrləmə. Sxem hazırdır (`Template.status`, `settledAt`, `TemplateLeg.result`, `Match.homeScore/awayScore/completed`).
5. Epic 0–5 story-ləri `review` statusundadır — kod review-dan sonra `done`.

## 4. Sahibinin verdiyi qərarlar (2026-10-20)

- Greedy `maxLegs`-ə qədər doldurur · `MAX_DISAGREEMENT = 0.08` · ikili şans avtomatik kuponlarda qalır
- Sxem əlavələri qəbul edilib (`ApiCallLog`, Phase 2 sahələri)
- API açarı sonra əlavə olunacaq

## 5. Yeni kompüterdə qurmaq

Repo: **https://github.com/Seymu1R/Libra** (budaq `main`). Commit + push yalnız sahibi istəyəndə edilir.

Git-ə **düşməyən** fayllar (hər kompüterdə yenidən yaradılır):

| Fayl | Necə yaradılır |
|---|---|
| `.env` | `cp .env.example .env` (açarı əl ilə əlavə et — heç vaxt commit etmə) |
| `prisma/dev.db` | `npx prisma migrate dev` (boş baza; sonra "Sinxron et") |
| `generated/prisma/` | `npm install` (postinstall → `prisma generate`) |
| `node_modules/` | `npm install` |

```bash
git clone https://github.com/Seymu1R/Libra.git && cd Libra
npm install
cp .env.example .env
npx prisma migrate dev
npm run dev            # port 3000 məşğuldursa Next özü başqa port seçir
```

Tələb: Node.js 22+.

## 6. Bilinən xüsusiyyətlər

- Tarix/rəqəm formatı əl ilə yığılır (`lib/time.ts`, `lib/format.ts`) — Intl `az-AZ` Node və Chrome-da fərqli nəticə verir.
- Mock və real sinxronların gözləmə müddəti ayrıdır (mock: 0 dəq, real: 30 dəq).
- `next dev` kökdə `AGENTS.md` yaradır (Next 16 xüsusiyyəti) — zərərsizdir.
- Test fixtures: `npm run fixtures:generate` (deterministik; vaxtlar "indi"yə görə sürüşdürülür).
