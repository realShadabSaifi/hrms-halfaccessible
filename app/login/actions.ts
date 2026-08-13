"use server";

import { startLogin, verifyLogin } from "@/lib/auth/session";

export async function startLoginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  return startLogin(email);
}

export async function verifyLoginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const code = String(formData.get("code") ?? "");
  return verifyLogin(email, code);
}
