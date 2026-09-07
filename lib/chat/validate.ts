import type { ProfileRole } from "@/lib/types";

export const CHAT_BODY_MAX = 2000;
export const CHAT_TITLE_MAX = 60;
export const CHAT_SEND_RATE_MAX = 30;
export const CHAT_SEND_RATE_WINDOW_MS = 60_000;

export function dmKey(a: string, b: string): string {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}

export function validateChatBody(raw: string): string | null {
  const body = raw.trim();
  if (!body) return "type something";
  if (body.length > CHAT_BODY_MAX) return "that's a novel. 2000 chars max.";
  return null;
}

export function validateGroupTitle(raw: string): string | null {
  const title = raw.trim();
  if (!title) return "group needs a name";
  if (title.length > CHAT_TITLE_MAX) return "60 chars max.";
  return null;
}

export function validateDmTarget(input: {
  me: string;
  other: { id: string; active: boolean; role: ProfileRole } | null;
}): string | null {
  if (!input.other || !input.other.active || input.other.role === "super_admin") return "can't message them";
  if (input.other.id === input.me) return "that's you";
  return null;
}

export function uniqueMemberIds(me: string, ids: string[]): string[] {
  return [me, ...ids.filter((id) => id && id !== me && ids.includes(id))].filter(
    (id, i, all) => all.indexOf(id) === i,
  );
}

export function nextCreatorId(input: {
  leavingId: string;
  createdBy: string;
  members: { userId: string; joinedAt: string }[];
}): string | null {
  const remaining = input.members
    .filter((m) => m.userId !== input.leavingId)
    .sort((a, b) => a.joinedAt.localeCompare(b.joinedAt) || a.userId.localeCompare(b.userId));
  if (input.leavingId !== input.createdBy) return input.createdBy;
  return remaining[0]?.userId ?? null;
}

export function canRemoveGroupMember(input: {
  actorId: string;
  createdBy: string;
  targetId: string;
  kind: "dm" | "group";
}): boolean {
  return input.kind === "group" && input.actorId === input.createdBy && input.targetId !== input.actorId;
}
