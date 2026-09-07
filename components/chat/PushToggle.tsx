"use client";

import { useEffect, useState } from "react";
import { Toggle } from "@/components/ui/Toggle";
import { disablePush, enablePush, syncPushIfGranted } from "@/lib/push/register";
import styles from "./Chat.module.scss";

export function PushToggle() {
  const [on, setOn] = useState(false);
  const [hint, setHint] = useState<string | undefined>();
  const [card, setCard] = useState(false);

  useEffect(() => {
    if (typeof Notification === "undefined") return;
    setCard(Notification.permission === "default");
    if (Notification.permission === "granted") {
      setOn(true);
      void syncPushIfGranted();
    }
  }, []);

  return (
    <>
      {card ? (
        <div className={styles.prompt}>
          turn on pings here too — desktop or phone. on iphone, add the portal to your home screen first.
          <button type="button" className={styles.close} aria-label="dismiss" onClick={() => setCard(false)}>
            ×
          </button>
        </div>
      ) : null}
      <Toggle
        checked={on}
        label="pings"
        hint={hint ?? "this computer and your phone. chrome, edge, and firefox work in the tab. iphone needs add to home screen."}
        onChange={(next) => {
          void (async () => {
            if (next) {
              const r = await enablePush();
              if (!r.ok) {
                setOn(false);
                setHint(r.error);
                return;
              }
              setOn(true);
              setHint(undefined);
              setCard(false);
              return;
            }
            await disablePush();
            setOn(false);
          })();
        }}
      />
    </>
  );
}
