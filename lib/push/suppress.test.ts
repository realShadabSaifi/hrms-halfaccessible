import { describe, expect, it } from "vitest";
import { shouldSuppressNotification } from "./suppress";

describe("shouldSuppressNotification", () => {
  it("shows a ping when no client is focused on that url", () => {
    expect(shouldSuppressNotification({ focusedClientPaths: ["/leaves"], url: "/chat/c1" })).toBe(false);
    expect(shouldSuppressNotification({ focusedClientPaths: [], url: "/chat/c1" })).toBe(false);
  });

  it("stays quiet when the focused desktop tab is that thread", () => {
    expect(shouldSuppressNotification({ focusedClientPaths: ["/chat/c1"], url: "/chat/c1" })).toBe(true);
  });

  it("still pings if another chat is focused", () => {
    expect(shouldSuppressNotification({ focusedClientPaths: ["/chat/other"], url: "/chat/c1" })).toBe(false);
  });

  it("ignores query strings when matching a focused tab", () => {
    expect(shouldSuppressNotification({ focusedClientPaths: ["/chat/c1?x=1"], url: "/chat/c1" })).toBe(true);
  });
});
