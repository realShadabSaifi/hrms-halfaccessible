export function validateDepartmentName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return "name required";
  if (trimmed.length > 40) return "name too long";
  return null;
}

export function departmentTaken(name: string, existingNames: string[]): boolean {
  const key = name.trim().toLowerCase();
  return existingNames.some((n) => n.trim().toLowerCase() === key);
}

export function removeDepartmentError(input: { inUseCount: number; totalCount: number }): string | null {
  if (input.inUseCount > 0) return "move people first";
  if (input.totalCount <= 1) return "keep at least one";
  return null;
}
