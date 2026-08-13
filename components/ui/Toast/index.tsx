import styles from "./Toast.module.scss";

export function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div role="status" aria-live="polite" className={styles.root}>
      {message}
    </div>
  );
}
