export function computeDashboardStats(input: {
  pendingLeaves: number;
  upcomingHolidays: number;
  unreadAnnouncements: number;
}) {
  return [
    {
      label: "pending leaves",
      value: String(input.pendingLeaves),
      sub: input.pendingLeaves
        ? "waiting on your lead. patience."
        : "all clear. go touch grass.",
    },
    {
      label: "next holiday",
      value: String(input.upcomingHolidays),
      sub: "burgers on the calendar",
    },
    {
      label: "unread announcements",
      value: String(input.unreadAnnouncements),
      sub: input.unreadAnnouncements
        ? "one involves samosas. hurry."
        : "you're all caught up 😌",
    },
  ];
}

export function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] || "there";
}
