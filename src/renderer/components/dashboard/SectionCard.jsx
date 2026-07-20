function SectionCard({ title, action, children }) {
  return (
    <div style={{
      backgroundColor: "#ffffff",
      border: "1px solid #e5e7eb",
      borderRadius: 16,
      padding: 20,
      boxShadow: "0 4px 12px rgba(15, 23, 42, 0.05)",
      height: "100%",
      display: "flex",
      flexDirection: "column"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
          {title}
        </h3>
        {action && <div>{action}</div>}
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        {children}
      </div>
    </div>
  );
}

export default SectionCard;
