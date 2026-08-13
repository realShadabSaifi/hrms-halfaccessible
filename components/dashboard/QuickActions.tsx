import Link from "next/link";
import { CalendarBlank, ChatTeardrop, Hamburger } from "@phosphor-icons/react/dist/ssr";
import styles from "./QuickActions.module.scss";

const actions = [
  { href: "/leaves", label: "request leave", sub: "inform → handoff → go", Icon: CalendarBlank },
  { href: "/burgers", label: "vote on holidays", sub: "democracy but delicious", Icon: Hamburger },
  { href: "/anon", label: "drop an anon note", sub: "no names, just vibes", Icon: ChatTeardrop },
];

export function QuickActions() {
  return (
    <div className={styles.row}>
      {actions.map(({ href, label, sub, Icon }) => (
        <Link key={href} href={href} className={styles.btn}>
          <span className={styles.icon}>
            <Icon size={20} />
          </span>
          <span>
            <span className={styles.label}>{label}</span>
            <span className={styles.sub}>{sub}</span>
          </span>
        </Link>
      ))}
    </div>
  );
}
