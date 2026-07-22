// src/components/dialogs/HistoryPreviewDialog.jsx
import React, { memo } from 'react';
import Dialog from '@mui/material/Dialog';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import CloseIcon from '@mui/icons-material/Close';
import PrintRoundedIcon from '@mui/icons-material/PrintRounded';

// Tái sử dụng chung PreviewPanel
import PreviewPanel from '../preview/PreviewPanel';

/**
 * Dialog hiển thị bản lưu (snapshot) read-only của biểu tăng ca.
 * Cho phép xem và in lại bản snapshot đó.
 */
const HistoryPreviewDialog = memo(function HistoryPreviewDialog({ open, record, onClose }) {
  if (!record) return null;

  // Lấy dữ liệu snapshot
  const {
    employees = [],
    formData = {},
    date,
    shift,
    departmentName,
    createdAt
  } = record;

  const isSun = shift === 'CHỦ NHẬT';

  // Format ngày
  const dateStr = date
    ? `Ngày ${parseInt(date.split('-')[2])} tháng ${parseInt(date.split('-')[1])} năm ${date.split('-')[0]}`
    : 'Ngày ___ tháng ___ năm ______';

  // Hàm in lại bản lịch sử
  const handlePrint = () => {
    // Để in lịch sử, chỉ cần gọi window.print()
    // CSS @media print sẽ in nội dung của Dialog (vì Dialog che toàn màn hình)
    window.print();
  };

  return (
    <Dialog
      fullScreen
      open={open}
      onClose={onClose}
      sx={{
        zIndex: 1300, // Đảm bảo đè lên top bar
        '@media print': {
          '& .MuiDialog-container': {
            height: 'auto',
          },
        }
      }}
    >
      {/* ── Header ────────────────────────────────────────────── */}
      <AppBar sx={{ position: 'relative', bgcolor: '#FFFFFF', color: '#111827', boxShadow: 'none', borderBottom: '1px solid #E5E7EB' }} className="no-print">
        <Toolbar sx={{ minHeight: '64px !important', px: { xs: 2, sm: 3 } }}>
          <IconButton edge="start" color="inherit" onClick={onClose} aria-label="close">
            <CloseIcon />
          </IconButton>
          
          <Box sx={{ ml: 2, flex: 1 }}>
            <Typography variant="h6" fontWeight={700} sx={{ fontSize: '1.125rem' }}>
              Biểu tăng ca {departmentName} - {date}
            </Typography>
            <Typography variant="caption" sx={{ color: '#6B7280' }}>
              Lưu lúc: {new Date(createdAt).toLocaleString('vi-VN')} • {employees.length} nhân viên • Chế độ chỉ xem
            </Typography>
          </Box>

          <Button
            variant="contained"
            startIcon={<PrintRoundedIcon />}
            onClick={handlePrint}
            sx={{
              borderRadius: '8px',
              fontWeight: 600,
              textTransform: 'none',
              px: 3,
            }}
          >
            In lại biểu này
          </Button>
        </Toolbar>
      </AppBar>

      {/* ── Preview (Read-only) ─────────────────────────────── */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', bgcolor: '#F4F5F7', overflow: 'hidden' }}>
        <PreviewPanel
          selArr={employees}
          isSun={isSun}
          dateStr={dateStr}
          deptName={departmentName || ''}
          otTimes={formData.otTimes || {}}
          // Truyền 1 hàm rỗng để chặn sửa giờ
          setEmployeeTime={() => {}}
        />
      </Box>
    </Dialog>
  );
});

export default HistoryPreviewDialog;
