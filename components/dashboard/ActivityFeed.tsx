import styles from "./ActivityFeed.module.scss";

export function ActivityFeed({
  items,
}: {
  items: { id: string; body: string; time: string }[];
}) {
  return (
    <section className={styles.card}>
      <h2 className={styles.title}>recent activity 📡</h2>
      {items.length === 0 ? (
        <p className="text-sm text-[rgba(28,28,46,0.55)]">quiet so far. go make some history.</p>
      ) : (
        items.map((a) => (
          <div key={a.id} className={styles.row}>
            <span style={{ flex: 1 }}>{a.body}</span>
            <span className={styles.time}>{a.time}</span>
          </div>
        ))
      )}
    </section>
  );
}
