import { describe, expect, it } from "vitest";
import { describeSelection, selectionLabel } from "./labels";

describe("selection labels", () => {
  it("over/under labels follow the market's line", () => {
    expect(selectionLabel("OU25", "OVER")).toBe("Üst 2.5");
    expect(selectionLabel("OU35", "UNDER")).toBe("Alt 3.5");
    expect(selectionLabel("OU45", "OVER")).toBe("Üst 4.5");
    expect(describeSelection("OU35", "OVER", "A", "B")).toBe("3.5-dən çox qol");
  });

  it("other selections are unchanged", () => {
    expect(selectionLabel("1X2", "HOME")).toBe("1");
    expect(selectionLabel("DC", "X2")).toBe("X2");
    expect(describeSelection("1X2", "HOME", "Arsenal", "Chelsea")).toBe("Arsenal qalib");
  });
});
