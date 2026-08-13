"use client";

import { useEffect, useState } from "react";
import styles from "./BurgerRain.module.scss";

export function BurgerRain({ fire }: { fire: boolean }) {
  const [drops, setDrops] = useState<{ id: number; left: number; size: number; dur: number; delay: number }[]>([]);
  useEffect(() => {
    if (!fire || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setDrops(
      Array.from({ length: 20 }, (_, i) => ({
        id: i,
        left: Math.round(Math.random() * 96),
        size: 22 + Math.round(Math.random() * 26),
        dur: 1.8 + Math.random() * 1.6,
        delay: Math.random() * 0.8,
      })),
    );
    const t = setTimeout(() => setDrops([]), 3400);
    return () => clearTimeout(t);
  }, [fire]);
  if (!drops.length) return null;
  return (
    <div className={styles.layer} aria-hidden="true">
      {drops.map((d) => (
        <span
          key={d.id}
          className={styles.drop}
          style={{ left: `${d.left}%`, fontSize: d.size, animationDuration: `${d.dur}s`, animationDelay: `${d.delay}s` }}
        >
          🍔
        </span>
      ))}
    </div>
  );
}
