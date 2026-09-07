import { beforeEach, describe, expect, it, vi } from "vitest";

const sendNotification = vi.fn();
const setVapidDetails = vi.fn();
const from = vi.fn();

vi.mock("web-push", () => ({
  default: {
    sendNotification,
    setVapidDetails,
  },
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from }),
}));

const payload = { title: "Ada", body: "hey", url: "/chat/c1", tag: "chat:c1" };

describe("sendToUsers", () => {
  beforeEach(() => {
    vi.resetModules();
    sendNotification.mockReset();
    setVapidDetails.mockReset();
    from.mockReset();
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = "pub";
    process.env.VAPID_PRIVATE_KEY = "priv";
    process.env.VAPID_SUBJECT = "mailto:eng@example.com";
  });

  it("returns immediately when the list is empty", async () => {
    const { sendToUsers } = await import("./send");
    await sendToUsers([], payload);
    expect(from).not.toHaveBeenCalled();
  });

  it("returns immediately when VAPID_PRIVATE_KEY is missing", async () => {
    delete process.env.VAPID_PRIVATE_KEY;
    const { sendToUsers } = await import("./send");
    await sendToUsers(["a"], payload);
    expect(from).not.toHaveBeenCalled();
  });

  it("sends once per subscription", async () => {
    const eq = vi.fn();
    from.mockImplementation((table: string) => {
      if (table === "push_subscriptions") {
        return {
          select: () => ({
            in: async () => ({
              data: [
                { id: "s1", endpoint: "https://e/1", p256dh: "k", auth: "a" },
                { id: "s2", endpoint: "https://e/2", p256dh: "k", auth: "a" },
              ],
            }),
          }),
          delete: () => ({ eq }),
        };
      }
      return {};
    });
    sendNotification.mockResolvedValue(undefined);
    const { sendToUsers } = await import("./send");
    await sendToUsers(["u1"], payload);
    expect(sendNotification).toHaveBeenCalledTimes(2);
  });

  it("deletes a row when send rejects with 410", async () => {
    const eq = vi.fn().mockResolvedValue({});
    from.mockImplementation(() => ({
      select: () => ({
        in: async () => ({
          data: [{ id: "dead", endpoint: "https://e/dead", p256dh: "k", auth: "a" }],
        }),
      }),
      delete: () => ({ eq }),
    }));
    sendNotification.mockRejectedValue({ statusCode: 410 });
    const { sendToUsers } = await import("./send");
    await sendToUsers(["u1"], payload);
    expect(eq).toHaveBeenCalledWith("id", "dead");
  });

  it("swallows a 500 and does not throw", async () => {
    from.mockImplementation(() => ({
      select: () => ({
        in: async () => ({
          data: [{ id: "s1", endpoint: "https://e/1", p256dh: "k", auth: "a" }],
        }),
      }),
    }));
    sendNotification.mockRejectedValue({ statusCode: 500 });
    const { sendToUsers } = await import("./send");
    await expect(sendToUsers(["u1"], payload)).resolves.toBeUndefined();
  });
});
