export function addUtcDay(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + 1);
  return dt.toISOString().slice(0, 10);
}

export function datesInRange(startsOn: string, endsOn: string): string[] {
  const out: string[] = [];
  let cur = startsOn;
  while (cur <= endsOn) {
    out.push(cur);
    cur = addUtcDay(cur);
  }
  return out;
}

export function overlappingHolidays(
  startsOn: string,
  endsOn: string,
  holidays: string[],
): string[] {
  const set = new Set(holidays);
  return datesInRange(startsOn, endsOn).filter((d) => set.has(d));
}
