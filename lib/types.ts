export type ProfileRole = "employee" | "lead" | "admin";

export type Profile = {
  id: string;
  full_name: string;
  designation: string;
  department: string;
  skills: string[];
  bio: string;
  avatar_color: string;
  role: ProfileRole;
  active: boolean;
  joined_at: string;
  totp_verified_at: string | null;
  ann_seen_at: string | null;
};

export type LeaveType = "sick" | "personal" | "festival" | "emergency" | "other";
export type LeaveStatus = "pending" | "approved" | "rejected";
export type HolidayStatus = "voting" | "approved" | "rejected";
