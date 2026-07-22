// src/components/layout/StatusBar.jsx
import React, { memo, useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';

/**
 * StatusBar – 28px footer status bar (no-print)
 * Props:
 *   zoom : number
 */
const StatusBar = memo(function StatusBar({ zoom = 100 }) {
  const [time, setTime] = useState(() => new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }));

  useEffect(() => {
    const t = setInterval(() => {
      setTime(new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }));
    }, 30000);
    return () => clearInterval(t);
  }, []);

  return (
    <Box
      component="footer"
      className="no-print"
      role="status"
      aria-label="Thanh trạng thái"
      sx={{
        height: 28,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        px: 2.5,
        gap: 0,
        backgroundColor: 'background.paper',
        borderTop: '1px solid',
        borderColor: 'divider',
        userSelect: 'none',
      }}
    >
      {/* Auto save indicator */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mr: 2 }}>
        <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
          ✓ Lưu tự động
        </Typography>
      </Box>

      <StatusDivider />

      {/* Last update */}
      <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 0.5, mx: 2 }}>
        <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
          Cập nhật: {time}
        </Typography>
      </Box>

      {/* Spacer */}
      <Box sx={{ flex: 1 }} />

      {/* Zoom */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
          Mức thu phóng: {Math.round(zoom)}%
        </Typography>
      </Box>

      <StatusDivider />

      {/* Version */}
      <Typography variant="caption" sx={{ fontSize: '0.7rem', color: '#C9CDD3', ml: 2 }}>
        v1.1.0
      </Typography>
    </Box>
  );
});

const StatusDivider = () => (
  <Divider orientation="vertical" flexItem sx={{ my: 0.5, mx: 0.5, borderColor: 'divider' }} />
);

export default StatusBar;
