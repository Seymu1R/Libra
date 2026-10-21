# Changelog

Hər iş sessiyasının sonunda yeni qeyd **yuxarıya** əlavə olunur (tarix, nə edildi, harada). Köhnə qeydlər dəyişdirilmir.

## 2026-10-21 — Sessiya 2: generatorda matç sayı (Story 7.5)

- Generatorun "Hədəf" rejiminə üçüncü sahə əlavə olundu: **Matç sayı (2–8)**. Boş qalsa, sistem sayı özü seçir (əvvəlki kimi).
  Əmsal + say və ya ehtimal + say eyni işləyir, çünki əmsal və ehtimal bir-biri ilə bağlıdır.
- Sabit say olanda axtarış daha güclüdür: bir neçə başlanğıc nöqtəsindən yoxlayır, mümkün kuponu buraxmır.
- Aralıq və Real əmsal rejimləri dəyişmədi (sahibi: "hələlik hədəfə").
- **Yoxlama:** 81 test ✔ (+2) · tsc ✔ · eslint ✔. Real datada yoxlandı: 2,50×2 və ×4, 5,00×6, 10,00×3 dəqiq alınır;
  1,20×8 mümkün deyil, aydın xəta göstərilir.

## 2026-10-21 — Sessiya 2: təklifləri saxlamaq + silmə (Story 7.4)

- Sistemin təkliflərinə (Sabit/Balanslı/Riskli) "Yadda saxla" düyməsi əlavə olundu. Saxlanan kupon "Sistem · Sabit" və s. adı ilə görünür.
- Eyni kuponu ikinci dəfə saxlamaq olmur: server buna icazə vermir, kartda isə "✓ Saxlanılıb" yazılır.
  Sabit-in seçimləri >70% olduğu üçün o, saxlandıqdan sonra da təkliflərdə qalır.
- Saxlanmış kuponlarda silmə düyməsi daha görünəndir: qırmızı çərçivə + zibil qutusu ikonu.
  Səhvən silməmək üçün kartın içində təsdiq var ("Silinsin? Bəli, sil / Ləğv et"), Esc ilə ləğv olunur.
- **Yoxlama:** 79 test ✔ · tsc ✔ · eslint ✔. Real bazanın nüsxəsi ilə headless Chrome-da yoxlandı, baza sonra geri qaytarıldı.

## 2026-10-21 — Sessiya 2: tarix filtri (Story 7.3)

- Kuponlar səhifəsinin yuxarısına tarix filtri əlavə olundu (`components/DateFilter.tsx`, `lib/date-filter.ts`). Seçimlər:
  **24 saat** (default) · **Bu həftə** (7 gün) · **Ümumi** · **Tarix** (bir gün) · **Aralıq**.
- Filtr generatora, sistemin təkliflərinə və fərdi kupona eyni anda tətbiq olunur və linkdə saxlanır (`?filtr=...`).
- Sistemin təklifləri seçilmiş pəncərə üçün canlı hesablanır, ona görə "Yenidən hesabla" düyməsi çıxarıldı.
- **Yoxlama:** 77 test ✔ (+7) · tsc ✔ · eslint ✔. Real datada yoxlandı:
  - 24 saat → 10 matç;
  - 22.10 → 36 matç;
  - 21–23.10 → 51 matç;
  - həftə → 97 matç.

## 2026-10-21 — Sessiya 2: real API

- `.env`-ə `ODDS_API_KEY` yazıldı və `USE_MOCK_DATA=false` qoyuldu.
- `npm run verify:sports` işlədildi: 8 açarın hamısı aktivdir. `fixtures/sports.json` real cavabla yeniləndi.
- İlk real sinxron: 97 matç, 16 kredit (500 → 484), xəta yoxdur.
- Açıq məsələlər #1–4 yoxlanıb bağlandı:
  - heç-heçə `"Draw"` adlanır;
  - Ü/A 2.5 matçların 62%-ində mövcuddur;
  - `odds` çağırışı 2 kredit, `events` pulsuzdur.
- Story 1-1 `review` statusuna keçdi.
- Real datada Kuponlar və Matçlar səhifələri headless Chrome-da yoxlandı. Sistemin təklifləri: 78,2% / 69,6% / 50,3%, matç paylaşmırlar.

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
