import { useState, useEffect } from "react";
import { Box, Typography, Paper, Grid, Button } from "@mui/material";
import FolderOpenOutlinedIcon from "@mui/icons-material/FolderOpenOutlined";
import BackupOutlinedIcon from "@mui/icons-material/BackupOutlined";
import RestoreOutlinedIcon from "@mui/icons-material/RestoreOutlined";
import { useBackupRestore } from "../../../hooks/useBackupRestore";

const SystemTab = () => {
  const [version, setVersion] = useState(null);
  const [dbSize, setDbSize] = useState(null);
  const [templateCount, setTemplateCount] = useState(0);
  const { createBackup, restoreBackup } = useBackupRestore();

  useEffect(() => {
    window.electronAPI.app.getVersion().then((res) => {
      setVersion(res?.version ?? "—");
    });
  }, []);

  const dataRoot = "D:\\ProductionStatisticsManager";
  const folders = [
    { label: "Data Folder", path: dataRoot },
    { label: "Database", path: `${dataRoot}\\database\\production.db` },
    { label: "Export Folder", path: `${dataRoot}\\exports` },
    { label: "Template Folder", path: `${dataRoot}\\templates` },
    { label: "Backup Folder", path: `${dataRoot}\\backups` },
    { label: "Cache Folder", path: `${dataRoot}\\temp` },
  ];

  const handleOpenFolder = (path) => {
    window.electronAPI.heatTreatment.openFolder(path);
  };

  return (
    <Box sx={{ p: 3, height: "100%", overflow: "hidden" }}>
      <Grid container spacing={3} sx={{ height: "100%" }}>
        <Grid item xs={12}>
          <Paper sx={{ borderRadius: 2, p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              Application Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>
                <InfoItem label="Version" value={version ? `v${version}` : "—"} />
              </Grid>
              {folders.map((folder, idx) => (
                <Grid item key={idx} xs={12} sm={6} md={4}>
                  <InfoItem label={folder.label} value={folder.path} />
                </Grid>
              ))}
              <Grid item xs={12} sm={6} md={4}>
                <InfoItem label="Database Size" value={dbSize || "Calculating..."} />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <InfoItem label="Template Count" value={templateCount} />
              </Grid>
            </Grid>
            <Box sx={{ mt: 4, display: "flex", gap: 2, flexWrap: "wrap" }}>
              <Button
                variant="outlined"
                startIcon={<FolderOpenOutlinedIcon />}
                onClick={() => handleOpenFolder(dataRoot)}
              >
                Open Data Folder
              </Button>
              <Button
                variant="outlined"
                startIcon={<FolderOpenOutlinedIcon />}
                onClick={() => handleOpenFolder(`${dataRoot}\\database`)}
              >
                Open Database Folder
              </Button>
              <Button
                variant="contained"
                startIcon={<BackupOutlinedIcon />}
                onClick={async () => {
                  const result = await createBackup();
                  if (result.ok) {
                    alert("Backup created successfully!");
                  }
                }}
              >
                Backup Database
              </Button>
              <Button
                variant="outlined"
                startIcon={<RestoreOutlinedIcon />}
                onClick={() => alert("Restore function coming soon!")}
              >
                Restore Database
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

const InfoItem = ({ label, value }) => (
  <Box sx={{ p: 2, bgcolor: "#fafafa", borderRadius: 1 }}>
    <Typography variant="caption" color="text.secondary" display="block">
      {label}
    </Typography>
    <Typography variant="body2" sx={{ mt: 0.5, wordBreak: "break-all" }}>
      {value}
    </Typography>
  </Box>
);

export default SystemTab;
