export type CxoRosterPerson = {
  id: string;
  full_name: string;
  role: string;
};

export function cxoNameFromRoster(id: string, people: CxoRosterPerson[]): string | null {
  const person = people.find((p) => p.id === id && p.role === "cxo");
  const name = person?.full_name.trim() ?? "";
  return name || null;
}

export function validateCxoPersonId(id: string, people: CxoRosterPerson[]): string | null {
  if (!id.trim() || !cxoNameFromRoster(id, people)) return "cxo required";
  return null;
}
