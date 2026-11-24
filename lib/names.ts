export function firstName(name: string): string {
  return name.trim().split(/\s+/).filter(Boolean)[0] ?? "";
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** "Designer · Design", without a dangling separator when either part is blank. */
export function jobLine(designation: string | null | undefined, department: string | null | undefined): string {
  return [designation, department].map((s) => (s ?? "").trim()).filter(Boolean).join(" · ");
}

/** "1 slot", "3 slots". */
export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

const ROLE_LABELS: Record<string, string> = {
  employee: "employee",
  lead: "team lead",
  admin: "admin",
  super_admin: "super admin",
  cxo: "CXO",
};

export function roleLabel(role: string): string {
  return ROLE_LABELS[role] ?? role.replace(/_/g, " ");
}
