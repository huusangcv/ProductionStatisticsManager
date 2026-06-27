import Sparkline from "./Sparkline";
import styles from "./KpiCard.module.css";

function KpiCard({
  title,
  value,
  suffix,
  delta,
  deltaTone,
  color,
  icon,
  sparkline,
}) {
  const isPercentCard = !suffix && typeof value === "string" && value.includes("%");

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div
          className={styles.icon}
          style={{ backgroundColor: `${color}16`, color }}
        >
          {icon}
        </div>
        <span className={styles.title}>{title}</span>
      </div>

      <div className={styles.body}>
        <div>
          <div className={styles.valueContainer}>
            <span className={styles.value}>{value}</span>
            {suffix && <span className={styles.suffix}>{suffix}</span>}
          </div>
          <div className={styles.footer}>
            <span
              className={`${styles.delta} ${
                deltaTone === "up" ? styles.deltaUp : styles.deltaDown
              }`}
            >
              {deltaTone === "up" ? "↑ " : deltaTone === "down" ? "↓ " : ""}
              {delta}
            </span>
          </div>
        </div>

        <div className={styles.chartContainer}>
          {isPercentCard ? (
            <CircularKpi value={parseFloat(value)} color={color} />
          ) : (
            <Sparkline values={sparkline} color={color} />
          )}
        </div>
      </div>
    </div>
  );
}

function CircularKpi({ value, color }) {
  const radius = 32;
  const stroke = 6;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
      <svg height={radius * 2} width={radius * 2}>
        <circle
          stroke="rgba(15, 23, 42, 0.06)"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke={color}
          fill="transparent"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          style={{
            transform: "rotate(-90deg)",
            transformOrigin: "50% 50%",
            transition: "stroke-dashoffset 1s ease",
          }}
        />
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="13"
          fontWeight="800"
          fill={color}
          fontFamily="Inter, system-ui, sans-serif"
        >
          {value}%
        </text>
      </svg>
    </div>
  );
}

export default KpiCard;
