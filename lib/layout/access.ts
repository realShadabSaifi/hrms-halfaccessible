import type { ProfileRole } from "@/lib/types";

export function afterAuthPath(role: ProfileRole): "/settings" | "/" {
  return role === "super_admin" ? "/settings" : "/";
}

export function canVisitPath(role: ProfileRole, path: string): boolean {
  if (role === "super_admin") {
    return path === "/settings" || path === "/users" || path === "/holidays";
  }
  if (path === "/settings") return false;
  if (path === "/users") return role === "admin";
  return true;
}
