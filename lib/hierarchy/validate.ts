export type HierarchyPerson = { id: string; manager_id: string | null };

export function wouldCycle(
  personId: string,
  managerId: string | null,
  people: HierarchyPerson[],
): boolean {
  if (managerId === null) return false;
  if (managerId === personId) return true;
  const byId = new Map(people.map((p) => [p.id, p]));
  const seen = new Set<string>();
  let cursor: string | null = managerId;
  while (cursor) {
    if (cursor === personId) return true;
    if (seen.has(cursor)) return true;
    seen.add(cursor);
    cursor = byId.get(cursor)?.manager_id ?? null;
  }
  return false;
}

export function validateManager(
  personId: string,
  managerId: string | null,
  people: HierarchyPerson[],
): string | null {
  if (!people.some((p) => p.id === personId)) return "unknown person";
  if (managerId !== null && !people.some((p) => p.id === managerId)) return "unknown person";
  if (wouldCycle(personId, managerId, people)) return "that would loop the tree";
  return null;
}

export function unassignReports<T extends HierarchyPerson>(people: T[], managerId: string): T[] {
  return people.map((p) => (p.manager_id === managerId ? { ...p, manager_id: null } : p));
}
