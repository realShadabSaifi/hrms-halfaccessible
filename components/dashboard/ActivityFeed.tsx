import { Waveform } from "@phosphor-icons/react/dist/ssr";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import styles from "./ActivityFeed.module.scss";

function splitLeadingEmoji(body: string): { emoji: string | null; text: string } {
  const match = body.match(/^(\p{Extended_Pictographic}\uFE0F?)\s*(.*)$/u);
  if (!match) return { emoji: null, text: body };
  return { emoji: match[1], text: match[2] };
}

export function ActivityFeed({
  items,
}: {
  items: { id: string; body: string; time: string }[];
}) {
  return (
    <Card as="section">
      <h2 className={styles.title}>recent activity 📡</h2>
      {items.length === 0 ? (
        <EmptyState
          icon={<Waveform size={28} />}
          title="quiet so far. go make some history."
        />
      ) : (
        items.map((a) => {
          const { emoji, text } = splitLeadingEmoji(a.body);
          return (
            <div key={a.id} className={styles.row}>
              {emoji ? <span className={styles.emoji}>{emoji}</span> : null}
              <span className={styles.body}>{text}</span>
              <span className={styles.time}>{a.time}</span>
            </div>
          );
        })
      )}
    </Card>
  );
}
