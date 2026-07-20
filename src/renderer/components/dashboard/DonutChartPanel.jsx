import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import SectionCard from "./SectionCard";

const COLORS = ["#2563eb", "#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe", "#e2e8f0"];

function DonutChartPanel({ title, totalLabel = "Tổng", totalValue, data = [] }) {
  // Sort data and group top 5, rest to "Khác"
  const sortedData = [...data].sort((a, b) => b.value - a.value);
  let chartData = [];
  if (sortedData.length > 5) {
    const top5 = sortedData.slice(0, 5);
    const others = sortedData.slice(5).reduce((acc, curr) => acc + curr.value, 0);
    chartData = [...top5, { name: "Khác", value: others }];
  } else {
    chartData = sortedData;
  }

  return (
    <SectionCard title={title}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
        <div style={{ position: "relative", width: 220, height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius="60%"
                outerRadius="90%"
                paddingAngle={2}
                dataKey="value"
                animationDuration={1200}
                animationEasing="ease-out"
                stroke="none"
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip 
                formatter={(val) => val.toLocaleString("vi-VN")}
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                  boxShadow: "0 4px 12px rgba(15, 23, 42, 0.1)",
                  padding: "8px 12px",
                }}
                itemStyle={{ fontWeight: 600, fontSize: 13, color: "#0f172a" }}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Center label */}
          <div
            style={{
              position: "absolute", top: "50%", left: "50%",
              transform: "translate(-50%, -50%)", textAlign: "center",
              pointerEvents: "none",
            }}
          >
            <div style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.2, color: "#0f172a" }}>
              {totalValue?.toLocaleString("vi-VN") || 0}
            </div>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#64748b", marginTop: 4 }}>
              {totalLabel}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
          {chartData.map((item, i) => {
            const percent = totalValue > 0 ? ((item.value / totalValue) * 100).toFixed(1) : 0;
            return (
              <div key={item.name} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 12, height: 12, borderRadius: 3,
                    backgroundColor: COLORS[i % COLORS.length],
                    flexShrink: 0,
                  }}
                />
                <div style={{ fontSize: 13, fontWeight: 500, color: "#334155", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {item.name}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", width: 80, textAlign: "right" }}>
                    {item.value?.toLocaleString("vi-VN")}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "#64748b", width: 40, textAlign: "right" }}>
                    {percent}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </SectionCard>
  );
}

export default DonutChartPanel;
