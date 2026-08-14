import { matchesMember, type SearchableMember } from "@/lib/team/search";
import type { HierarchyPerson } from "./validate";

export type TreeNode<T> = { person: T; children: TreeNode<T>[] };

export function buildTree<T extends HierarchyPerson & { full_name: string }>(people: T[]): TreeNode<T>[] {
  const ids = new Set(people.map((p) => p.id));
  const kids = new Map<string, T[]>();
  const roots: T[] = [];
  for (const person of people) {
    if (person.manager_id && ids.has(person.manager_id)) {
      const list = kids.get(person.manager_id) ?? [];
      list.push(person);
      kids.set(person.manager_id, list);
    } else {
      roots.push(person);
    }
  }
  const byName = (a: T, b: T) => a.full_name.localeCompare(b.full_name);
  function node(person: T): TreeNode<T> {
    return {
      person,
      children: (kids.get(person.id) ?? []).slice().sort(byName).map(node),
    };
  }
  return roots.slice().sort(byName).map(node);
}

export function filterTree<T extends HierarchyPerson & SearchableMember>(
  nodes: TreeNode<T>[],
  query: string,
): TreeNode<T>[] {
  if (!query.trim()) return nodes;
  const out: TreeNode<T>[] = [];
  for (const n of nodes) {
    const children = filterTree(n.children, query);
    if (children.length > 0 || matchesMember(n.person, query)) {
      out.push({ person: n.person, children });
    }
  }
  return out;
}
