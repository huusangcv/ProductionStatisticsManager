import { Button } from "@mui/material";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import SectionCard from "./SectionCard";

const s = {
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 },
  dropzone: {
    border: "1.5px dashed rgba(37, 99, 235, 0.26)",
    borderRadius: 16,
    backgroundColor: "#f8fbff",
    padding: 24,
    display: "grid",
    placeItems: "center",
    textAlign: "center",
    minHeight: 220,
  },
  dropContent: { display: "flex", flexDirection: "column", alignItems: "center", gap: 12 },
  uploadCircle: {
    width: 72, height: 72, borderRadius: "50%", backgroundColor: "#eaf2ff",
    color: "#2f6df6", display: "grid", placeItems: "center",
  },
  dropTitle: { fontSize: 16, fontWeight: 800, color: "#0f172a" },
  dropSub: { fontSize: 13, color: "#64748b", marginTop: 4 },
  fileListHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  fileListTitle: { fontWeight: 800, fontSize: 14, color: "#0f172a" },
  fileListSub: { fontSize: 12, color: "#64748b" },
  filesContainer: { display: "flex", flexDirection: "column", gap: 12 },
  fileItem: {
    padding: 12, borderRadius: 12,
    border: "1px solid var(--color-border)", backgroundColor: "#fff",
  },
  fileRow: { display: "flex", alignItems: "center", gap: 12, marginBottom: 8 },
  fileIcon: {
    width: 32, height: 32, borderRadius: 8, backgroundColor: "#eaf2ff",
    display: "grid", placeItems: "center",
  },
  fileInfo: { flex: 1, minWidth: 0 },
  fileName: { fontWeight: 700, fontSize: 14, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  fileMeta: { fontSize: 12, color: "#64748b" },
  fileStatus: { fontWeight: 800, fontSize: 12 },
  progressTrack: { height: 6, borderRadius: 999, backgroundColor: "rgba(37, 99, 235, 0.1)", overflow: "hidden" },
  caption: { fontSize: 12, color: "#64748b", marginTop: 8 },
};

function ImportPanel({ files }) {
  return (
    <SectionCard title="Import Excel">
      <div style={s.grid}>
        <div style={s.dropzone}>
          <div style={s.dropContent}>
            <div style={s.uploadCircle}>
              <CloudUploadOutlinedIcon style={{ fontSize: 40 }} />
            </div>
            <div>
              <div style={s.dropTitle}>Kéo & thả file Excel vào đây</div>
              <div style={s.dropSub}>Hoặc chọn file để tạo mô phỏng luồng nhập dữ liệu.</div>
            </div>
            <Button
              variant="contained"
              sx={{ borderRadius: 999, px: 3, py: 1, textTransform: "none", fontWeight: 700, fontSize: 13 }}
            >
              Chọn file từ máy
            </Button>
            <div style={s.caption}>Hỗ trợ định dạng .xlsx, .xlsm, tối đa 50MB</div>
          </div>
        </div>

        <div>
          <div style={s.fileListHeader}>
            <span style={s.fileListTitle}>File vừa nhập</span>
            <span style={s.fileListSub}>Mô phỏng tiến trình nhập</span>
          </div>
          <div style={s.filesContainer}>
            {files.map((file) => (
              <div key={file.name} style={s.fileItem}>
                <div style={s.fileRow}>
                  <div style={s.fileIcon}>
                    <InsertDriveFileOutlinedIcon style={{ color: "#2f6df6", fontSize: 18 }} />
                  </div>
                  <div style={s.fileInfo}>
                    <div style={s.fileName}>{file.name}</div>
                    <div style={s.fileMeta}>{file.meta}</div>
                  </div>
                  <span style={{ ...s.fileStatus, color: file.tone }}>{file.status}</span>
                </div>
                <div style={s.progressTrack}>
                  <div
                    style={{
                      height: "100%",
                      width: `${file.progress}%`,
                      borderRadius: 999,
                      background: file.bar,
                      transition: "width 0.5s ease",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

export default ImportPanel;
