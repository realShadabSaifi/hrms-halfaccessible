// @vitest-environment node
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { VERIFIED_USER_HEADER, parseVerifiedUser } from "./verifiedUser";

let currentUser: { id: string; app_metadata: Record<string, unknown> } | null = null;
vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({
    auth: {
      getUser: async () => ({ data: { user: currentUser } }),
      signOut: async () => ({}),
    },
  }),
}));

const { updateSession } = await import("./middleware");

const USER = "11111111-2222-3333-4444-555555555555";
const SPOOF = "99999999-8888-7777-6666-555555555555";

/** The request headers NextResponse.next() forwards to the page, as Next encodes them. */
function forwarded(res: Response, name: string): string | null {
  return res.headers.get(`x-middleware-request-${name}`);
}

function req(path: string, headers: Record<string, string> = {}) {
  return new NextRequest(new URL(path, "http://localhost:3000"), { headers });
}

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://localhost:54321");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
  currentUser = null;
});

describe("verified user header", () => {
  it("passes the verified user id to the page", async () => {
    currentUser = { id: USER, app_metadata: { totp_verified: true } };
    const res = await updateSession(req("/leaves"));
    expect(forwarded(res, VERIFIED_USER_HEADER)).toBe(USER);
    expect(forwarded(res, "x-pathname")).toBe("/leaves");
  });

  it("replaces a header a browser tried to supply", async () => {
    currentUser = { id: USER, app_metadata: { totp_verified: true } };
    const res = await updateSession(req("/leaves", { [VERIFIED_USER_HEADER]: SPOOF }));
    expect(forwarded(res, VERIFIED_USER_HEADER)).toBe(USER);
  });

  it("strips a spoofed header when nobody is signed in", async () => {
    const res = await updateSession(req("/anon", { [VERIFIED_USER_HEADER]: SPOOF }));
    expect(forwarded(res, VERIFIED_USER_HEADER)).toBeNull();
  });

  it("still redirects signed-out users away from portal pages", async () => {
    const res = await updateSession(req("/leaves", { [VERIFIED_USER_HEADER]: SPOOF }));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/login");
  });

  it("only accepts a uuid", () => {
    expect(parseVerifiedUser(USER)).toBe(USER);
    expect(parseVerifiedUser("not-a-uuid")).toBeNull();
    expect(parseVerifiedUser(null)).toBeNull();
  });
});
