export const CHAT_PREVIEW_MAX = 120;

export function chatPreview(body: string, max = CHAT_PREVIEW_MAX): string {
  const text = body.trim();
  return text.length <= max ? text : text.slice(0, max);
}

export function isUnreadMessage(input: {
  senderId: string;
  createdAt: string;
  me: string;
  lastReadAt: string | null;
}): boolean {
  if (input.senderId === input.me) return false;
  if (!input.lastReadAt) return true;
  return input.createdAt > input.lastReadAt;
}

export function unreadConversationCount(rows: { unread: number }[]): number {
  return rows.filter((r) => r.unread > 0).length;
}
