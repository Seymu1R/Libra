import { describe, expect, it } from "vitest";
import { formatBaku, toApiIso } from "./time";

describe("time", () => {
  it("formats in Asia/Baku (UTC+4)", () => {
    expect(formatBaku("2026-10-21T15:45:00Z")).toBe("21.10.2026 19:45");
    expect(formatBaku("2026-12-31T21:30:00Z")).toBe("01.01.2027 01:30");
  });

  it("formats API ISO without milliseconds", () => {
    expect(toApiIso(new Date("2026-10-21T15:45:12.345Z"))).toBe("2026-10-21T15:45:12Z");
  });
});
