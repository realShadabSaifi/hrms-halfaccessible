import styles from "./Badge.module.scss";

export type BadgeStatus =
  | "Pending"
  | "Approved"
  | "Rejected"
  | "Voting"
  | "Emergency";

const statusClass: Record<BadgeStatus, string> = {
  Pending: styles.pending,
  Approved: styles.approved,
  Rejected: styles.rejected,
  Voting: styles.voting,
  Emergency: styles.emergency,
};

export function Badge({
  status,
  children,
}: {
  status: BadgeStatus;
  children?: React.ReactNode;
}) {
  return (
    <span
      className={`${styles.root} ${statusClass[status]}`}
      data-status={status}
    >
      {children ?? status}
    </span>
  );
}
