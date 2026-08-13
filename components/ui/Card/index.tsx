import styles from "./Card.module.scss";

export function Card({
  children,
  className = "",
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "article";
}) {
  return <Tag className={`${styles.root} ${className}`}>{children}</Tag>;
}
