import styles from "./Ticker.module.scss";

export function Ticker({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <div className={styles.wrap}>
      {items.map((tick) => (
        <div key={tick} className={styles.chip}>
          {tick}
        </div>
      ))}
    </div>
  );
}
