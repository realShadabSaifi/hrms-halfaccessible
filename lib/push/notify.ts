import { createAdminClient } from "@/lib/supabase/admin";
import {
  announcementPushPayload,
  chatPushPayload,
  leavePushPayload,
  pushRecipients,
} from "./payload";
import { sendToUsers } from "./send";

export async function notifyChatMessage(input: {
  conversationId: string;
  senderId: string;
  senderName: string;
  groupTitle: string | null;
  body: string;
  memberIds: string[];
}): Promise<void> {
  try {
    await sendToUsers(
      pushRecipients(input.senderId, input.memberIds),
      chatPushPayload({
        conversationId: input.conversationId,
        senderName: input.senderName,
        groupTitle: input.groupTitle,
        body: input.body,
      }),
    );
  } catch {
    // push must never fail the write
  }
}

export async function notifyAnnouncement(input: {
  announcementId: string;
  authorId: string;
  title: string;
}): Promise<void> {
  try {
    const admin = createAdminClient();
    const { data } = await admin.from("profiles").select("id").eq("active", true).neq("role", "super_admin");
    await sendToUsers(
      pushRecipients(
        input.authorId,
        (data ?? []).map((p) => p.id),
      ),
      announcementPushPayload({ announcementId: input.announcementId, title: input.title }),
    );
  } catch {
    // push must never fail the write
  }
}

export async function notifyLeaveDecision(input: {
  requestId: string;
  requesterId: string;
  type: string;
  status: "approved" | "rejected";
}): Promise<void> {
  try {
    await sendToUsers(
      [input.requesterId],
      leavePushPayload({ requestId: input.requestId, type: input.type, status: input.status }),
    );
  } catch {
    // push must never fail the write
  }
}
