"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/layout/AuthShell";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { confirmSignupAction, startSignupAction } from "./actions";
import styles from "./SignupFlow.module.scss";

export function SignupFlow() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [qr, setQr] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onEmail(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await startSignupAction(formData);
    setPending(false);
    if ("error" in result && result.error) {
      setError(
        result.error === "exists"
          ? "you already have an authenticator. log in instead."
          : result.error === "setup_failed"
            ? "could not save your authenticator. try again in a minute."
            : "that email does not look right.",
      );
      return;
    }
    if ("qrDataUrl" in result) {
      setEmail(String(formData.get("email") ?? ""));
      setQr(result.qrDataUrl);
      setSecret(result.secret);
    }
  }

  async function onCode(formData: FormData) {
    setPending(true);
    setError(null);
    formData.set("email", email);
    const result = await confirmSignupAction(formData);
    setPending(false);
    if (!result.ok) {
      setError(
        result.error === "expired_setup"
          ? "that setup expired. go back and show the QR again."
          : "that code did not match. wait for a fresh one.",
      );
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <AuthShell>
      <h1 className={styles.headline}>set up your authenticator</h1>
      <p className={styles.sub}>
        scan this QR in Authy, Google Authenticator, or 1Password. then type the
        6-digit code.
      </p>
      {!qr ? (
        <form action={onEmail} className={styles.form}>
          <TextField
            label="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@halfaccessible.com"
          />
          {error ? <p className={styles.error}>{error}</p> : null}
          <Button type="submit" pending={pending}>
            show my QR
          </Button>
        </form>
      ) : (
        <>
          {/* QR is a generated data URL, not a remote asset */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={styles.qr} src={qr} alt="authenticator QR code" />
          {secret ? (
            <p className={styles.secret} aria-label="manual setup key">
              {secret}
            </p>
          ) : null}
          <form action={onCode} className={styles.form}>
            <TextField
              label="first 6-digit code"
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="\d{6}"
              maxLength={6}
              required
            />
            {error ? <p className={styles.error}>{error}</p> : null}
            <Button type="submit" pending={pending}>
              confirm and enter
            </Button>
          </form>
        </>
      )}
      <p className={styles.switch}>
        already set up? <a href="/login">log in</a>
      </p>
    </AuthShell>
  );
}
