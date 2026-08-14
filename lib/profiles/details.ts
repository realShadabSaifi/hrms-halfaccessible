export const AVATAR_SWATCHES = ["#7048B6", "#0E9488", "#D97706", "#DB2777", "#0284C7", "#65A30D"] as const;

export type ProfileDetails = {
  full_name: string;
  designation: string;
  department: string;
  skills: string[];
  bio: string;
  avatar_color: string;
};

export function validateProfileDetails(input: ProfileDetails, departments: string[]): string | null {
  const name = input.full_name.trim();
  if (!name) return "name required";
  if (name.length > 80) return "name too long";
  if (input.designation.trim().length > 80) return "title too long";
  if (!departments.includes(input.department)) return "invalid department";
  const skills = input.skills.map((s) => s.trim()).filter(Boolean);
  if (skills.length > 12) return "too many skills";
  if (skills.some((s) => s.length > 40)) return "skill too long";
  if (input.bio.length > 280) return "bio too long";
  if (!AVATAR_SWATCHES.includes(input.avatar_color as (typeof AVATAR_SWATCHES)[number])) {
    return "invalid color";
  }
  return null;
}

export function parseSkills(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
