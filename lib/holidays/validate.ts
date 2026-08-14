export const HOLIDAY_TITLE_MAX = 40;

export function validateHolidayDate(iso: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "date required";
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) {
    return "invalid date";
  }
  return null;
}

export function validateHolidayTitle(title: string): string | null {
  const trimmed = title.trim();
  if (!trimmed) return "name required";
  if (trimmed.length > HOLIDAY_TITLE_MAX) return "name too long";
  return null;
}

export function holidayDateTaken(iso: string, existingDates: string[]): boolean {
  return existingDates.includes(iso);
}
