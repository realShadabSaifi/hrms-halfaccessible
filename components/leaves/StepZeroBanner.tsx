import styles from "./StepZeroBanner.module.scss";

export function StepZeroBanner() {
  return (
    <div className={styles.banner}>
      <span aria-hidden="true">🗣️</span>
      <span>
        <b>Step 0, always:</b> sync with your POC before <i>and during</i> your leave.
        Keep talking - not a one-time heads up.
      </span>
    </div>
  );
}
