import { useState, useMemo } from "react";
import { MenuItem, Select, FormControl } from "@mui/material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import SectionCard from "./SectionCard";

function LineChartPanel({ title, data = [] }) {
  const [period, setPeriod] = useState("30"); // 7, 30, 90, 365

  const chartData = useMemo(() => {
    // data is expected to be sorted by date ascending
    const days = parseInt(period, 10);
    return data.slice(-days).map((item) => ({
      name: item.label,
      value: item.value,
    }));
  }, [data, period]);

  const filterAction = (
    <FormControl size="small" variant="standard" sx={{ minWidth: 90 }}>
      <Select
        value={period}
        onChange={(e) => setPeriod(e.target.value)}
        disableUnderline
        sx={{
          fontSize: 13,
          fontWeight: 600,
          color: "#3b82f6",
          "& .MuiSelect-select": {
            paddingRight: "24px !important",
            paddingTop: "4px",
            paddingBottom: "4px",
          },
          "& .MuiSvgIcon-root": {
            color: "#3b82f6",
          },
        }}
      >
        <MenuItem value="7">7 ngày</MenuItem>
        <MenuItem value="30">30 ngày</MenuItem>
        <MenuItem value="90">90 ngày</MenuItem>
        <MenuItem value="365">365 ngày</MenuItem>
      </Select>
    </FormControl>
  );

  return (
    <SectionCard title={title} action={filterAction}>
      <div style={{ width: "100%", height: 320, marginTop: 16 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 12, right: 12, bottom: 4, left: -16 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#f1f5f9"
            />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fontWeight: 500, fill: "#64748b" }}
              dy={8}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fontWeight: 500, fill: "#64748b" }}
              tickFormatter={(v) =>
                v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v
              }
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                boxShadow: "0 4px 12px rgba(15, 23, 42, 0.08)",
                padding: "8px 12px",
              }}
              labelStyle={{ fontWeight: 600, fontSize: 13, color: "#0f172a", marginBottom: 4 }}
              itemStyle={{ fontWeight: 600, fontSize: 13, color: "#3b82f6" }}
              formatter={(val) => [val.toLocaleString("vi-VN"), "Sản lượng"]}
              cursor={{ stroke: "#e2e8f0", strokeWidth: 2, strokeDasharray: "4 4" }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ r: 4, fill: "#fff", stroke: "#3b82f6", strokeWidth: 2 }}
              activeDot={{ r: 6, fill: "#3b82f6", stroke: "#fff", strokeWidth: 2 }}
              animationDuration={1500}
              animationEasing="ease-out"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </SectionCard>
  );
}

export default LineChartPanel;
