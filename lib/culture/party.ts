export const PARTY_VIBES = [
  "chill dinner",
  "full send",
  "picnic",
  "movie night",
];

export function validateParty(occasion: string): string | null {
  if (!occasion.trim()) return "a party needs an occasion (any excuse counts)";
  return null;
}
