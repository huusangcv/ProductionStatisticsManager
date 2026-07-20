import { useState, useEffect, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import {
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Button,
} from "@mui/material";

import LineChartPanel from "../../components/dashboard/LineChartPanel";
import DonutChartPanel from "../../components/dashboard/DonutChartPanel";
import LeaderboardPanel from "../../components/dashboard/LeaderboardPanel";
import ProductionDataGrid from "../../components/shared/ProductionDataGrid";
import DataGridToolbarActions from "../../components/shared/DataGridToolbarActions";
import styles from "./DashboardPage.module.css";

import { getGrindingDataGridColumns } from "../../../constants/grindingColumns";
import { getCuttingDataGridColumns } from "../../../constants/cuttingColumns";

function calculateDateRange(rangeType) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let fromDate = new Date(today);
  let toDate = new Date(today);

  switch (rangeType) {
    case "Hôm nay":
      break;
    case "Hôm qua":
      fromDate.setDate(fromDate.getDate() - 1);
      toDate.setDate(toDate.getDate() - 1);
      break;
    case "Tuần này":
      const day = fromDate.getDay();
      const diff = fromDate.getDate() - day + (day === 0 ? -6 : 1);
      fromDate.setDate(diff);
      break;
    case "Tuần trước":
      const prevWeek = new Date(today);
      prevWeek.setDate(prevWeek.getDate() - 7);
      const prevDay = prevWeek.getDay();
      const prevDiff = prevWeek.getDate() - prevDay + (prevDay === 0 ? -6 : 1);
      fromDate = new Date(prevWeek.setDate(prevDiff));
      toDate = new Date(fromDate);
      toDate.setDate(toDate.getDate() + 6);
      break;
    case "Tháng này":
      fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
      break;
    case "Tháng trước":
      fromDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      toDate = new Date(today.getFullYear(), today.getMonth(), 0);
      break;
    case "Năm nay":
      fromDate = new Date(today.getFullYear(), 0, 1);
      break;
    case "Tùy chọn":
      return null;
    default:
      break;
  }

  const format = (d) => {
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${month}-${day}`;
  };

  return { fromDate: format(fromDate), toDate: format(toDate) };
}

function DashboardPage() {
  const { onDashboardReady } = useOutletContext() ?? {};

  const [productionType, setProductionType] = useState("Mài");
  const [dateRange, setDateRange] = useState("Hôm nay");
  const [customFromDate, setCustomFromDate] = useState("");
  const [customToDate, setCustomToDate] = useState("");

  const [appliedFilters, setAppliedFilters] = useState({
    type: "Mài",
    fromDate: calculateDateRange("Hôm nay")?.fromDate,
    toDate: calculateDateRange("Hôm nay")?.toDate,
  });

  const [kpis, setKpis] = useState({
    total_quantity: 0,
  });
  const [topEmployees, setTopEmployees] = useState([]);
  const [topWorkOrders, setTopWorkOrders] = useState([]);
  const [productionByDate, setProductionByDate] = useState([]);
  const [gridData, setGridData] = useState([]);

  useEffect(() => {
    onDashboardReady?.();
  }, [onDashboardReady]);

  useEffect(() => {
    fetchDashboardData(appliedFilters);
  }, [appliedFilters]);

  const fetchDashboardData = async (filters) => {
    try {
      const [kpiRes, empRes, woRes, prodRes, gridRes] = await Promise.all([
        window.electronAPI.dashboard.getKPIs(filters),
        window.electronAPI.dashboard.getTopEmployees(filters),
        window.electronAPI.dashboard.getTopWorkOrders(filters),
        window.electronAPI.dashboard.getProductionByDate(filters),
        window.electronAPI.dashboard.getGridData(filters),
      ]);

      if (kpiRes.ok) setKpis(kpiRes.data);
      if (empRes.ok) setTopEmployees(empRes.data);
      if (woRes.ok) setTopWorkOrders(woRes.data);
      if (prodRes.ok) setProductionByDate(prodRes.data);
      if (gridRes.ok) setGridData(gridRes.data);
    } catch (error) {
      console.error("Failed to load dashboard data", error);
      alert("Lỗi khi tải dữ liệu Dashboard: " + error.message);
    }
  };

  const handleApplyFilters = () => {
    let fromD = customFromDate;
    let toD = customToDate;

    if (dateRange !== "Tùy chọn") {
      const calculated = calculateDateRange(dateRange);
      if (calculated) {
        fromD = calculated.fromDate;
        toD = calculated.toDate;
      }
    }

    setAppliedFilters({
      type: productionType,
      fromDate: fromD,
      toDate: toD,
    });
  };

  const leaderboardItems = topEmployees.map((emp) => ({
    name: emp.employee_full_name || emp.representative_code,
    roleName: emp.role || appliedFilters.type,
    shortName: (emp.employee_full_name || emp.representative_code).substring(0, 2).toUpperCase(),
    value: emp.total_quantity,
    percent: kpis.total_quantity > 0 ? Math.round((emp.total_quantity / kpis.total_quantity) * 100) : 0,
    color: "#e6f0ff",
  }));

  const donutData = topWorkOrders.map((wo) => ({
    name: wo.work_order_number || "Không có",
    value: wo.total_quantity,
  }));

  const lineChartData = productionByDate.map((prod) => ({
    label: prod.report_date.substring(5), // MM-DD
    value: prod.total_quantity,
  }));

  const gridColumns = useMemo(() => {
    return appliedFilters.type === "Mài"
      ? getGrindingDataGridColumns()
      : getCuttingDataGridColumns();
  }, [appliedFilters.type]);

  return (
    <Box sx={{ flex: 1, overflowY: "auto", overflowX: "hidden", p: 3, height: "100%", bgcolor: "#F8FAFC" }}>
      <div className={styles.dashboardGrid}>
        
        {/* Filter Bar */}
        <div className={styles.filterBar}>
          <FormControl size="small" style={{ minWidth: 150 }}>
            <InputLabel>Loại sản lượng</InputLabel>
            <Select
              value={productionType}
              label="Loại sản lượng"
              onChange={(e) => setProductionType(e.target.value)}
            >
              <MenuItem value="Mài">Mài</MenuItem>
              <MenuItem value="Cắt">Cắt</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" style={{ minWidth: 180 }}>
            <InputLabel>Khoảng thời gian</InputLabel>
            <Select
              value={dateRange}
              label="Khoảng thời gian"
              onChange={(e) => setDateRange(e.target.value)}
            >
              <MenuItem value="Hôm nay">Hôm nay</MenuItem>
              <MenuItem value="Hôm qua">Hôm qua</MenuItem>
              <MenuItem value="Tuần này">Tuần này</MenuItem>
              <MenuItem value="Tuần trước">Tuần trước</MenuItem>
              <MenuItem value="Tháng này">Tháng này</MenuItem>
              <MenuItem value="Tháng trước">Tháng trước</MenuItem>
              <MenuItem value="Năm nay">Năm nay</MenuItem>
              <MenuItem value="Tùy chọn">Tùy chọn</MenuItem>
            </Select>
          </FormControl>

          {dateRange === "Tùy chọn" && (
            <>
              <TextField
                type="date"
                label="Từ ngày"
                InputLabelProps={{ shrink: true }}
                size="small"
                value={customFromDate}
                onChange={(e) => setCustomFromDate(e.target.value)}
              />
              <TextField
                type="date"
                label="Đến ngày"
                InputLabelProps={{ shrink: true }}
                size="small"
                value={customToDate}
                onChange={(e) => setCustomToDate(e.target.value)}
              />
            </>
          )}

          <Button variant="contained" color="primary" onClick={handleApplyFilters} sx={{ ml: "auto", borderRadius: 2, padding: "6px 20px" }}>
            Lọc dữ liệu
          </Button>
        </div>

        {/* Row 1: Charts Area */}
        <div className={styles.leaderboard}>
          <LeaderboardPanel
            title="Top 5 nhân viên"
            items={leaderboardItems}
          />
        </div>
        <div className={styles.donutChart}>
          <DonutChartPanel
            title="Top 5 công đơn"
            totalLabel="Tổng sản phẩm"
            totalValue={donutData.reduce((acc, it) => acc + it.value, 0)}
            data={donutData}
          />
        </div>
        <div className={styles.lineChart}>
          <LineChartPanel
            title="Sản lượng theo ngày"
            data={lineChartData}
          />
        </div>

        {/* Row 2: DataGrid */}
        <div className={styles.dataGridArea} id="dataGridSection">
          <h3 style={{ margin: "0 0 20px 0", fontSize: 16, fontWeight: 700, color: "#0f172a" }}>Chi tiết sản lượng</h3>
          <Box sx={{ height: 670 }}>
            <ProductionDataGrid
              data={gridData}
              columnSpec={gridColumns}
              renderToolbar={() => <DataGridToolbarActions hasExport={true} />}
              enableDragDrop={false}
              summaryMode={appliedFilters.type === "Mài" ? "grinding" : "cutting"}
            />
          </Box>
        </div>
      </div>

      <div className={styles.footer}>
        © 2025 Production Statistics Manager. All rights reserved.
      </div>
    </Box>
  );
}

export default DashboardPage;
