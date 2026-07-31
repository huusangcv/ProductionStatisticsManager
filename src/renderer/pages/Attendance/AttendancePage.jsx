import { useState, useEffect, useCallback, useMemo } from "react";
import { Box, Card, Typography, Snackbar, Alert, Stack } from "@mui/material";
import AttendanceToolbar from "./components/AttendanceToolbar";
import AttendanceGrid from "./components/AttendanceGrid";
import { STATUS_CONFIG } from "./components/AttendanceStatusBadge";
import attendanceService from "../../services/attendanceService";
import { useAuth } from "../../context/AuthContext";

export default function AttendancePage() {
  const { savedUsername } = useAuth();

  // Permission check: Only Admin and Thong Ke can edit. (Assuming usernames are admin or thongke)
  const isReadOnly = useMemo(() => {
    const user = (savedUsername || "").toLowerCase();
    return !(user === "admin" || user === "thongke" || user === "thống kê");
  }, [savedUsername]);

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const [filterDate, setFilterDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });

  const showSnackbar = useCallback((message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const loadData = useCallback(async () => {
    if (!filterDate) return;
    setLoading(true);
    try {
      const data = await attendanceService.getAttendance(filterDate);
      setRecords(data || []);
    } catch (err) {
      showSnackbar(err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [filterDate, showSnackbar]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStatusChange = (employeeId, newStatus) => {
    if (isReadOnly) return;
    setRecords(prev => prev.map(r => r.employee_id === employeeId ? { ...r, status: newStatus } : r));
  };

  const handleNoteChange = (employeeId, newNote) => {
    if (isReadOnly) return;
    setRecords(prev => prev.map(r => r.employee_id === employeeId ? { ...r, note: newNote } : r));
  };

  const handleMarkAllPresent = () => {
    if (isReadOnly) return;
    setRecords(prev => prev.map(r => ({ ...r, status: "PRESENT" })));
  };

  const handleMarkAllNotChecked = () => {
    if (isReadOnly) return;
    setRecords(prev => prev.map(r => ({ ...r, status: "NOT_CHECKED" })));
  };

  const handleSave = async () => {
    if (isReadOnly) return;
    setSaving(true);
    try {
      await attendanceService.saveAttendance(filterDate, records);
      showSnackbar("Lưu điểm danh thành công!", "success");
      await loadData();
    } catch (err) {
      showSnackbar(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const filteredRecords = useMemo(() => {
    if (!searchQuery) return records;
    const lowerQuery = searchQuery.toLowerCase();
    return records.filter(
      r =>
        (r.employee_name || "").toLowerCase().includes(lowerQuery) ||
        (r.employee_code || "").toLowerCase().includes(lowerQuery) ||
        (r.representative_code || "").toLowerCase().includes(lowerQuery)
    );
  }, [records, searchQuery]);

  const stats = useMemo(() => attendanceService.computeStats(records), [records]);

  return (
    <Box sx={{ p: 0, height: "100%", display: "flex", flexDirection: "column", gap: 2, bgcolor: "#F1F5F9" }}>
      <Card sx={{ flex: 1, display: "flex", flexDirection: "column", borderRadius: "12px", boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1)" }}>
        <AttendanceToolbar
          filterDate={filterDate}
          onFilterDateChange={setFilterDate}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onRefresh={loadData}
          onMarkAllPresent={handleMarkAllPresent}
          onMarkAllNotChecked={handleMarkAllNotChecked}
          onSave={handleSave}
          saving={saving}
        />

        {/* Dashboard Typographies */}
        <Box sx={{ p: 1.5, borderBottom: "1px solid #E2E8F0", bgcolor: "#FAFAFA", display: "flex", gap: 3 }}>
          {Object.entries(STATUS_CONFIG).map(([key, config]) => (
            <Stack key={key} direction="row" alignItems="center" spacing={1}>
              <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: config.textColor }} />
              <Typography variant="body2" sx={{ fontWeight: 500, color: "#334155" }}>
                {config.label}: <Typography component="span" sx={{ fontWeight: 700, color: config.textColor }}>{stats[key]}</Typography>
              </Typography>
            </Stack>
          ))}
        </Box>

        <Box sx={{ flex: 1, overflow: "hidden" }}>
          <AttendanceGrid
            records={filteredRecords}
            loading={loading}
            onStatusChange={handleStatusChange}
            onNoteChange={handleNoteChange}
            readOnly={isReadOnly}
          />
        </Box>
      </Card>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity={snackbar.severity} variant="filled" sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
