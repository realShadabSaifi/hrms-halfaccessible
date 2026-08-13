import styles from "./StatCards.module.scss";

export function StatCards({
  cards,
}: {
  cards: { label: string; value: string; sub: string }[];
}) {
  return (
    <div className={styles.grid}>
      {cards.map((s) => (
        <div key={s.label} className={styles.card}>
          <div className={styles.label}>{s.label}</div>
          <div className={styles.value}>{s.value}</div>
          <div className={styles.sub}>{s.sub}</div>
        </div>
      ))}
    </div>
  );
}
