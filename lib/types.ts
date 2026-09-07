export type ProfileRole = "employee" | "lead" | "admin" | "super_admin" | "cxo";

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

export type ConversationKind = "dm" | "group";

export type Conversation = {
  id: string;
  kind: ConversationKind;
  title: string;
  dm_key: string | null;
  created_by: string;
  created_at: string;
  last_message_at: string;
};

export type ConversationMember = {
  conversation_id: string;
  user_id: string;
  joined_at: string;
  last_read_at: string | null;
};

export type ChatMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

export type InboxRow = {
  id: string;
  kind: ConversationKind;
  title: string;
  avatarName: string;
  avatarColor: string;
  lastPreview: string;
  lastAt: string;
  unread: number;
  otherUserId: string | null;
};
