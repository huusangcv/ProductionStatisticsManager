import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import ConstructionOutlinedIcon from '@mui/icons-material/ConstructionOutlined';
import ContentCutOutlinedIcon from '@mui/icons-material/ContentCutOutlined';
import ManageAccountsOutlinedIcon from '@mui/icons-material/ManageAccountsOutlined';
import PersonOffOutlinedIcon from '@mui/icons-material/PersonOffOutlined';
import HowToRegOutlinedIcon from '@mui/icons-material/HowToRegOutlined';
import styles from './StatisticsCards.module.css';

function StatCard({ title, value, icon, color, trend, trendTone }) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div
          className={styles.iconWrapper}
          style={{ backgroundColor: `${color}16`, color }}
        >
          {icon}
        </div>
        <div className={styles.title}>{title}</div>
      </div>
      <div className={styles.body}>
        <div className={styles.value}>{value}</div>
        {trend && (
          <div
            className={`${styles.trend} ${
              trendTone === 'up'
                ? styles.trendUp
                : trendTone === 'down'
                ? styles.trendDown
                : styles.trendNeutral
            }`}
          >
            {trend}
          </div>
        )}
      </div>
    </div>
  );
}

function StatisticsCards({ stats }) {
  const cards = [
    {
      title: "Tổng nhân sự",
      value: stats.total,
      icon: <PeopleAltOutlinedIcon fontSize="small" />,
      color: "#2563eb",
      trend: "+12",
      trendTone: "up"
    },
    {
      title: "Tổ Mài",
      value: stats.grinding,
      icon: <ConstructionOutlinedIcon fontSize="small" />,
      color: "#0891b2",
      trend: "+5",
      trendTone: "up"
    },
    {
      title: "Tổ Cắt",
      value: stats.cutting,
      icon: <ContentCutOutlinedIcon fontSize="small" />,
      color: "#059669",
      trend: "+7",
      trendTone: "up"
    },
    {
      title: "Quản lý / Thống kê",
      value: stats.managers,
      icon: <ManageAccountsOutlinedIcon fontSize="small" />,
      color: "#7c3aed",
      trend: "0",
      trendTone: "neutral"
    },
    {
      title: "Nghỉ việc",
      value: stats.inactive,
      icon: <PersonOffOutlinedIcon fontSize="small" />,
      color: "#dc2626",
      trend: "-2",
      trendTone: "down"
    },
    {
      title: "Điểm danh hôm nay",
      value: stats.attendance,
      icon: <HowToRegOutlinedIcon fontSize="small" />,
      color: "#f59e0b",
      trend: "95%",
      trendTone: "up"
    }
  ];

  return (
    <div className={styles.grid}>
      {cards.map((c, i) => (
        <StatCard key={i} {...c} />
      ))}
    </div>
  );
}

export default StatisticsCards;
