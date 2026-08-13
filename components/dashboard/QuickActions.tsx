import Link from "next/link";
import { CalendarBlank, ChatTeardrop, Hamburger } from "@phosphor-icons/react/dist/ssr";
import styles from "./QuickActions.module.scss";

const actions = [
  { href: "/leaves", label: "request leave", sub: "inform, handoff, go", Icon: CalendarBlank },
  { href: "/burgers", label: "vote on holidays", sub: "democracy, but delicious", Icon: Hamburger },
  { href: "/anon", label: "drop an anonymous note", sub: "no names. just vibes.", Icon: ChatTeardrop },
];

export function QuickActions() {
  return (
    <div className={styles.grid}>
      {actions.map(({ href, label, sub, Icon }) => (
        <Link key={href} href={href} className={styles.btn}>
          <span className={styles.icon}>
            <Icon size={20} />
          </span>
          <span>
            <span className="block text-[14.5px] font-bold">{label}</span>
            <span className="mt-0.5 block text-xs text-[rgba(28,28,46,0.6)]">{sub}</span>
          </span>
        </Link>
      ))}
    </div>
  );
}
