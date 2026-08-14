const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export type NextHoliday = {
  holiday_on: string;
  title: string;
};

export function holidayCardValue(iso: string): string {
  const [, m, d] = iso.split("-").map(Number);
  return `${MONTHS[m - 1]} ${d}`;
}

export function pickNextHoliday(holidays: NextHoliday[], today: string): NextHoliday | null {
  const upcoming = holidays
    .filter((h) => h.holiday_on >= today)
    .sort((a, b) => a.holiday_on.localeCompare(b.holiday_on));
  return upcoming[0] ?? null;
}

export function computeDashboardStats(input: {
  pendingLeaves: number;
  nextHoliday: NextHoliday | null;
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
      value: input.nextHoliday ? holidayCardValue(input.nextHoliday.holiday_on) : "—",
      sub: input.nextHoliday ? input.nextHoliday.title : "none on the calendar",
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
