// src/components/dialogs/ConfirmDialog.jsx
import React, { memo } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';

/**
 * ConfirmDialog – generic delete confirmation dialog
 * Props:
 *   open        : boolean
 *   title?      : string
 *   description?: string
 *   onConfirm   : () => void
 *   onCancel    : () => void
 */
const ConfirmDialog = memo(function ConfirmDialog({
  open,
  title = 'Xác nhận xóa',
  description = 'Bạn có chắc chắn muốn xóa mục này không? Hành động này không thể hoàn tác.',
  onConfirm,
  onCancel,
}) {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
        },
      }}
    >
      <DialogTitle sx={{ pb: 1, pt: 3, px: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2.5,
              bgcolor: 'rgba(239,68,68,0.10)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <WarningAmberRoundedIcon sx={{ fontSize: 22, color: 'error.main' }} />
          </Box>
          <Typography variant="subtitle1" fontWeight={700}>
            {title}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ px: 3, pt: 1, pb: 1 }}>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65, pl: '56px' }}>
          {description}
        </Typography>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2.5, gap: 1 }}>
        <Button
          variant="outlined"
          onClick={onCancel}
          sx={{ borderRadius: 2, flex: 1 }}
        >
          Hủy
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={onConfirm}
          sx={{ borderRadius: 2, flex: 1 }}
        >
          Xóa
        </Button>
      </DialogActions>
    </Dialog>
  );
});

export default ConfirmDialog;
