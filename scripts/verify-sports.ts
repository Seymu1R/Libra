// Story 1.1 — confirm the 8 competition keys against a live /v4/sports call (free, costs no credits).
// Run: npm run verify:sports   (requires ODDS_API_KEY in .env)
import "dotenv/config";
import { writeFileSync } from "node:fs";
import { COMPETITIONS } from "../lib/config";
import { recordApiCall } from "../server/api-call-log";
import { HttpOddsClient } from "../server/odds-client";

async function main() {
  const key = process.env.ODDS_API_KEY;
  if (!key) {
    console.error("ODDS_API_KEY yoxdur. .env faylına əlavə edin.");
    process.exit(1);
  }
  const client = new HttpOddsClient(key, recordApiCall);
  const { data, quota } = await client.getSports(true);

  let missing = 0;
  for (const c of COMPETITIONS) {
    const s = data.find((x) => x.key === c.key);
    if (!s) missing++;
    console.log(`${s ? (s.active ? "✔ aktiv   " : "• mövsümdən kənar") : "✘ TAPILMADI"}  ${c.key}  (${s?.title ?? c.name})`);
  }
  const otherSoccer = data.filter((s) => s.group === "Soccer" && !COMPETITIONS.some((c) => c.key === s.key));
  console.log(`\nDigər futbol açarları (${otherSoccer.length}): ${otherSoccer.map((s) => s.key).join(", ")}`);
  console.log(`Qalan kredit: ${quota.remaining ?? "?"}`);

  writeFileSync("fixtures/sports.json", JSON.stringify(data, null, 2) + "\n");
  console.log("fixtures/sports.json real cavabla yeniləndi.");
  if (missing > 0) process.exit(2);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
