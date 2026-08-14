export function buildTickerChips(input: {
  votingTitle: string | null;
  countdown: string | null;
  confirmed: string[];
  tripOpen: boolean;
}): string[] {
  const chips: string[] = [];
  if (input.votingTitle && input.countdown) {
    chips.push(`🍔 burger holiday vote closes in ${input.countdown}`);
  }
  for (const date of input.confirmed) {
    chips.push(`📅 ${date}`);
  }
  if (input.tripOpen) {
    chips.push("✈️ trip poll is open — vote in culture");
  }
  chips.push("💜 be nice, it's free");
  return chips;
}
