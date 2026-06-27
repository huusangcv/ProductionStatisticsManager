import { Chip } from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";
import SectionCard from "./SectionCard";

function BarChartPanel({ title, periodLabel, bars, scaleLabels, hoverTable }) {
  const chartData = bars.map((item) => ({
    name: item.label,
    value: item.value,
    color: item.color,
  }));

  return (
    <SectionCard
      title={title}
      action={
        <Chip
          label={periodLabel}
          size="small"
          variant="outlined"
          sx={{ borderRadius: 999 }}
        />
      }
    >
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 0.9fr", gap: 16, alignItems: "stretch" }}>
        <div style={{ minHeight: 240 }}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={chartData}
              margin={{ top: 24, right: 8, bottom: 4, left: -8 }}
              barCategoryGap="22%"
            >
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2f6df6" stopOpacity={1} />
                  <stop offset="100%" stopColor="#5b93ea" stopOpacity={0.85} />
                </linearGradient>
                <linearGradient id="barGradientHighlight" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2f6df6" stopOpacity={1} />
                  <stop offset="100%" stopColor="#1d4ed8" stopOpacity={1} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="rgba(15, 23, 42, 0.06)"
              />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fontWeight: 600, fill: "#94a3b8" }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                tickFormatter={(v) =>
                  v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v
                }
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid var(--color-border)",
                  borderRadius: 12,
                  boxShadow: "0 12px 32px rgba(15, 23, 42, 0.12)",
                  padding: "10px 14px",
                }}
                labelStyle={{ fontWeight: 700, fontSize: 13, color: "#0f172a", marginBottom: 4 }}
                itemStyle={{ fontWeight: 600, fontSize: 12 }}
                formatter={(val) => [val.toLocaleString("vi-VN"), "Sản lượng"]}
                cursor={{ fill: "rgba(37, 99, 235, 0.06)" }}
              />
              <Bar dataKey="value" radius={[8, 8, 0, 0]} animationDuration={1000} animationEasing="ease-out">
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={index >= chartData.length - 2 ? "url(#barGradientHighlight)" : "url(#barGradient)"}
                  />
                ))}
                <LabelList
                  dataKey="value"
                  position="top"
                  formatter={(val) => val.toLocaleString("vi-VN")}
                  style={{ fontSize: 11, fontWeight: 700, fill: "#64748b" }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div
          style={{
            borderRadius: 12, backgroundColor: "#f8fafc",
            border: "1px solid var(--color-border)",
            padding: 16, display: "flex", flexDirection: "column", gap: 10,
          }}
        >
          <div style={{ fontWeight: 700, color: "#64748b", fontSize: 14 }}>
            Bảng dữ liệu điểm
          </div>
          {hoverTable.map((row) => (
            <div
              key={row.label}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
            >
              <span style={{ fontWeight: 600, fontSize: 14 }}>{row.label}</span>
              <span
                style={{
                  color: row.trend === "up" ? "#16a34a" : "#2563eb",
                  fontWeight: 700, fontSize: 14,
                }}
              >
                {row.value}
              </span>
            </div>
          ))}
          <div
            style={{
              marginTop: "auto", paddingTop: 12,
              borderTop: "1px dashed rgba(15, 23, 42, 0.12)",
            }}
          >
            <span style={{ fontSize: 12, color: "#64748b" }}>
              Rê chuột lên cột để xem chi tiết dữ liệu.
            </span>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

export default BarChartPanel;
