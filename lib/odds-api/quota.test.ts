import { describe, expect, it } from "vitest";
import { parseQuotaHeaders } from "./quota";

describe("parseQuotaHeaders", () => {
  it("parses numeric headers", () => {
    const h = new Headers({ "x-requests-remaining": "484", "x-requests-used": "16", "x-requests-last": "2" });
    expect(parseQuotaHeaders(h)).toEqual({ remaining: 484, used: 16, last: 2 });
  });

  it("returns null for missing or non-numeric values", () => {
    const h = new Headers({ "x-requests-remaining": "abc" });
    expect(parseQuotaHeaders(h)).toEqual({ remaining: null, used: null, last: null });
  });
});
