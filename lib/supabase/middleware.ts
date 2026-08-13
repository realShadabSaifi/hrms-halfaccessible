import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function nextWithPath(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.set("x-pathname", request.nextUrl.pathname);
  return NextResponse.next({ request: { headers } });
}

export async function updateSession(request: NextRequest) {
  let response = nextWithPath(request);
  const path = request.nextUrl.pathname;
  const publicPaths = ["/login", "/signup", "/anon"];
  const isPublic =
    publicPaths.some((p) => path === p || path.startsWith(`${p}/`)) ||
    path.startsWith("/api/cron");

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    if (!isPublic) {
      const redirect = request.nextUrl.clone();
      redirect.pathname = "/login";
      return NextResponse.redirect(redirect);
    }
    return response;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = nextWithPath(request);
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options as never),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !isPublic) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/login";
    return NextResponse.redirect(redirect);
  }

  if (user && !user.app_metadata?.totp_verified && !isPublic) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/signup";
    return NextResponse.redirect(redirect);
  }

  if (user?.app_metadata?.deactivated) {
    await supabase.auth.signOut();
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/login";
    redirect.searchParams.set("reason", "deactivated");
    return NextResponse.redirect(redirect);
  }

  if (user && (path === "/login" || path === "/signup") && user.app_metadata?.totp_verified) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/";
    return NextResponse.redirect(redirect);
  }

  return response;
}
