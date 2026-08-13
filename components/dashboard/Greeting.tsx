"use client";

import { firstName } from "@/lib/dashboard/stats";
import styles from "./Greeting.module.scss";

export function Greeting({ fullName, today }: { fullName: string; today: string }) {
  return (
    <div className={styles.wrap}>
      <h2 className={styles.hi}>
        yo, {firstName(fullName)}{" "}
        <span className={styles.wave} aria-hidden="true">
          👋
        </span>
      </h2>
      <p className={styles.sub}>it&apos;s {today} - another day of shipping and vibing.</p>
    </div>
  );
}
