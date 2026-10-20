# Open Issues

- [ ] **Live sport-key check** — run `npm run verify:sports` once `ODDS_API_KEY` exists; report any ✘ to the owner.
- [ ] **O/U 2.5 coverage risk** — docs say totals are "mainly available for US sports and bookmakers". After the first real sync, check how many EU soccer matches reach `MIN_BOOKMAKERS` for OU25.
- [ ] **Soccer h2h outcome names** — code assumes team names + `"Draw"` (not shown literally in docs). Verify on the first real response.
- [ ] **Template overlap** — greedy by probability + DC + fill to maxLegs makes Sabit/Balanslı/Riskli nested subsets of the same top DC legs. Options for the owner: probability bands per type (e.g. Riskli legs 50–60%), or exclude legs already used by a safer template.
- [ ] **npm audit** — 5 high advisories in the dev-only ESLint chain (`eslint-config-next` → `fast-glob` → `micromatch` → `braces`); not shipped at runtime. Revisit when eslint-config-next updates.
