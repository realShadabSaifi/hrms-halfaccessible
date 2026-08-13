import { Waveform } from "@phosphor-icons/react/dist/ssr";
import { EmptyState } from "@/components/ui/EmptyState";
import styles from "./ActivityFeed.module.scss";

export function ActivityFeed({
  items,
}: {
  items: { id: string; body: string; time: string }[];
}) {
  return (
    <section className={styles.wrap}>
      <h2 className={styles.title}>recent activity 📡</h2>
      {items.length === 0 ? (
        <EmptyState
          icon={<Waveform size={28} />}
          title="quiet so far. go make some history."
        />
      ) : (
        items.map((a) => (
          <div key={a.id} className={styles.row}>
            <span className={styles.body}>{a.body}</span>
            <span className={styles.time}>{a.time}</span>
          </div>
        ))
      )}
    </section>
  );
}
