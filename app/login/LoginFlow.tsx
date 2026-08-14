"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthShell } from "@/components/layout/AuthShell";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import type { AppSettings } from "@/lib/types";
import { startLoginAction, verifyLoginAction } from "./actions";
import styles from "./LoginFlow.module.scss";

export function LoginFlow({ settings }: { settings: AppSettings }) {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(
    params.get("reason") === "deactivated"
      ? "this account is deactivated. ping an admin."
      : null,
  );
  const [pending, setPending] = useState(false);

  async function onEmail(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await startLoginAction(formData);
    setPending(false);
    if ("needsSetup" in result && result.needsSetup) {
      router.push("/signup");
      return;
    }
    if ("error" in result) {
      if (result.error === "deactivated") {
        setError("this account is deactivated. ping an admin.");
        return;
      }
      setError("could not find that combo. try again.");
      return;
    }
    setEmail(String(formData.get("email") ?? ""));
    setStep("code");
  }

  async function onCode(formData: FormData) {
    setPending(true);
    setError(null);
    formData.set("email", email);
    const result = await verifyLoginAction(formData);
    setPending(false);
    if (!result.ok) {
      setError(
        result.error === "locked"
          ? "too many tries. wait 15 minutes."
          : "that code did not match. try the latest one.",
      );
      return;
    }
    setDone(true);
    router.push("/");
    router.refresh();
  }

  return (
    <AuthShell settings={settings}>
      <h1 className={styles.headline}>the portal. no corporate BS.</h1>
      <p className={styles.sub}>email, then the code from your authenticator.</p>
      {done ? (
        <div className={styles.done}>you&apos;re in 🎉 redirecting to the portal…</div>
      ) : step === "email" ? (
        <form action={onEmail} className={styles.form}>
          <TextField
            className={styles.authField}
            label="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@halfaccessible.com"
          />
          {error ? <p className={styles.error}>{error}</p> : null}
          <Button type="submit" shape="auth" pending={pending}>
            continue
          </Button>
        </form>
      ) : (
        <form action={onCode} className={styles.form}>
          <TextField
            className={styles.authField}
            tone="otp"
            label="authenticator code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d{6}"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
          />
          {error ? <p className={styles.error}>{error}</p> : null}
          <Button type="submit" shape="auth" pending={pending}>
            let me in
          </Button>
        </form>
      )}
      {done ? null : (
        <p className={styles.switch}>
          first time here? <a href="/signup">set up your authenticator</a>
        </p>
      )}
    </AuthShell>
  );
}
