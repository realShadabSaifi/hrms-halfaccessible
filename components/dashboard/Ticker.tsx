import styles from "./Ticker.module.scss";

export function Ticker({ text }: { text: string }) {
  if (!text) return null;
  return (
    <div className={styles.wrap}>
      <div className={styles.track}>
        <span className={styles.text}>{text}</span>
        <span className={styles.text}>{text}</span>
      </div>
    </div>
  );
}
