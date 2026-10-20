# ⚖️ Tərəzi

Futbol üzrə bir çox bukmekerin matçdan əvvəlki əmsallarını yükləyən, onlardan **bazarın konsensus (marjasız) ehtimallarını**
hesablayan və yalnız baxış üçün **kupon şablonları** quran şəxsi, lokal veb tətbiq.

> Tətbiq mərc qoymur, canlı (in-play) funksiyası yoxdur. Ehtimallar bazarın təxminidir, zəmanət deyil.

## Tələblər

- Node.js 22+
- (İstəyə görə) [The Odds API](https://the-odds-api.com) açarı — pulsuz plan kifayətdir

## Quraşdırma

```bash
npm install                 # asılılıqlar + Prisma client
cp .env.example .env        # sonra .env faylını redaktə edin
npx prisma migrate dev      # SQLite bazasını yaradır (prisma/dev.db)
npm run dev                 # http://localhost:3000
```

### `.env` dəyişənləri

| Dəyişən | Təsvir |
|---|---|
| `ODDS_API_KEY` | The Odds API açarı. Yalnız serverdə istifadə olunur, brauzerə heç vaxt göndərilmir. |
| `USE_MOCK_DATA` | `true` → real API əvəzinə `fixtures/` qovluğundakı test məlumatı (kredit xərclənmir). |
| `DATABASE_URL` | SQLite faylı: `file:./prisma/dev.db` |

## API açarını əlavə etmək (sonradan)

1. https://the-odds-api.com saytında qeydiyyatdan keçin (pulsuz plan: ayda 500 kredit) və açarı e-poçtdan götürün.
2. `.env` faylında: `ODDS_API_KEY=sizin_açar` və `USE_MOCK_DATA=false`.
3. Turnir açarlarını yoxlayın (pulsuz, kredit xərcləmir):
   ```bash
   npm run verify:sports
   ```
   8 turnirin hər biri üçün ✔ / • / ✘ göstərir və `fixtures/sports.json` faylını real cavabla yeniləyir.
4. Serveri yenidən başladın (`npm run dev`) və **“Sinxron et”** düyməsini basın.

### Kredit xərci

- `/v4/sports` və `/v4/sports/{turnir}/events` — **pulsuz**.
- `/v4/sports/{turnir}/odds` — `bazar sayı × region sayı` = `2 × 1` = **2 kredit / turnir**.
- Tətbiq əvvəlcə pulsuz `events` sorğusu ilə yoxlayır: həmin turnirdə yaxın 7 gündə matç yoxdursa, pullu sorğu göndərilmir.
- Tam sinxron (8 turnir) ≈ **16 kredit**. Pulsuz planla ayda ~30 tam sinxron.
- İki sinxron arasında ən azı 30 dəqiqə gözləmə var (`lib/config.ts`).

## İstifadə

- **Matçlar** — turnirlər üzrə qruplaşdırılmış matçlar: 1X2, ikili şans (1X2-dən hesablanır), Üst/Alt 2.5;
  hər seçim üçün konsensus ehtimalı, ədalətli əmsal, ən yaxşı əmsal + bukmeker, fikir ayrılığı (± faiz bəndi).
- **Kuponlar** — Sabit / Balanslı / Riskli şablonları və öz seçimlərinizlə fərdi kupon.
  “Yenidən hesabla” saxlanmış məlumatdan hesablayır — API çağırılmır.

## Necə hesablanır

1. Hər bukmeker üçün `1/əmsal` → bazarın cəmi 1 olacaq şəkildə normallaşdırılır (marja çıxarılır).
2. Hər seçim üçün bukmekerlərin ədalətli ehtimallarının **medianı** götürülür, sonra yenidən normallaşdırılır.
3. Fikir ayrılığı = bukmekerlər arasında max − min.
4. `MIN_BOOKMAKERS`-dən (8) az bukmekeri olan bazar/matç analiz edilmir.
5. Kupon ehtimalı = ayaqların hasili (nəticələrin asılı olmadığı fərz edilir), ədalətli əmsal = 1 / ehtimal.

Bütün hədlər: [`lib/config.ts`](lib/config.ts).

## Əmrlər

| Əmr | Təsvir |
|---|---|
| `npm run dev` | İnkişaf serveri |
| `npm test` | Unit testlər (Vitest) |
| `npm run typecheck` / `npm run lint` | TypeScript / ESLint yoxlaması |
| `npm run verify:sports` | Turnir açarlarını real API ilə yoxlamaq (pulsuz) |
| `npm run fixtures:generate` | Test məlumatını yenidən yaratmaq |
| `npm run db:studio` | Bazaya baxmaq (Prisma Studio) |

## Struktur

```
app/          səhifələr + API route-lar (nazik qat)
components/   UI komponentləri
server/       Prisma, API client, sinxron / analiz / kupon servisləri
lib/          təmiz TypeScript: analiz, kuponlar, konfiqurasiya (tam test olunur)
fixtures/     test üçün API cavabları
prisma/       sxem və miqrasiyalar
_bmad-output/ plan, arxitektura, epiklər, sprint statusu
```

PostgreSQL-ə keçid: `prisma/schema.prisma`-da `provider = "postgresql"`, `server/db.ts`-də adapteri `@prisma/adapter-pg` ilə əvəz edin.
