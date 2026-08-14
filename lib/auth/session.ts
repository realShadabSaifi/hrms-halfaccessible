import { randomBytes } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isValidEmail } from "@/lib/auth/email";
import { rateLimit } from "@/lib/rateLimit";
import { decryptSecret, encryptSecret, fromBytea, toBytea } from "@/lib/totp/encrypt";
import { qrDataUrl } from "@/lib/totp/qr";
import { generateTotpSecret, totpUri, verifyTotp } from "@/lib/totp/verify";
import { roleForNewUser } from "@/lib/auth/firstUser";

export async function mintSession(email: string) {
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  if (error || !data.properties?.hashed_token) {
    throw new Error(error?.message ?? "could not mint session");
  }
  const supabase = await createClient();
  const { error: verifyError } = await supabase.auth.verifyOtp({
    type: "email",
    token_hash: data.properties.hashed_token,
  });
  if (verifyError) throw new Error(verifyError.message);
}

export async function startSignup(emailRaw: string) {
  const email = emailRaw.trim().toLowerCase();
  if (!isValidEmail(email)) return { error: "invalid_email" as const };
  if (!rateLimit(`signup:${email}`)) return { error: "invalid_email" as const };

  const admin = createAdminClient();
  const { data: users } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const existing = users.users.find((u) => u.email?.toLowerCase() === email);

  if (existing?.app_metadata?.totp_verified) {
    return { error: "exists" as const };
  }

  let userId = existing?.id;
  if (!userId) {
    const password = randomBytes(32).toString("base64url");
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: email.split("@")[0] },
    });
    if (error || !data.user) return { error: "invalid_email" as const };
    userId = data.user.id;
  }

  const { count: superCount } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "super_admin");
  if (roleForNewUser(superCount ?? 0) === "super_admin") {
    await admin.from("profiles").update({ role: "super_admin" }).eq("id", userId);
  }

  const secret = process.env.E2E_TOTP_SECRET || generateTotpSecret();
  const { ciphertext, iv } = encryptSecret(secret);
  const { error: totpError } = await admin.from("totp_credentials").upsert({
    user_id: userId,
    secret_ciphertext: toBytea(ciphertext),
    secret_iv: toBytea(iv),
    verified_at: null,
    failed_attempts: 0,
    locked_until: null,
  });
  if (totpError) return { error: "setup_failed" as const };

  const otpauthUrl = totpUri(email, secret);
  return { otpauthUrl, qrDataUrl: await qrDataUrl(otpauthUrl), secret };
}

export async function confirmSignup(emailRaw: string, code: string) {
  const email = emailRaw.trim().toLowerCase();
  const admin = createAdminClient();
  const { data: users } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const user = users.users.find((u) => u.email?.toLowerCase() === email);
  if (!user) return { ok: false as const, error: "expired_setup" as const };

  const { data: cred } = await admin
    .from("totp_credentials")
    .select("secret_ciphertext, secret_iv, verified_at")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!cred) return { ok: false as const, error: "expired_setup" as const };

  const secret = decryptSecret(fromBytea(cred.secret_ciphertext), fromBytea(cred.secret_iv));
  if (!verifyTotp(secret, code)) return { ok: false as const, error: "invalid_code" as const };

  const now = new Date().toISOString();
  await admin
    .from("totp_credentials")
    .update({ verified_at: now, failed_attempts: 0, locked_until: null })
    .eq("user_id", user.id);
  await admin.from("profiles").update({ totp_verified_at: now }).eq("id", user.id);
  await admin.auth.admin.updateUserById(user.id, {
    app_metadata: { ...user.app_metadata, totp_verified: true },
  });
  await mintSession(email);
  return { ok: true as const };
}

export async function startLogin(emailRaw: string) {
  const email = emailRaw.trim().toLowerCase();
  if (!isValidEmail(email) || !rateLimit(`login:${email}`)) {
    return { error: "unknown" as const };
  }
  const admin = createAdminClient();
  const { data: users } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const user = users.users.find((u) => u.email?.toLowerCase() === email);
  if (!user) return { error: "unknown" as const };

  const { data: profile } = await admin
    .from("profiles")
    .select("active, totp_verified_at")
    .eq("id", user.id)
    .maybeSingle();
  if (profile && profile.active === false) return { error: "deactivated" as const };
  if (!user.app_metadata?.totp_verified && !profile?.totp_verified_at) {
    return { needsSetup: true as const };
  }
  return { needsTotp: true as const };
}

export async function verifyLogin(emailRaw: string, code: string) {
  const email = emailRaw.trim().toLowerCase();
  const admin = createAdminClient();
  const { data: users } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const user = users.users.find((u) => u.email?.toLowerCase() === email);
  if (!user) return { ok: false as const, error: "invalid_code" as const };

  const { data: cred } = await admin
    .from("totp_credentials")
    .select("secret_ciphertext, secret_iv, failed_attempts, locked_until")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!cred) return { ok: false as const, error: "invalid_code" as const };
  if (cred.locked_until && new Date(cred.locked_until).getTime() > Date.now()) {
    return { ok: false as const, error: "locked" as const };
  }

  const secret = decryptSecret(fromBytea(cred.secret_ciphertext), fromBytea(cred.secret_iv));
  if (!verifyTotp(secret, code)) {
    const failed = (cred.failed_attempts ?? 0) + 1;
    const locked_until = failed >= 5 ? new Date(Date.now() + 15 * 60_000).toISOString() : null;
    await admin
      .from("totp_credentials")
      .update({ failed_attempts: failed, locked_until })
      .eq("user_id", user.id);
    return { ok: false as const, error: locked_until ? "locked" : "invalid_code" };
  }

  await admin
    .from("totp_credentials")
    .update({ failed_attempts: 0, locked_until: null })
    .eq("user_id", user.id);
  await mintSession(email);
  return { ok: true as const };
}
