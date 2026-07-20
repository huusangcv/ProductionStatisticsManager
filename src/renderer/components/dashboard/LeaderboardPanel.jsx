import { Button } from "@mui/material";
import SectionCard from "./SectionCard";

const st = {
  list: { display: "flex", flexDirection: "column", gap: 16 },
  row: { display: "flex", alignItems: "center", gap: 12 },
  avatar: {
    width: 40, height: 40, borderRadius: "50%",
    display: "grid", placeItems: "center",
    fontSize: 14, fontWeight: 700, color: "#0f172a", flexShrink: 0,
  },
  info: { flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 },
  nameRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  name: { fontWeight: 600, fontSize: 14, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  role: { fontSize: 12, color: "#64748b" },
  val: { fontWeight: 700, fontSize: 14, color: "#0f172a", flexShrink: 0 },
  track: { height: 8, borderRadius: 999, backgroundColor: "#f1f5f9", overflow: "hidden", width: "100%", marginTop: 2 },
  bar: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#3b82f6",
    transition: "width 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
  }
};

function LeaderboardPanel({ title, items }) {
  return (
    <SectionCard title={title}>
      <div style={st.list}>
        {items.map((item, index) => (
          <div key={item.name} style={st.row}>
            <div style={{ ...st.avatar, backgroundColor: item.color || "#e2e8f0" }}>
              {item.shortName}
            </div>
            <div style={st.info}>
              <div style={st.nameRow}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={st.name}>{item.name}</span>
                  <span style={st.role}>{item.roleName}</span>
                </div>
                <span style={st.val}>{item.value.toLocaleString("vi-VN")} pcs</span>
              </div>
              <div style={st.track}>
                <div
                  style={{
                    ...st.bar,
                    width: `${item.percent}%`,
                  }}
                />
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div style={{ textAlign: "center", color: "#64748b", padding: "20px 0" }}>Chưa có dữ liệu</div>
        )}
      </div>
      <div style={{ marginTop: 24, textAlign: "center" }}>
        <Button 
          variant="text" 
          color="primary"
          onClick={() => {
            document.getElementById("dataGridSection")?.scrollIntoView({ behavior: "smooth" });
          }}
          sx={{ textTransform: "none", fontWeight: 600 }}
        >
          Xem tất cả
        </Button>
      </div>
    </SectionCard>
  );
}

export default LeaderboardPanel;
