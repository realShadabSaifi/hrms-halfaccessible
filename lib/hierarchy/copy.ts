import { firstName } from "@/lib/names";

export function managerToast(personName: string, managerName: string | null): string {
  const person = firstName(personName);
  if (!managerName) return `${person} is a root`;
  return `${person} now reports to ${firstName(managerName)}`;
}
