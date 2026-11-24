import type { ProfileRole } from "@/lib/types";

export function afterAuthPath(role: ProfileRole): "/settings" | "/" {
  return role === "super_admin" ? "/settings" : "/";
}

/** Invoicing and expenses are for CXOs only. */
export function isCxoOnlyPath(path: string): boolean {
  return ["/invoices", "/expenses"].some((p) => path === p || path.startsWith(`${p}/`));
}

export function canVisitPath(role: ProfileRole, path: string): boolean {
  if (role === "super_admin") {
    return path === "/settings" || path === "/users" || path === "/holidays";
  }
  if (path === "/settings") return false;
  if (isCxoOnlyPath(path)) return role === "cxo";
  if (path === "/users") return role === "admin" || role === "cxo";
  if (path === "/cxo/manage") return role === "admin" || role === "cxo";
  return true;
}
