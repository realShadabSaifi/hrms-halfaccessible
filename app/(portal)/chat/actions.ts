"use server";

import { requireProfile } from "@/lib/auth";
import {
  CHAT_SEND_RATE_MAX,
  CHAT_SEND_RATE_WINDOW_MS,
  canRemoveGroupMember,
  dmKey,
  nextCreatorId,
  uniqueMemberIds,
  validateChatBody,
  validateDmTarget,
  validateGroupTitle,
} from "@/lib/chat/validate";
import { notifyChatMessage } from "@/lib/push/notify";
import { rateLimit } from "@/lib/rateLimit";
import { canUseChat } from "@/lib/rls/policies";
import { createClient } from "@/lib/supabase/server";
import type { ConversationKind, ProfileRole } from "@/lib/types";

async function actor() {
  const profile = await requireProfile();
  if (!canUseChat(profile.role)) return { ok: false as const, error: "not in that chat" };
  return { ok: true as const, profile, supabase: await createClient() };
}

export async function openDm(otherUserId: string) {
  const gate = await actor();
  if (!gate.ok) return gate;
  const { profile, supabase } = gate;
  const { data: other } = await supabase
    .from("profiles")
    .select("id, active, role")
    .eq("id", otherUserId)
    .maybeSingle();
  const invalid = validateDmTarget({
    me: profile.id,
    other: other as { id: string; active: boolean; role: ProfileRole } | null,
  });
  if (invalid) return { ok: false as const, error: invalid };
  const key = dmKey(profile.id, otherUserId);
  const { data: existing } = await supabase.from("conversations").select("id").eq("dm_key", key).maybeSingle();
  if (existing) return { ok: true as const, id: existing.id };
  const { data: created, error } = await supabase
    .from("conversations")
    .insert({ kind: "dm", title: "", dm_key: key, created_by: profile.id })
    .select("id")
    .single();
  if (error) {
    const { data: raced } = await supabase.from("conversations").select("id").eq("dm_key", key).maybeSingle();
    if (raced) return { ok: true as const, id: raced.id };
    return { ok: false as const, error: error.message };
  }
  const { error: memberError } = await supabase.from("conversation_members").insert([
    { conversation_id: created.id, user_id: profile.id },
    { conversation_id: created.id, user_id: otherUserId },
  ]);
  if (memberError) return { ok: false as const, error: memberError.message };
  return { ok: true as const, id: created.id };
}

export async function createGroup(title: string, memberIds: string[]) {
  const gate = await actor();
  if (!gate.ok) return gate;
  const { profile, supabase } = gate;
  const invalid = validateGroupTitle(title);
  if (invalid) return { ok: false as const, error: invalid };
  const ids = uniqueMemberIds(profile.id, memberIds);
  const { data: created, error } = await supabase
    .from("conversations")
    .insert({ kind: "group", title: title.trim(), dm_key: null, created_by: profile.id })
    .select("id")
    .single();
  if (error || !created) return { ok: false as const, error: error?.message ?? "not in that chat" };
  const { error: memberError } = await supabase
    .from("conversation_members")
    .insert(ids.map((user_id) => ({ conversation_id: created.id, user_id })));
  if (memberError) return { ok: false as const, error: memberError.message };
  return { ok: true as const, id: created.id };
}

export async function sendMessage(conversationId: string, body: string) {
  const gate = await actor();
  if (!gate.ok) return gate;
  const { profile, supabase } = gate;
  const invalid = validateChatBody(body);
  if (invalid) return { ok: false as const, error: invalid };
  if (!rateLimit(`chat:${profile.id}`, CHAT_SEND_RATE_MAX, CHAT_SEND_RATE_WINDOW_MS)) {
    return { ok: false as const, error: "slow down" };
  }
  const { data: membership } = await supabase
    .from("conversation_members")
    .select("user_id")
    .eq("conversation_id", conversationId)
    .eq("user_id", profile.id)
    .maybeSingle();
  if (!membership) return { ok: false as const, error: "not in that chat" };
  const { data: inserted, error } = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, sender_id: profile.id, body: body.trim() })
    .select("id")
    .single();
  if (error || !inserted) return { ok: false as const, error: error?.message ?? "not in that chat" };
  const [{ data: convo }, { data: members }] = await Promise.all([
    supabase.from("conversations").select("title, kind").eq("id", conversationId).maybeSingle(),
    supabase.from("conversation_members").select("user_id").eq("conversation_id", conversationId),
  ]);
  void notifyChatMessage({
    conversationId,
    senderId: profile.id,
    senderName: profile.full_name,
    groupTitle: convo?.kind === "group" ? convo.title : null,
    body: body.trim(),
    memberIds: (members ?? []).map((m) => m.user_id),
  }).catch(() => {});
  return { ok: true as const, id: inserted.id };
}

export async function markRead(conversationId: string) {
  const gate = await actor();
  if (!gate.ok) return gate;
  const { profile, supabase } = gate;
  const { error } = await supabase
    .from("conversation_members")
    .update({ last_read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .eq("user_id", profile.id);
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const };
}

export async function addGroupMembers(conversationId: string, userIds: string[]) {
  const gate = await actor();
  if (!gate.ok) return gate;
  const { profile, supabase } = gate;
  const { data: convo } = await supabase.from("conversations").select("id, kind").eq("id", conversationId).maybeSingle();
  const { data: membership } = await supabase
    .from("conversation_members")
    .select("user_id")
    .eq("conversation_id", conversationId)
    .eq("user_id", profile.id)
    .maybeSingle();
  if (!convo || convo.kind !== "group" || !membership) return { ok: false as const, error: "not in that chat" };
  const { data: people } = await supabase.from("profiles").select("id, active, role").in("id", userIds);
  const allowed = (people ?? []).filter(
    (p) =>
      !validateDmTarget({
        me: profile.id,
        other: p as { id: string; active: boolean; role: ProfileRole },
      }),
  );
  if (allowed.length === 0) return { ok: false as const, error: "can't message them" };
  const { error } = await supabase.from("conversation_members").insert(
    allowed.map((p) => ({ conversation_id: conversationId, user_id: p.id })),
  );
  if (error && !error.message.toLowerCase().includes("duplicate")) {
    return { ok: false as const, error: error.message };
  }
  return { ok: true as const };
}

export async function removeGroupMember(conversationId: string, userId: string) {
  const gate = await actor();
  if (!gate.ok) return gate;
  const { profile, supabase } = gate;
  const { data: convo } = await supabase
    .from("conversations")
    .select("kind, created_by")
    .eq("id", conversationId)
    .maybeSingle();
  if (!convo) return { ok: false as const, error: "not in that chat" };
  if (
    !canRemoveGroupMember({
      actorId: profile.id,
      createdBy: convo.created_by,
      targetId: userId,
      kind: convo.kind as ConversationKind,
    })
  ) {
    return { ok: false as const, error: "only the creator can remove people" };
  }
  const { error } = await supabase
    .from("conversation_members")
    .delete()
    .eq("conversation_id", conversationId)
    .eq("user_id", userId);
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const };
}

export async function leaveGroup(conversationId: string) {
  const gate = await actor();
  if (!gate.ok) return gate;
  const { profile, supabase } = gate;
  const { data: convo } = await supabase
    .from("conversations")
    .select("kind, created_by")
    .eq("id", conversationId)
    .maybeSingle();
  if (!convo || convo.kind !== "group") return { ok: false as const, error: "not in that chat" };
  const { data: members } = await supabase
    .from("conversation_members")
    .select("user_id, joined_at")
    .eq("conversation_id", conversationId);
  if (!(members ?? []).some((m) => m.user_id === profile.id)) return { ok: false as const, error: "not in that chat" };
  const next = nextCreatorId({
    leavingId: profile.id,
    createdBy: convo.created_by,
    members: (members ?? []).map((m) => ({ userId: m.user_id, joinedAt: m.joined_at })),
  });
  if (next && next !== convo.created_by) {
    const { error } = await supabase.from("conversations").update({ created_by: next }).eq("id", conversationId);
    if (error) return { ok: false as const, error: error.message };
  }
  const { error } = await supabase
    .from("conversation_members")
    .delete()
    .eq("conversation_id", conversationId)
    .eq("user_id", profile.id);
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const };
}
