import { describe, expect, it } from "vitest";
import { oddsResponseSchema, sportsResponseSchema } from "./schemas";
import sports from "@/fixtures/sports.json";
import epl from "@/fixtures/odds/soccer_epl.json";

describe("odds api schemas", () => {
  it("accepts the sports fixture", () => {
    expect(sportsResponseSchema.parse(sports).length).toBeGreaterThan(0);
  });

  it("accepts an odds fixture", () => {
    const parsed = oddsResponseSchema.parse(epl);
    expect(parsed[0]?.bookmakers.length).toBeGreaterThan(0);
  });

  it("rejects an odds event without bookmakers", () => {
    expect(() =>
      oddsResponseSchema.parse([{ id: "x", sport_key: "s", commence_time: "t", home_team: "a", away_team: "b" }]),
    ).toThrow();
  });
});
