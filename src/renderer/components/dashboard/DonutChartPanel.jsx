import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import SectionCard from "./SectionCard";

const COLORS = ["#2f6df6", "#58c7c3"];

function DonutChartPanel({
  title,
  total,
  leftLabel,
  leftValue,
  rightLabel,
  rightValue,
  leftPercent,
  rightPercent,
}) {
  const data = [
    { name: leftLabel, value: parseFloat(leftValue.replace(/,/g, "")) },
    { name: rightLabel, value: parseFloat(rightValue.replace(/,/g, "")) },
  ];

  return (
    <SectionCard title={title}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <div style={{ position: "relative", width: 200, height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius="56%"
                outerRadius="92%"
                paddingAngle={2}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
                animationDuration={1200}
                animationEasing="ease-out"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index]}
                    style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.1))" }}
                  />
                ))}
              </Pie>
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
            <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.1, color: "#0f172a" }}>
              {total}
            </div>
            <div style={{ fontSize: 12, color: "#64748b" }}>Tổng sản lượng</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          <LegendItem color={COLORS[0]} label={leftLabel} value={leftValue} percent={leftPercent} />
          <LegendItem color={COLORS[1]} label={rightLabel} value={rightValue} percent={rightPercent} />
        </div>
      </div>
    </SectionCard>
  );
}

function LegendItem({ color, label, value, percent }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 140 }}>
      <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: color, flexShrink: 0 }} />
      <div>
        <div style={{ fontWeight: 700, fontSize: 14 }}>{label}</div>
        <div style={{ fontSize: 12, color: "#64748b" }}>
          {value} ({percent})
        </div>
      </div>
    </div>
  );
}

export default DonutChartPanel;
