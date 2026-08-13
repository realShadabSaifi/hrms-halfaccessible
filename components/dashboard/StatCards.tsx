"use client";

import { motion, useReducedMotion } from "motion/react";
import styles from "./StatCards.module.scss";

export function StatCards({
  cards,
}: {
  cards: { label: string; value: string; sub: string }[];
}) {
  const reduce = useReducedMotion();
  return (
    <div className={styles.grid}>
      {cards.map((s, i) => (
        <motion.div
          key={s.label}
          className={`${styles.card} ${i === 0 ? styles.featured : ""}`}
          initial={reduce ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className={styles.label}>{s.label}</div>
          <div className={styles.value}>{s.value}</div>
          <div className={styles.sub}>{s.sub}</div>
        </motion.div>
      ))}
    </div>
  );
}
