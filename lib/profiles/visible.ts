import type { ProfileRole } from "@/lib/types";

export function isVisiblePerson(role: ProfileRole): boolean {
  return role !== "super_admin";
}
