import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveHoliday } from "@/lib/burgers/resolve";

export async function GET(request: Request) {
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const admin = createAdminClient();
  const { data: rows } = await admin
    .from("burger_holidays")
    .select("id, voting_closes_at, status")
    .eq("status", "voting");
  const { data: votes } = await admin.from("burger_votes").select("holiday_id, choice");
  const now = Date.now();
  for (const row of rows ?? []) {
    const hv = (votes ?? []).filter((v) => v.holiday_id === row.id);
    const next = resolveHoliday({
      yes: hv.filter((v) => v.choice === "yes").length,
      no: hv.filter((v) => v.choice === "no").length,
      now,
      closesAt: +new Date(row.voting_closes_at),
    });
    if (next !== "voting") {
      await admin.from("burger_holidays").update({ status: next }).eq("id", row.id);
    }
  }
  return NextResponse.json({ ok: true });
}
