import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const admin = createAdminClient();
  const cutoff = new Date(Date.now() - 90 * 24 * 3600_000).toISOString();
  await admin.from("anonymous_messages").delete().lt("created_at", cutoff);
  return NextResponse.json({ ok: true });
}
