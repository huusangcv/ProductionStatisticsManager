import SectionCard from "./SectionCard";

const st = {
  list: { display: "flex", flexDirection: "column", gap: 12 },
  row: { display: "flex", alignItems: "center", gap: 10 },
  rank: { width: 18, fontSize: 13, fontWeight: 800, color: "#64748b", textAlign: "center", flexShrink: 0 },
  avatar: {
    width: 28, height: 28, borderRadius: "50%",
    display: "grid", placeItems: "center",
    fontSize: 11, fontWeight: 800, color: "#0f172a", flexShrink: 0,
  },
  info: { flex: 1, minWidth: 0 },
  nameRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  name: { fontWeight: 700, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  val: { fontWeight: 800, fontSize: 13, color: "#64748b", flexShrink: 0 },
  track: { height: 6, borderRadius: 999, backgroundColor: "rgba(37, 99, 235, 0.1)", overflow: "hidden" },
};

function LeaderboardPanel({ title, items }) {
  return (
    <SectionCard title={title}>
      <div style={st.list}>
        {items.map((item, index) => (
          <div key={item.name} style={st.row}>
            <span style={st.rank}>{index + 1}</span>
            <div style={{ ...st.avatar, backgroundColor: item.color }}>
              {item.shortName}
            </div>
            <div style={st.info}>
              <div style={st.nameRow}>
                <span style={st.name}>{item.name}</span>
                <span style={st.val}>{item.value.toLocaleString("vi-VN")}</span>
              </div>
              <div style={st.track}>
                <div
                  style={{
                    height: "100%",
                    width: `${item.percent}%`,
                    borderRadius: 999,
                    background: "linear-gradient(90deg, #2f6df6 0%, #6aa7ff 100%)",
                    transition: "width 0.5s ease",
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

export default LeaderboardPanel;
