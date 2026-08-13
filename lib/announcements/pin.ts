export type Pinnable = { pinned: boolean; created_at: string };

export function sortAnnouncements<T extends Pinnable>(list: T[]): T[] {
  return [...list].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return +new Date(b.created_at) - +new Date(a.created_at);
  });
}
