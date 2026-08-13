const hits = new Map<string, { n: number; reset: number }>();

export function rateLimit(key: string, max = 8, windowMs = 60_000): boolean {
  const now = Date.now();
  const row = hits.get(key);
  if (!row || now > row.reset) {
    hits.set(key, { n: 1, reset: now + windowMs });
    return true;
  }
  if (row.n >= max) return false;
  row.n += 1;
  return true;
}
