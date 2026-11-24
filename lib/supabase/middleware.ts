import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSessionlessPath } from "@/lib/layout/sessionless";
import { VERIFIED_USER_HEADER } from "@/lib/supabase/verifiedUser";

type CookieToSet = { name: string; value: string; options?: Record<string, unknown> };

/**
 * Pass the request on with our internal headers. The verified-user header is always
 * overwritten (or removed) here, so a browser can never supply its own value.
 */
function next(request: NextRequest, userId: string | null, cookies: CookieToSet[]) {
  const headers = new Headers(request.headers);
  headers.set("x-pathname", request.nextUrl.pathname);
  if (userId) headers.set(VERIFIED_USER_HEADER, userId);
  else headers.delete(VERIFIED_USER_HEADER);
  const response = NextResponse.next({ request: { headers } });
  cookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options as never));
  return response;
}

function redirectTo(request: NextRequest, pathname: string, cookies: CookieToSet[], params?: Record<string, string>) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  for (const [k, v] of Object.entries(params ?? {})) url.searchParams.set(k, v);
  const response = NextResponse.redirect(url);
  cookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options as never));
  return response;
}

export async function updateSession(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const publicPaths = ["/login", "/signup", "/anon"];
  const isPublic =
    isSessionlessPath(path) ||
    publicPaths.some((p) => path === p || path.startsWith(`${p}/`)) ||
    path.startsWith("/api/cron");

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return isPublic ? next(request, null, []) : redirectTo(request, "/login", []);
  }

  // refreshed session cookies, written to the request (for this render) and to the response
  const refreshed: CookieToSet[] = [];
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        refreshed.push(...cookiesToSet);
      },
    },
  });

  // the one network check of the session per request; pages reuse its result
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !isPublic) return redirectTo(request, "/login", refreshed);

  if (user && !user.app_metadata?.totp_verified && !isPublic) return redirectTo(request, "/signup", refreshed);

  if (user?.app_metadata?.deactivated) {
    await supabase.auth.signOut();
    return redirectTo(request, "/login", refreshed, { reason: "deactivated" });
  }

  if (user && (path === "/login" || path === "/signup") && user.app_metadata?.totp_verified) {
    return redirectTo(request, "/", refreshed);
  }

  return next(request, user?.id ?? null, refreshed);
}
