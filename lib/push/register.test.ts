import { beforeEach, describe, expect, it, vi } from "vitest";

const registerPush = vi.fn(async () => ({ ok: true as const }));
const unregisterPush = vi.fn(async () => ({ ok: true as const }));

vi.mock("@/app/(portal)/chat/actions", () => ({
  registerPush: (...args: unknown[]) => registerPush(...args),
  unregisterPush: (...args: unknown[]) => unregisterPush(...args),
}));

import { disablePush, enablePush, syncPushIfGranted } from "./register";

function mockPushEnv(permission: NotificationPermission) {
  const subscribe = vi.fn(async () => ({
    endpoint: "https://push.example/1",
    toJSON: () => ({
      endpoint: "https://push.example/1",
      keys: { p256dh: "p", auth: "a" },
    }),
  }));
  const getSubscription = vi.fn(async () => null);
  const registration = { pushManager: { subscribe, getSubscription } };
  Object.defineProperty(globalThis, "PushManager", { value: function PushManager() {}, configurable: true });
  Object.defineProperty(globalThis, "Notification", {
    value: {
      permission,
      requestPermission: vi.fn(async () => permission),
    },
    configurable: true,
  });
  Object.defineProperty(globalThis.navigator, "serviceWorker", {
    value: {
      register: vi.fn(async () => registration),
      ready: Promise.resolve(registration),
      getRegistration: vi.fn(async () => registration),
    },
    configurable: true,
  });
  return { subscribe, registration };
}

describe("enablePush", () => {
  beforeEach(() => {
    registerPush.mockClear();
    unregisterPush.mockClear();
    vi.stubEnv("NEXT_PUBLIC_VAPID_PUBLIC_KEY", "AQID");
  });

  it("waits for the worker and stores the desktop subscription", async () => {
    const { subscribe } = mockPushEnv("granted");
    await expect(enablePush()).resolves.toEqual({ ok: true });
    expect(subscribe).toHaveBeenCalledOnce();
    expect(registerPush).toHaveBeenCalledWith({
      endpoint: "https://push.example/1",
      keys: { p256dh: "p", auth: "a" },
    });
  });

  it("explains a missing vapid key instead of prompting", async () => {
    mockPushEnv("granted");
    vi.stubEnv("NEXT_PUBLIC_VAPID_PUBLIC_KEY", "replace-me");
    await expect(enablePush()).resolves.toEqual({
      ok: false,
      error: "pings need vapid keys on the server.",
    });
    expect(registerPush).not.toHaveBeenCalled();
  });

  it("explains a blocked permission", async () => {
    mockPushEnv("denied");
    await expect(enablePush()).resolves.toEqual({
      ok: false,
      error: "blocked in the browser. allow notifications for this site.",
    });
  });
});

describe("syncPushIfGranted", () => {
  beforeEach(() => {
    registerPush.mockClear();
    vi.stubEnv("NEXT_PUBLIC_VAPID_PUBLIC_KEY", "AQID");
  });

  it("stays quiet until the browser already allowed pings", async () => {
    mockPushEnv("default");
    await syncPushIfGranted();
    expect(registerPush).not.toHaveBeenCalled();
  });

  it("re-registers an existing desktop grant without a new prompt", async () => {
    mockPushEnv("granted");
    await syncPushIfGranted();
    expect(registerPush).toHaveBeenCalledOnce();
  });
});

describe("disablePush", () => {
  it("unsubscribes the current endpoint", async () => {
    const sub = {
      endpoint: "https://push.example/1",
      unsubscribe: vi.fn(async () => true),
    };
    mockPushEnv("granted");
    const reg = await navigator.serviceWorker.getRegistration();
    vi.mocked(reg!.pushManager.getSubscription).mockResolvedValue(sub as never);
    await expect(disablePush()).resolves.toEqual({ ok: true });
    expect(sub.unsubscribe).toHaveBeenCalledOnce();
    expect(unregisterPush).toHaveBeenCalledWith("https://push.example/1");
  });
});
