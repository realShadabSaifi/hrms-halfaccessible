"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import styles from "./AuthShell.module.scss";

export function AuthShell({ children }: { children: ReactNode }) {
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
        <div className={styles.scrim} />
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
          <div className={styles.brand}>halfAccessible</div>
          {children}
        </div>
      </motion.div>
    </main>
  );
}
