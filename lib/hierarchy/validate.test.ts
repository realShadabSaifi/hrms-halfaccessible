import { describe, expect, it } from "vitest";
import { unassignReports, validateManager, wouldCycle } from "./validate";

const people = [
  { id: "a", manager_id: null },
  { id: "b", manager_id: "a" },
  { id: "c", manager_id: "b" },
  { id: "d", manager_id: null },
];

describe("wouldCycle", () => {
  it("treats self as a cycle and walks the proposed manager chain", () => {
    expect(wouldCycle("a", "a", people)).toBe(true);
    expect(wouldCycle("a", "c", people)).toBe(true);
    expect(wouldCycle("b", "c", people)).toBe(true);
    expect(wouldCycle("c", "a", people)).toBe(false);
    expect(wouldCycle("d", "a", people)).toBe(false);
    expect(wouldCycle("a", null, people)).toBe(false);
  });
});

describe("validateManager", () => {
  it("allows unassign and a valid nest", () => {
    expect(validateManager("c", null, people)).toBeNull();
    expect(validateManager("d", "a", people)).toBeNull();
    expect(validateManager("c", "a", people)).toBeNull();
  });

  it("rejects unknown ids and loops", () => {
    expect(validateManager("z", "a", people)).toBe("unknown person");
    expect(validateManager("a", "z", people)).toBe("unknown person");
    expect(validateManager("a", "c", people)).toBe("that would loop the tree");
    expect(validateManager("a", "a", people)).toBe("that would loop the tree");
  });
});

describe("unassignReports", () => {
  it("clears manager_id on direct reports only", () => {
    const next = unassignReports(people, "a");
    expect(next.find((p) => p.id === "b")?.manager_id).toBeNull();
    expect(next.find((p) => p.id === "c")?.manager_id).toBe("b");
    expect(next.find((p) => p.id === "a")?.manager_id).toBeNull();
  });
});
