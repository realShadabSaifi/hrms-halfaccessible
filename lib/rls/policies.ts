import type { ProfileRole } from "@/lib/types";

export const ADMIN_ROLES: ProfileRole[] = ["admin"];
export const LEAD_OR_ADMIN_ROLES: ProfileRole[] = ["lead", "admin"];

export function isAdminRole(role: ProfileRole): boolean {
  return role === "admin";
}

export function isSuperAdmin(role: ProfileRole): boolean {
  return role === "super_admin";
}

export function canDecideLeave(role: ProfileRole): boolean {
  return role === "lead" || isAdminRole(role);
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
  return role === "lead" || isAdminRole(role);
}

export function canManageUsers(role: ProfileRole): boolean {
  return isAdminRole(role);
}

export function canManageSettings(role: ProfileRole): boolean {
  return isSuperAdmin(role);
}
