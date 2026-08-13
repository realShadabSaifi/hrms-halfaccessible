import type { ProfileRole } from "@/lib/types";

export function roleForNewUser(existingProfileCount: number): ProfileRole {
  return existingProfileCount === 0 ? "admin" : "employee";
}
