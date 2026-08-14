export type ProfileRole = "employee" | "lead" | "admin" | "super_admin";

export type Profile = {
  id: string;
  manager_id: string | null;
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

export type AppSettings = {
  app_name: string;
  logo_path: string | null;
  logo_url: string | null;
};

export type Department = {
  id: string;
  name: string;
  sort: number;
};

export type CompanyHoliday = {
  id: string;
  holiday_on: string;
  title: string;
  created_by: string | null;
  created_at: string;
};
