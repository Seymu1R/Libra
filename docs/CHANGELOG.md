# Changelog

Hər iş sessiyasının sonunda yeni qeyd **yuxarıya** əlavə olunur (tarix, nə edildi, harada). Köhnə qeydlər dəyişdirilmir.

## 2026-10-21 — Sessiya 2: port

- Port **4019**-a sabitləndi: `package.json`-da `dev` və `start` skriptləri. README, HANDOFF yeniləndi, açıq məsələ #11 bağlandı.

## 2026-10-21 — Sessiya 2 (davamı): kupon generatoru + təkrar qaydası (Epic 7)

- **Açıq məsələ #5 həll olundu.** Variantlar test datasında müqayisə edildi:
  (a) ehtimal aralıqları · (b) matçı təkrar etməmək · (c) ikili şans yalnız Sabit-də. Sahibi (b)-ni seçdi.
- **Story 7.1 — təkrar qaydası.**
  - Sabit → Balanslı → Riskli bir-biri ilə matç paylaşmır.
  - Saxlanmış kuponların (Fərdi + Generator) matçları hər yerdə bloklanır. İstisna ehtimalı > 70% olan seçimlərdir (`TEMPLATES.repeatAllowedAbove`).
  - Saxlama və silmədən sonra sistemin təklifləri yenidən qurulur.
  - Saxlanmış kuponlar yeni sinxronlardan sonra da görünür.
  - Fayllar: `lib/templates/build.ts`, `server/templates.service.ts`, `app/api/templates/custom/route.ts`.
- **Story 7.2 — kupon generatoru.** Kuponlar səhifəsinin ən yuxarısındadır (`components/CouponGenerator.tsx`, `lib/templates/generate.ts`). 3 rejimi var:
  - **Hədəf:** əmsal ⇄ ehtimal inputları bağlıdır;
  - **Aralıq:** minimum əmsal + minimum ehtimal; ziddiyyətli şərtlər izah olunur;
  - **Real əmsal:** bukmekerin ən yaxşı əmsalı + ehtimal.

  Seçim sayını generator özü təyin edir (2–8). "Yadda saxla" düyməsi kuponu `GENERATED` tipində saxlayır.
- Fərdi kupon bölməsi dəyişməyib (sahibi sonra yeniləmək istəyir — açıq məsələ #15).
- BMAD: Epic 7 (`epics.md`), story faylları `7-1-*`, `7-2-*` + spec-lər `_bmad-output/specs/`, `sprint-status.yaml`.

**Yoxlama:** 70 test ✔ (+18) · tsc ✔ · eslint ✔ · next build ✔. Headless Chrome ilə yoxlandı:
- hər 3 rejim işləyir;
- saxlamadan sonra növbəti kupon saxlanmış matçlardan qaçır;
- gündüz/gecə və mobil görünüş qaydasındadır.

Brauzer testindən sonra `prisma/dev.db` əvvəlki vəziyyətinə qaytarıldı.

## 2026-10-21 — Sessiya 2: UI yenilənməsi + gündüz/gecə rejimi

- `~/Desktop/Skill/ui-ux-pro-max-skill` oxundu. Onun `--design-system` tövsiyəsi tətbiq edildi:
  "Data-Dense Dashboard" stili, mavi əsas rəng, kəhrəba vurğu, Fira Sans + Fira Code şriftləri.
- `app/globals.css`: semantik rəng tokenləri (`bg`, `surface`, `fg`, `muted`, `primary`, `danger`, `warn`...).
  Gündüz və gecə üçün ayrıca dəstlər var, mətn kontrastı ≥ 4.5:1. Komponentlərdə artıq xam `zinc-*` rəngləri yoxdur.
- Gecə rejimi sinif əsaslıdır (`.dark`). Header-də 3 vəziyyətli keçid var: Gündüz / Gecə / Sistem (`components/ThemeToggle.tsx`).
  - Seçim `localStorage`-da (`terezi-theme`) saxlanır.
  - `<head>`-dəki skript (`components/theme-script.ts`) səhifə açılanda rəngin yanıb-sönməsinin qarşısını alır.
  - "Sistem" rejimində OS dəyişikliyini canlı izləyir.
- Emoji loqo SVG tərəzi ikonu ilə əvəz edildi.
- `focus-visible` halqası, düymələrdə `cursor-pointer`, `prefers-reduced-motion` dəstəyi əlavə edildi.
- 11px yazılar 12px-ə qaldırıldı, düymələr bir az böyüdüldü.
- `aria-pressed` / `aria-current` / `aria-expanded` atributları əlavə edildi.
- Turnirlər menyusu indi kənara klik və Esc ilə bağlanır.

**Yoxlama:** 52 test ✔ · tsc ✔ · eslint ✔ · next build ✔. Headless Chrome (CDP) ilə yoxlandı: keçid işləyir, seçim reload-dan sonra qalır.
Screenshot-larla baxıldı: gündüz və gecə, masaüstü və 390px mobil görünüş.

## 2026-10-20 — Sessiya 1: struktur + Epic 0–5

**Struktur**
- AviDelux-Latest-Platform-dan BMAD/WDS iş strukturu köçürüldü: `_bmad/`, `.claude/skills/`, `.agents/skills/` (86 skill), `_bmad-output/`.
- Konfiqurasiya Tərəzi-yə uyğunlaşdırıldı (layihə adı, istifadəçi Seymur, ünsiyyət dili Azərbaycan dili).
- Yaradıldı: `CLAUDE.md`, `_bmad-output/project-context.md`, PRD, arxitektura, epiklər, `sprint-status.yaml`, `ProjectDocs/original-brief.md` (tapşırıq olduğu kimi), `docs/decisions.md`, `docs/open-issues.md`.
- `git init`; GitHub-a push edildi: https://github.com/Seymu1R/Libra (`main`, commit a3e51a6).

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
