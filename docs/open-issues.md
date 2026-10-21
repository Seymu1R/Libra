# Açıq məsələlər

Son yenilənmə: **2026-10-21**. Həll olunan məsələ `[x]` ilə işarələnir, tarix və qısa izah əlavə olunur (silinmir).

## 🔴 Bloklayan — API açarı gəldikdən sonra

- [ ] **1. Turnir açarlarının real yoxlanması.** 8 açar rəsmi sənəddən götürülüb, hələ real API ilə yoxlanmayıb.
  `.env`-ə `ODDS_API_KEY` əlavə et, sonra `npm run verify:sports` işlət (pulsuzdur). ✘ çıxan turnir olsa, sahibinə bildir, açarı təxmin etmə.
  Bu skript `fixtures/sports.json`-u real cavabla əvəz edir; hazırkı fayl sənəd formatında əl ilə yazılıb.
- [ ] **2. Ü/A 2.5 bazarının əhatəsi.** Sənəddə deyilir ki, `totals` "əsasən ABŞ idmanları və bukmekerləri üçündür".
  İlk real sinxrondan sonra yoxla: Avropa futbolunda neçə matçda Ü/A 2.5 `MIN_BOOKMAKERS`-ə (8) çatır.
  Çox az matç çatırsa, sahibi ilə danış. Həll yolları: bu bazar üçün ayrıca hədd və ya başqa region.
- [ ] **3. Heç-heçənin adı.** Kod 1X2 nəticələrini komanda adları və `"Draw"` kimi oxuyur, amma sənəddə bu ad dəqiq göstərilməyib.
  İlk real cavabda yoxla. Ad başqadırsa, bütün matçlar "analiz edilmədi" kimi görünəcək. Düzəliş yeri: `lib/analysis/book-prices.ts` → `h2hBooks`.
- [ ] **4. Kredit hesabı.** Gözlənilən xərc turnir başına 2 kreditdir. İlk real sinxrondan sonra `x-requests-last` header-i ilə təsdiqlə.
  `ApiCallLog` cədvəlinə baxmaq üçün: `npm run db:studio`.

## 🟡 Sahibinin qərarı lazımdır

- [x] **5. Kupon şablonları üst-üstə düşür.** ✅ 2026-10-21 həll olundu: sahibi (b) variantını seçdi — Sabit/Balanslı/Riskli matç paylaşmır (Story 7.1). Test datasında: 77,2% / 60,1% / 25,0%. Köhnə izah: Greedy seçim + ikili şans + `maxLegs`-ə qədər doldurma birlikdə belə nəticə verir:
  Riskli ⊇ Balanslı ⊇ Sabit, yəni hamısı eyni ən yüksək ehtimallı ikili şans seçimlərindən ibarətdir.
  Test datasında: Sabit 77,2% · Balanslı 69,2% · Riskli 53,9%. Seçimlər eyni matçlardandır, sadəcə sayı fərqlidir.
  Variantlar:
  - (a) hər tip üçün ehtimal **aralığı** (məs. Riskli 50–60%, Balanslı 60–70%, Sabit ≥ 70%);
  - (b) daha təhlükəsiz şablonda istifadə olunan matçı növbəti şablonda **təkrar etməmək**;
  - (c) ikili şansı yalnız Sabit-də saxlamaq.
  Dəyişiklik yeri: `lib/config.ts` (`TEMPLATES`) və `lib/templates/build.ts`.
- [ ] **14. Baza bir neçə kompüterdə paylaşılmır.** `prisma/dev.db` (SQLite) lokal fayldır və git-ə düşmür. Hər kompüterdə ayrı, boş baza olur.
  Test rejimində problem deyil. Real API-dən sonra isə vacib olacaq: sinxronlar kredit xərcləyir, Phase 2 kalibrləməsi isə həftələrlə toplanmış tarixçə tələb edir.
  **Təklif:** real API-yə keçəndə pulsuz hosted PostgreSQL-ə (Neon / Supabase) keçmək. Bir neçə yerdə dəyişiklik lazımdır:
  - `prisma/schema.prisma` → `provider = "postgresql"`;
  - `server/db.ts` → `@prisma/adapter-pg`;
  - `.env` → yeni `DATABASE_URL`;
  - yeni miqrasiya.
  Sxem artıq Postgres-ə uyğundur. `.db` faylını git-ə qoymaq tövsiyə edilmir: binardır, iki kompüterdə dəyişsə birləşdirmək olmur.
- [ ] **6. `AGENTS.md`.** Bu faylı `next dev` avtomatik yaradır (Next 16-nın agentlər üçün qeydi) və repo-ya commit olunub.
  Saxlamaq və ya `next.config.ts`-də `agentRules: false` qoyub söndürmək — sahibi qərar verməlidir.

## 🟢 Texniki borc / proses

- [ ] **7. Story-lər `review` statusundadır.** Epic 0–5-in bütün story-ləri `sprint-status.yaml`-da `review`-dadır.
  Code review (`/bmad-code-review` və ya `/code-review`) edilməli, sonra `done` statusuna keçməlidir.
- [ ] **8. BMAD story və spec faylları yoxdur.** Epic 0–5 bir dəfəyə yazılıb, hər story üçün ayrıca fayl yaradılmayıb.
  Yalnız ümumi qeyd var: `_bmad-output/implementation-artifacts/implementation-log-2026-10-20.md`.
  Yeni story-lər (Epic 6-dan başlayaraq) BMAD qaydası ilə yazılmalıdır: story faylı + spec faylı.
- [ ] **9. E2E testlər yoxdur.** Hazırda 52 unit və servis testi var. UI yalnız əl ilə və screenshot ilə yoxlanıb.
  Playwright ilə əsas axın üçün test yazmaq olar: sinxron → matçlar → kupon → fərdi kupon.
- [ ] **10. `npm audit`: 5 yüksək səviyyəli xəbərdarlıq.** Hamısı yalnız inkişaf alətlərindədir (`eslint-config-next` → `fast-glob` → `micromatch` → `braces`).
  İşləyən tətbiqə düşmür. `eslint-config-next` yeniləndikdə yenidən bax.
- [x] **11. Port 3000 məşğul ola bilər.** ✅ 2026-10-21: port 4019-a sabitləndi (`npm run dev` / `npm start`). Köhnə izah: Seymur-un kompüterində 3000-i `rifah-api-gateway` tutur.
  Belə olanda Next özü başqa port seçir (məs. 3004), ona görə terminalda göstərilən linkə bax.

- [ ] **15. Fərdi kupon bölməsinin yenilənməsi.** Sahibi bu bölməni sonra yeniləmək istəyir (2026-10-21).
  Hazırda təkrar qaydası bu bölməyə tətbiq olunmur: istənilən matçı seçmək olur. Amma burada saxlanan kuponlar da matçları bloklayır.
- [ ] **16. Generatorun "ən az seçim" xüsusiyyəti.** Aşağı hədəfə (məs. 10%) generator 2 seçimlə çatmağa çalışır, yəni hər seçim ~30% olur.
  Sahibi daha çox, amma daha yüksək ehtimallı seçim istəsə, `GENERATOR.minLegs` / `minLegProbability` (`lib/config.ts`) dəyişdirilə bilər
  və ya seçim sayı üçün input əlavə oluna bilər.

## ⚪ Gələcək (Epic 6 — Phase 2)

- [ ] **12. Final hesablar və kupon nəticələri.** `/v4/sports/{sport}/scores?daysFrom=1..3` endpoint-i lazımdır.
  Xərc: `daysFrom` ilə 2 kredit. Hesab **string** kimi gəlir. Sxem artıq hazırdır: `Match.homeScore/awayScore/completed`, `Template.status/settledAt`, `TemplateLeg.result`.
- [ ] **13. Kalibrləmə görünüşü.** Sual budur: ehtimalı ~X% olan kuponlar həqiqətən ~X% hallarda keçirmi? Ehtimal aralıqlarına görə qazanma faizi göstərilməlidir.
