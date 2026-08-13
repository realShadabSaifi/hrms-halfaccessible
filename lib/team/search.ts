export type SearchableMember = {
  full_name: string;
  designation: string;
  department: string;
  skills: string[];
};

export function matchesMember(member: SearchableMember, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const hay = [member.full_name, member.designation, member.department, ...member.skills]
    .join(" ")
    .toLowerCase();
  return hay.includes(q);
}
