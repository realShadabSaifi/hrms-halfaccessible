export function resolveHoliday(input: {
  yes: number;
  no: number;
  now: number;
  closesAt: number;
}): "voting" | "approved" | "rejected" {
  if (input.now < input.closesAt) return "voting";
  return input.yes > input.no ? "approved" : "rejected";
}

export function votePercent(yes: number, no: number): number {
  const total = yes + no;
  return total ? Math.round((yes / total) * 100) : 50;
}
