"use server";

import { confirmSignup, startSignup } from "@/lib/auth/session";

export async function startSignupAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const result = await startSignup(email);
  if ("error" in result) return result;
  return {
    otpauthUrl: result.otpauthUrl,
    qrDataUrl: result.qrDataUrl,
    secret: result.secret,
  };
}

export async function confirmSignupAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const code = String(formData.get("code") ?? "");
  return confirmSignup(email, code);
}
