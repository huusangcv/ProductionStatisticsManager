import styles from "./SectionCard.module.css";

function SectionCard({ title, action, children }) {
  return (
    <section className={styles.card}>
      <header className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        {action && <div>{action}</div>}
      </header>
      <div className={styles.content}>
        {children}
      </div>
    </section>
  );
}

export default SectionCard;
