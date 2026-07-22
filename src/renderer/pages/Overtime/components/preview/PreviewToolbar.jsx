// src/components/preview/PreviewToolbar.jsx
import React, { memo } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import RemoveRoundedIcon from '@mui/icons-material/RemoveRounded';
import FitScreenRoundedIcon from '@mui/icons-material/FitScreenRounded';
import CropPortraitRoundedIcon from '@mui/icons-material/CropPortraitRounded';
import RotateRightRoundedIcon from '@mui/icons-material/RotateRightRounded';
import FullscreenRoundedIcon from '@mui/icons-material/FullscreenRounded';

/**
 * PreviewToolbar – Command bar strictly for viewing operations
 * Props:
 *   zoom           : number
 *   onZoomIn       : () => void
 *   onZoomOut      : () => void
 *   onZoomReset    : () => void
 *   onZoomFitWidth : () => void
 *   onZoomFitPage  : () => void
 *   onRotate       : () => void
 *   onFullscreen   : () => void
 */
const PreviewToolbar = memo(function PreviewToolbar({
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onZoomFitWidth,
  onZoomFitPage,
  onRotate,
  onFullscreen,
}) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
      <Paper
        className="no-print"
        elevation={0}
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.5,
          px: 1,
          py: 0.5,
          borderRadius: 12,
          border: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'background.paper',
          boxShadow: '0 4px 16px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.04)',
        }}
      >
        {/* Zoom controls */}
        <Tooltip title="Thu nhỏ (Zoom out)">
          <IconButton size="small" onClick={onZoomOut} disabled={zoom <= 20} aria-label="Thu nhỏ" sx={{ color: 'text.secondary', width: 32, height: 32 }}>
            <RemoveRoundedIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>

        <Tooltip title="Về 100% (Reset zoom)">
          <Button
            size="small"
            onClick={onZoomReset}
            aria-label="Reset zoom về 100%"
            sx={{
              minWidth: 56,
              height: 32,
              fontSize: '0.75rem',
              fontWeight: 700,
              borderRadius: 2,
              color: 'text.primary',
              px: 1,
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            {Math.round(zoom)}%
          </Button>
        </Tooltip>

        <Tooltip title="Phóng to (Zoom in)">
          <IconButton size="small" onClick={onZoomIn} disabled={zoom >= 400} aria-label="Phóng to" sx={{ color: 'text.secondary', width: 32, height: 32 }}>
            <AddRoundedIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 0.5 }} />

        {/* Fit controls */}
        <Tooltip title="Vừa chiều ngang (Fit Width)">
          <IconButton size="small" onClick={onZoomFitWidth} aria-label="Vừa ngang" sx={{ color: 'text.secondary', width: 32, height: 32 }}>
            <FitScreenRoundedIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>

        <Tooltip title="Vừa trang (Fit Page)">
          <IconButton size="small" onClick={onZoomFitPage} aria-label="Vừa trang" sx={{ color: 'text.secondary', width: 32, height: 32 }}>
            <CropPortraitRoundedIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 0.5 }} />

        {/* Rotate and Fullscreen */}
        <Tooltip title="Xoay (Rotate)">
          <IconButton size="small" onClick={onRotate} aria-label="Xoay" sx={{ color: 'text.secondary', width: 32, height: 32 }}>
            <RotateRightRoundedIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>

        <Tooltip title="Toàn màn hình (Fullscreen)">
          <IconButton size="small" onClick={onFullscreen} aria-label="Toàn màn hình" sx={{ color: 'text.secondary', width: 32, height: 32 }}>
            <FullscreenRoundedIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Tooltip>

      </Paper>
    </Box>
  );
});

export default PreviewToolbar;
