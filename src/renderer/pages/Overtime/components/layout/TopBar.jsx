// src/components/layout/TopBar.jsx
import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import PrintRoundedIcon from '@mui/icons-material/PrintRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import { LOGO_B64 } from '../../constants';

/**
 * TopBar – 64px premium application header
 * Props:
 *   onPrint         : () => void
 *   departmentName  : string  — Tên bộ phận hiển thị trên top bar
 */
const TopBar = memo(function TopBar({ onPrint, departmentName = '' }) {
  const navigate = useNavigate();
  return (
    <AppBar
      component="header"
      className="no-print"
      position="static"
      elevation={0}
      sx={{
        backgroundColor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
        color: 'text.primary',
        height: 64,
        zIndex: 100,
        backgroundImage: 'none',
      }}
    >
      <Toolbar
        sx={{
          height: 64,
          minHeight: '64px !important',
          px: { xs: 2, sm: 3 },
          gap: 1,
        }}
      >
        {/* ── Logo ─────────────────────────────────────────────── */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            flexShrink: 0,
            textDecoration: 'none',
            color: 'inherit',
          }}
        >
          <Avatar
            src={`data:image/png;base64,${LOGO_B64}`}
            alt="Kingdom Logo"
            variant="rounded"
            sx={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              border: '1px solid',
              borderColor: 'divider',
              flexShrink: 0,
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            }}
          />

          {/* App title */}
          <Box sx={{ minWidth: 0, display: { xs: 'none', sm: 'block' } }}>
            <Typography
              variant="subtitle2"
              fontWeight={700}
              sx={{ lineHeight: 1.25, color: 'text.primary', letterSpacing: '-0.01em' }}
            >
              Đăng Ký Tăng Ca
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.3, fontSize: '0.7rem' }}
              noWrap
            >
              Kingdom Vietnam
              {departmentName ? ` · ${departmentName}` : ''}
            </Typography>
          </Box>
        </Box>

        {/* ── Spacer ──────────────────────────────────────────── */}
        <Box sx={{ flex: 1 }} />

        {/* ── Actions ──────────────────────────────────────────── */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>

          {/* Nút quay về trang chọn bộ phận */}
          <Tooltip title="Về trang chọn bộ phận">
            <IconButton
              size="small"
              onClick={() => navigate('/')}
              aria-label="Về trang chọn bộ phận"
              sx={{
                width: 34, height: 34,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: '8px',
                color: 'text.secondary',
                '&:hover': { borderColor: 'primary.main', color: 'primary.main', bgcolor: 'rgba(185,28,28,0.05)' },
              }}
            >
              <ArrowBackRoundedIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>

          {/* Print – The single primary action */}
          <Button
            variant="contained"
            size="small"
            startIcon={<PrintRoundedIcon sx={{ fontSize: 16 }} />}
            onClick={onPrint}
            sx={{ height: 34, fontSize: '0.8125rem', borderRadius: '8px', minWidth: 90 }}
          >
            In biểu
          </Button>

          {/* Avatar */}
          <Tooltip title="Hữu Sang">
            <Avatar
              sx={{
                width: 32,
                height: 32,
                fontSize: '0.75rem',
                fontWeight: 700,
                bgcolor: '#4F63D2',
                cursor: 'pointer',
                border: '2px solid',
                borderColor: 'divider',
                transition: 'all 150ms ease',
                '&:hover': { borderColor: 'primary.main', transform: 'scale(1.05)' },
              }}
            >
              HS
            </Avatar>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
});

export default TopBar;
