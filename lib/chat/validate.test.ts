import { describe, expect, it } from "vitest";
import {
  canRemoveGroupMember,
  dmKey,
  nextCreatorId,
  uniqueMemberIds,
  validateChatBody,
  validateDmTarget,
  validateGroupTitle,
} from "./validate";

describe("dmKey", () => {
  it("sorts uuids so the pair is stable", () => {
    expect(dmKey("b", "a")).toBe("a:b");
    expect(dmKey("a", "b")).toBe("a:b");
  });
});

describe("validateChatBody", () => {
  it("rejects empty and too long", () => {
    expect(validateChatBody("   ")).toBe("type something");
    expect(validateChatBody("x".repeat(2001))).toBe("that's a novel. 2000 chars max.");
    expect(validateChatBody("hey")).toBeNull();
  });
});

describe("validateGroupTitle", () => {
  it("rejects empty and too long", () => {
    expect(validateGroupTitle("  ")).toBe("group needs a name");
    expect(validateGroupTitle("x".repeat(61))).toBe("60 chars max.");
    expect(validateGroupTitle("eng squad")).toBeNull();
  });
});

describe("validateDmTarget", () => {
  it("blocks self, missing, inactive, and super_admin", () => {
    expect(validateDmTarget({ me: "a", other: { id: "a", active: true, role: "employee" } })).toBe("that's you");
    expect(validateDmTarget({ me: "a", other: null })).toBe("can't message them");
    expect(validateDmTarget({ me: "a", other: { id: "b", active: false, role: "employee" } })).toBe("can't message them");
    expect(validateDmTarget({ me: "a", other: { id: "b", active: true, role: "super_admin" } })).toBe("can't message them");
    expect(validateDmTarget({ me: "a", other: { id: "b", active: true, role: "employee" } })).toBeNull();
  });
});

describe("uniqueMemberIds", () => {
  it("always includes me and drops dupes", () => {
    expect(uniqueMemberIds("me", ["a", "me", "a", "b"])).toEqual(["me", "a", "b"]);
  });
});

describe("nextCreatorId", () => {
  it("keeps creator if someone else leaves", () => {
    expect(
      nextCreatorId({
        leavingId: "b",
        createdBy: "a",
        members: [
          { userId: "a", joinedAt: "2026-01-01T00:00:00Z" },
          { userId: "b", joinedAt: "2026-01-02T00:00:00Z" },
        ],
      }),
    ).toBe("a");
  });
  it("hands creator to earliest remaining member", () => {
    expect(
      nextCreatorId({
        leavingId: "a",
        createdBy: "a",
        members: [
          { userId: "a", joinedAt: "2026-01-01T00:00:00Z" },
          { userId: "c", joinedAt: "2026-01-03T00:00:00Z" },
          { userId: "b", joinedAt: "2026-01-02T00:00:00Z" },
        ],
      }),
    ).toBe("b");
  });
  it("returns null when the last member leaves", () => {
    expect(nextCreatorId({ leavingId: "a", createdBy: "a", members: [{ userId: "a", joinedAt: "2026-01-01T00:00:00Z" }] })).toBeNull();
  });
});

describe("canRemoveGroupMember", () => {
  it("only the group creator can remove someone else", () => {
    expect(canRemoveGroupMember({ actorId: "a", createdBy: "a", targetId: "b", kind: "group" })).toBe(true);
    expect(canRemoveGroupMember({ actorId: "a", createdBy: "a", targetId: "a", kind: "group" })).toBe(false);
    expect(canRemoveGroupMember({ actorId: "b", createdBy: "a", targetId: "c", kind: "group" })).toBe(false);
    expect(canRemoveGroupMember({ actorId: "a", createdBy: "a", targetId: "b", kind: "dm" })).toBe(false);
  });
});
