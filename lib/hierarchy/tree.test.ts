import { describe, expect, it } from "vitest";
import { buildTree, filterTree } from "./tree";

const zara = {
  id: "z",
  full_name: "Zara Khan",
  manager_id: null,
  designation: "Eng",
  department: "Engineering",
  skills: ["ts"],
};
const priya = {
  id: "p",
  full_name: "Priya Nair",
  manager_id: null,
  designation: "Design Lead",
  department: "Design",
  skills: ["Figma"],
};
const ananya = {
  id: "a",
  full_name: "Ananya Rao",
  manager_id: "p",
  designation: "PM",
  department: "Product",
  skills: ["Roadmaps"],
};
const ghost = {
  id: "g",
  full_name: "Ghost Report",
  manager_id: "missing",
  designation: "Ops",
  department: "HR",
  skills: [],
};

describe("buildTree", () => {
  it("makes multiple roots, nests children, and sorts by name", () => {
    const tree = buildTree([zara, ananya, priya]);
    expect(tree.map((n) => n.person.id)).toEqual(["p", "z"]);
    expect(tree[0].children.map((n) => n.person.id)).toEqual(["a"]);
  });

  it("treats a missing manager as a root", () => {
    const tree = buildTree([ghost, zara]);
    expect(tree.map((n) => n.person.id)).toEqual(["g", "z"]);
  });
});

describe("filterTree", () => {
  const tree = buildTree([zara, ananya, priya]);

  it("returns the full tree for an empty query", () => {
    expect(filterTree(tree, "  ").map((n) => n.person.id)).toEqual(["p", "z"]);
  });

  it("keeps ancestors of a match and drops non-matching branches", () => {
    const filtered = filterTree(tree, "ananya");
    expect(filtered.map((n) => n.person.id)).toEqual(["p"]);
    expect(filtered[0].children.map((n) => n.person.id)).toEqual(["a"]);
  });

  it("returns an empty list when nothing matches", () => {
    expect(filterTree(tree, "nope")).toEqual([]);
  });
});
