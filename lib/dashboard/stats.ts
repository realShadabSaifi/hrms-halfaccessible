export function computeDashboardStats(input: {
  pendingLeaves: number;
  upcomingHolidays: number;
  unreadAnnouncements: number;
}) {
  return [
    { label: "pending leaves", value: String(input.pendingLeaves), sub: "waiting on a human" },
    { label: "upcoming holidays", value: String(input.upcomingHolidays), sub: "burgers on the calendar" },
    { label: "unread news", value: String(input.unreadAnnouncements), sub: "announcements to catch" },
  ];
}

export function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] || "there";
}
