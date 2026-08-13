import styles from "./Toggle.module.scss";

export function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={`${styles.root} ${checked ? styles.on : ""}`}
      onClick={() => onChange(!checked)}
    >
      <span className={styles.track}>
        <span className={styles.knob} />
      </span>
      <span>
        <span className="block text-[13.5px] font-bold">{label}</span>
        {hint ? (
          <span className="mt-0.5 block text-[11.5px] text-[rgba(28,28,46,0.6)]">
            {hint}
          </span>
        ) : null}
      </span>
    </button>
  );
}
