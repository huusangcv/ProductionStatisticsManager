import { useState, useEffect } from "react";
import { Box, Typography, Paper, Grid, Button, LinearProgress } from "@mui/material";
import UpdateOutlinedIcon from "@mui/icons-material/UpdateOutlined";
import AutorenewOutlinedIcon from "@mui/icons-material/AutorenewOutlined";
import { useUpdate } from "../../../context/UpdateContext";

const UpdateTab = () => {
  const [currentVersion, setCurrentVersion] = useState("—");
  const {
    updateAvailable,
    updateInfo,
    updateDownloaded,
    downloadProgress,
    updateError,
    updateStatus,
    checkForUpdate,
    downloadUpdate,
    installUpdate,
  } = useUpdate();

  useEffect(() => {
    window.electronAPI.app.getVersion().then((res) => {
      setCurrentVersion(res?.version ?? "—");
    });
  }, []);

  const handleCheckUpdate = async () => {
    setChecking(true);
    setError(null);
    setDownloaded(false);
    setProgress(null);
    try {
      await window.electronAPI.update.check();
    } catch (err) {
      setError(err.message);
      setChecking(false);
    }
  };

  const handleDownload = async () => {
    try {
      await window.electronAPI.update.download();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleInstall = async () => {
    await window.electronAPI.update.install();
  };

  return (
    <Box sx={{ p: 3, height: "100%", overflow: "auto" }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ borderRadius: 2, p: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
              <UpdateOutlinedIcon sx={{ mr: 1, color: "primary.main" }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Cập nhật phần mềm
              </Typography>
            </Box>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ p: 2, bgcolor: "#fafafa", borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Phiên bản hiện tại
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 0.5, fontWeight: 500 }}>
                    v{currentVersion}
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Box sx={{ p: 2, bgcolor: updateInfo ? "#e3f2fd" : "#fafafa", borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Phiên bản mới nhất
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 0.5, fontWeight: 500, color: updateInfo ? "primary.main" : "text.primary" }}>
                    {updateInfo ? `v${updateInfo.version}` : "—"}
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            {updateInfo && updateInfo.releaseNotes && (
              <Box sx={{ mt: 3, p: 2, bgcolor: "#fff3e0", borderRadius: 1, border: "1px solid #ffe0b2" }}>
                <Typography variant="subtitle2" sx={{ mb: 1, color: "#e65100" }}>
                  Release Notes (v{updateInfo.version}):
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }} dangerouslySetInnerHTML={{ __html: updateInfo.releaseNotes }} />
              </Box>
            )}

            {updateStatus === "downloading" && downloadProgress && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Đang tải xuống... {Math.round(downloadProgress.percent)}% 
                  ({(downloadProgress.transferred / 1024 / 1024).toFixed(2)} MB / {(downloadProgress.total / 1024 / 1024).toFixed(2)} MB)
                  - Tốc độ: {(downloadProgress.bytesPerSecond / 1024 / 1024).toFixed(2)} MB/s
                </Typography>
                <LinearProgress variant="determinate" value={downloadProgress.percent} sx={{ height: 8, borderRadius: 4 }} />
              </Box>
            )}

            <Box sx={{ mt: 4, display: "flex", gap: 2, alignItems: "center" }}>
              {!updateAvailable && !updateDownloaded && (
                <Button
                  variant="contained"
                  startIcon={<AutorenewOutlinedIcon />}
                  onClick={checkForUpdate}
                  disabled={updateStatus === "checking"}
                >
                  {updateStatus === "checking" ? "Đang kiểm tra..." : "Kiểm tra bản cập nhật mới"}
                </Button>
              )}

              {updateAvailable && !updateDownloaded && (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={downloadUpdate}
                  disabled={updateStatus === "downloading"}
                >
                  Tải xuống bản cập nhật
                </Button>
              )}

              {updateDownloaded && (
                <Button
                  variant="contained"
                  color="success"
                  onClick={installUpdate}
                >
                  Khởi động lại & Cập nhật
                </Button>
              )}
            </Box>

            {updateStatus === "not-available" && (
              <Typography variant="body2" color="success.main" sx={{ mt: 2 }}>
                Bạn đang sử dụng phiên bản mới nhất!
              </Typography>
            )}

            {updateError && (
              <Typography variant="body2" color="error.main" sx={{ mt: 2 }}>
                Lỗi cập nhật: {updateError}
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default UpdateTab;
