import { isValidEmail } from "@/lib/auth/email";
import type { ProfileRole } from "@/lib/types";

export function validateInvite(input: {
  fullName: string;
  email: string;
  role: ProfileRole;
}): string | null {
  if (!input.fullName.trim()) return "name required";
  if (!isValidEmail(input.email)) return "invalid_email";
  return null;
}
