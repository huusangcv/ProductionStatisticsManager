import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import KpiCard from "../../components/dashboard/KpiCard";
import BarChartPanel from "../../components/dashboard/BarChartPanel";
import DonutChartPanel from "../../components/dashboard/DonutChartPanel";
import LeaderboardPanel from "../../components/dashboard/LeaderboardPanel";
import ImportPanel from "../../components/dashboard/ImportPanel";
import RecentFilesTable from "../../components/dashboard/RecentFilesTable";
import styles from "./DashboardPage.module.css";

const kpiCards = [
  {
    title: "Tổng sản lượng hôm nay",
    value: "12,750",
    suffix: "Sản phẩm",
    delta: "+15.6% so với hôm qua",
    deltaTone: "up",
    color: "#2563eb",
    icon: <TrendingUpRoundedIcon />,
    sparkline: [18, 20, 19, 26, 24, 31, 30],
  },
  {
    title: "Tổng nhân viên",
    value: "523",
    suffix: "Người",
    delta: "-8 người so với tháng trước",
    deltaTone: "down",
    color: "#16a34a",
    icon: <PeopleAltOutlinedIcon />,
    sparkline: [22, 23, 25, 24, 26, 28, 27],
  },
  {
    title: "Tổng file đã xử lý",
    value: "128",
    suffix: "File",
    delta: "+20 file so với tuần trước",
    deltaTone: "up",
    color: "#7c3aed",
    icon: <DescriptionOutlinedIcon />,
    sparkline: [11, 12, 15, 16, 19, 18, 22],
  },
  {
    title: "Tỷ lệ hoàn thành",
    value: "92.4%",
    delta: "+7.2% so với tuần trước",
    deltaTone: "up",
    color: "#f59e0b",
    icon: <CheckCircleOutlineRoundedIcon />,
    sparkline: [88, 89, 90, 91, 92, 93, 92],
  },
];

const bars = [
  { label: "11/05", value: 8450, color: "#5b93ea" },
  { label: "12/05", value: 9210, color: "#5b93ea" },
  { label: "13/05", value: 10300, color: "#5b93ea" },
  { label: "14/05", value: 11540, color: "#5b93ea" },
  { label: "15/05", value: 12650, color: "#5b93ea" },
  { label: "16/05", value: 11980, color: "#2f6df6" },
  { label: "17/05", value: 12750, color: "#2f6df6" },
];

const leaderboardItems = [
  { name: "Nguyễn Văn A", shortName: "NA", value: 1250, percent: 94, color: "#c4d8ff" },
  { name: "Trần Thị B", shortName: "TB", value: 1180, percent: 90, color: "#d8e7ff" },
  { name: "Lê Văn C", shortName: "LC", value: 1050, percent: 82, color: "#f0dfff" },
  { name: "Phạm Thị D", shortName: "PD", value: 980, percent: 78, color: "#ffe8cc" },
  { name: "Hoàng Văn E", shortName: "HE", value: 870, percent: 72, color: "#e6f3ff" },
  { name: "Đỗ Thị F", shortName: "DF", value: 820, percent: 68, color: "#f2f4ff" },
  { name: "Bùi Văn G", shortName: "BG", value: 760, percent: 62, color: "#e8fff8" },
  { name: "Nguyễn Thị H", shortName: "NH", value: 720, percent: 59, color: "#eef2ff" },
  { name: "Trần Văn I", shortName: "TI", value: 680, percent: 55, color: "#e6f0ff" },
  { name: "Lê Thị K", shortName: "LK", value: 640, percent: 51, color: "#eaf8ff" },
];

const importedFiles = [
  { name: "SanLuong_2025_05_17.xlsx", meta: "12.5 MB / 17/05/2025 09:30", status: "100%", progress: 100, tone: "#16a34a", bar: "linear-gradient(90deg, #22c55e 0%, #16a34a 100%)" },
  { name: "SanLuong_2025_05_16.xlsx", meta: "11.8 MB / 16/05/2025 14:20", status: "100%", progress: 100, tone: "#16a34a", bar: "linear-gradient(90deg, #22c55e 0%, #16a34a 100%)" },
  { name: "SanLuong_2025_05_15.xlsx", meta: "10.7 MB / 15/05/2025 10:15", status: "75%", progress: 75, tone: "#2563eb", bar: "linear-gradient(90deg, #60a5fa 0%, #2563eb 100%)" },
  { name: "SanLuong_2025_05_14.xlsx", meta: "9.3 MB / 14/05/2025 08:45", status: "0%", progress: 0, tone: "#ef4444", bar: "linear-gradient(90deg, #f87171 0%, #ef4444 100%)" },
];

const recentFiles = [
  { name: "SanLuong_2025_05_17.xlsx", date: "17/05/2025 09:30", status: "Thành công", statusBg: "#e9f9ef", statusColor: "#15803d", quantity: 12750, creator: "Admin" },
  { name: "SanLuong_2025_05_16.xlsx", date: "16/05/2025 14:20", status: "Thành công", statusBg: "#e9f9ef", statusColor: "#15803d", quantity: 11980, creator: "Admin" },
  { name: "SanLuong_2025_05_15.xlsx", date: "15/05/2025 10:15", status: "Đang xử lý", statusBg: "#eef4ff", statusColor: "#2563eb", quantity: 10300, creator: "Admin" },
  { name: "SanLuong_2025_05_14.xlsx", date: "14/05/2025 08:45", status: "Thất bại", statusBg: "#fef1f2", statusColor: "#dc2626", quantity: 0, creator: "Admin" },
  { name: "SanLuong_2025_05_13.xlsx", date: "13/05/2025 16:30", status: "Thành công", statusBg: "#e9f9ef", statusColor: "#15803d", quantity: 9210, creator: "Admin" },
];

function DashboardPage() {
  return (
    <>
      <div className={styles.dashboardGrid}>
        {/* Row 1: Import Panel & Recent Files */}
        <div className={styles.importPanel}>
          <ImportPanel files={importedFiles} />
        </div>
        <div className={styles.recentFiles}>
          <RecentFilesTable rows={recentFiles} />
        </div>

        {/* Row 2: KPI Cards */}
        {kpiCards.map((card) => (
          <div key={card.title} className={styles.kpiCard}>
            <KpiCard {...card} />
          </div>
        ))}

        {/* Row 3: Leaderboard (Left) & Charts (Right) */}
        <div className={styles.leaderboard}>
          <LeaderboardPanel
            title="Top 10 nhân viên có sản lượng cao nhất"
            items={leaderboardItems}
          />
        </div>

        <div className={styles.chartsArea}>
          <div className={styles.barChart}>
            <BarChartPanel
              title="Sản lượng theo ngày"
              periodLabel={
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <CalendarMonthOutlinedIcon style={{ fontSize: 16 }} />7 ngày qua
                </div>
              }
              bars={bars}
              scaleLabels={["0K", "2K", "4K", "6K", "8K", "10K", "12K", "14K"]}
              hoverTable={[
                { label: "Giá trị cao nhất", value: "12,750", trend: "up" },
                { label: "Giá trị trung bình", value: "11,133", trend: "up" },
                { label: "Ngày hiện tại", value: "17/05", trend: "up" },
              ]}
            />
          </div>
          <div className={styles.donutChart}>
            <DonutChartPanel
              title="Tỷ lệ CÁT / MAI"
              total="12,750"
              leftLabel="CAT"
              leftValue="7,650"
              rightLabel="MAI"
              rightValue="5,100"
              leftPercent="60.0%"
              rightPercent="40.0%"
            />
          </div>
        </div>
      </div>

      <div className={styles.footer}>
        © 2025 Production Statistics Manager. All rights reserved.
      </div>
    </>
  );
}

export default DashboardPage;
