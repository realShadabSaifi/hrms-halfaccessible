export async function notifyChatMessage(_input: {
  conversationId: string;
  senderId: string;
  senderName: string;
  groupTitle: string | null;
  body: string;
  memberIds: string[];
}): Promise<void> {}

export async function notifyAnnouncement(_input: {
  announcementId: string;
  authorId: string;
  title: string;
}): Promise<void> {}

export async function notifyLeaveDecision(_input: {
  requestId: string;
  requesterId: string;
  type: string;
  status: "approved" | "rejected";
}): Promise<void> {}
