"use client";

import { useState } from "react";
import { removeLogo, updateAppName, uploadLogo } from "@/app/(portal)/settings/actions";
import { BrandLockup } from "@/components/layout/BrandLockup";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { Toast } from "@/components/ui/Toast";
import { APP_NAME_MAX } from "@/lib/branding/validate";
import type { AppSettings } from "@/lib/types";

export function SettingsClient({ settings }: { settings: AppSettings }) {
  const [toast, setToast] = useState<string | null>(null);

  return (
    <div className="pageEnter max-w-[560px]">
      <div className="rounded-ha-lg border border-ha-line bg-ha-surface p-[22px] shadow-[var(--ha-shadow-card)]">
        <div className="font-[family-name:var(--font-display)] text-base font-bold">portal config</div>
        <p className="mb-3.5 text-xs text-ha-muted">
          name and header logo. this is what people see on the way in.
        </p>
        <div className="mb-5 rounded-ha-md border border-ha-line bg-ha-bg px-3.5 py-3">
          <BrandLockup name={settings.app_name} logoUrl={settings.logo_url} />
        </div>
        <form
          action={async (fd) => {
            const r = await updateAppName(fd);
            setToast(r.ok ? "name saved." : r.error ?? "nope");
          }}
        >
          <TextField
            name="app_name"
            label="application name"
            defaultValue={settings.app_name}
            maxLength={APP_NAME_MAX}
            required
          />
          <div className="mt-3">
            <Button type="submit">save name</Button>
          </div>
        </form>
        <form
          className="mt-6 border-t border-ha-line pt-5"
          action={async (fd) => {
            const r = await uploadLogo(fd);
            setToast(r.ok ? "logo uploaded." : r.error ?? "nope");
          }}
        >
          <label className="block">
            <span className="mb-1.5 block text-[11.5px] font-bold uppercase tracking-wider text-ha-muted">
              header logo
            </span>
            <input
              type="file"
              name="logo"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              required
              className="block w-full text-[13px]"
            />
            <span className="mt-1.5 block text-[11.5px] text-ha-muted">
              png, jpg, webp, or svg. 1 MB max.
            </span>
          </label>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="submit">upload logo</Button>
            {settings.logo_url ? (
              <Button
                variant="ghost"
                onClick={async () => {
                  const r = await removeLogo();
                  setToast(r.ok ? "logo removed." : r.error ?? "nope");
                }}
              >
                remove logo
              </Button>
            ) : null}
          </div>
        </form>
      </div>
      <Toast message={toast} />
    </div>
  );
}
