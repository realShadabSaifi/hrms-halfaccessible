import { describe, expect, it } from "vitest";
import { validatePushSubscription } from "./validate";

describe("validatePushSubscription", () => {
  it("rejects missing fields", () => {
    expect(validatePushSubscription({ endpoint: "" })).toEqual({ error: "bad subscription" });
    expect(validatePushSubscription({ endpoint: "https://push.example", keys: { p256dh: "x" } })).toEqual({
      error: "bad subscription",
    });
  });

  it("accepts a real-looking triple", () => {
    expect(
      validatePushSubscription({
        endpoint: "https://push.example/abc",
        keys: { p256dh: "p256", auth: "auth" },
      }),
    ).toEqual({ endpoint: "https://push.example/abc", p256dh: "p256", auth: "auth" });
  });
});
