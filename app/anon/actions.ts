"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { ANON_COOKIE, hashSession, newAnonSession } from "@/lib/anon/session";
import { createAdminClient } from "@/lib/supabase/admin";

async function sessionHash() {
  const jar = await cookies();
  let raw = jar.get(ANON_COOKIE)?.value;
  if (!raw) {
    raw = newAnonSession();
    jar.set(ANON_COOKIE, raw, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 400 });
  }
  return hashSession(raw);
}

export async function postAnon(category: string, body: string) {
  if (!body.trim()) return { ok: false as const, error: "say something" };
  const admin = createAdminClient();
  const { error } = await admin.from("anonymous_messages").insert({
    category,
    body: body.trim(),
  });
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/anon");
  return { ok: true as const };
}

export async function upvoteAnon(id: string) {
  const hash = await sessionHash();
  const admin = createAdminClient();
  const { error } = await admin.from("anon_upvotes").insert({
    message_id: id,
    session_hash: hash,
  });
  if (error && !error.message.toLowerCase().includes("duplicate")) {
    return { ok: false as const };
  }
  revalidatePath("/anon");
  return { ok: true as const };
}
