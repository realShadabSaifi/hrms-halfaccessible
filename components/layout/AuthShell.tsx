"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import type { AppSettings } from "@/lib/types";
import { BrandLockup } from "./BrandLockup";
import styles from "./AuthShell.module.scss";

export function AuthShell({
  children,
  settings,
}: {
  children: ReactNode;
  settings: AppSettings;
}) {
  const reduce = useReducedMotion();

  return (
    <main id="main" className={styles.page}>
      <div className={styles.visual}>
        <Image
          src="/auth-atmosphere.png"
          alt=""
          fill
          priority
          sizes="(max-width: 767px) 0px, 50vw"
          className={styles.image}
        />
        <p className={styles.manifesto} aria-hidden="true">
          the portal.
          <span>no corporate BS.</span>
        </p>
      </div>
      <motion.div
        className={styles.panel}
        initial={reduce ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className={styles.card}>
          <BrandLockup name={settings.app_name} logoUrl={settings.logo_url} size="auth" />
          {children}
        </div>
      </motion.div>
    </main>
  );
}
