import { describe, expect, it } from "vitest";
import { buildTickerChips } from "./ticker";

describe("buildTickerChips", () => {
  it("builds live chips and always includes the vibe line", () => {
    expect(
      buildTickerChips({
        votingTitle: "pre–Teacher's Day recharge",
        countdown: "26h",
        confirmed: ["Fri, Sep 4"],
        tripOpen: true,
      }),
    ).toEqual([
      "🍔 burger holiday vote closes in 26h",
      "📅 Fri, Sep 4",
      "✈️ trip poll is open — vote in culture",
      "💜 be nice, it's free",
    ]);
  });

  it("omits empty live chips", () => {
    expect(
      buildTickerChips({
        votingTitle: null,
        countdown: null,
        confirmed: [],
        tripOpen: false,
      }),
    ).toEqual(["💜 be nice, it's free"]);
  });
});
