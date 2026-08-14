import type { ProfileRole } from "@/lib/types";

export function canDecideLeave(role: ProfileRole): boolean {
  return role === "lead" || role === "admin";
}

export function canViewTeamLeaves(role: ProfileRole): boolean {
  return canDecideLeave(role);
}

export function canDeleteAnonMessage(_role: string): boolean {
  return false;
}

export function canSelectTotpCredentials(actor: string): boolean {
  return actor === "service_role";
}

export function canInsertAnnouncement(role: ProfileRole): boolean {
  return role === "lead" || role === "admin";
}

export function canManageUsers(role: ProfileRole): boolean {
  return role === "admin";
}

export function canManageSettings(role: ProfileRole): boolean {
  return role === "admin";
}
