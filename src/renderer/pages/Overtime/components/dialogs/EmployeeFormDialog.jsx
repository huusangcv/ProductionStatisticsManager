// src/components/dialogs/EmployeeFormDialog.jsx
import React, { memo, useCallback } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import PersonAddRoundedIcon from '@mui/icons-material/PersonAddRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';

const ROLE_OPTIONS = [
  { value: 'CN', label: 'CN – Công nhân' },
  { value: 'NV', label: 'NV – Nhân viên' },
  { value: 'TT', label: 'TT – Tổ trưởng' },
  { value: 'CT', label: 'CT – Ca trưởng / Tổ phó' },
];

/**
 * EmployeeFormDialog – Premium Add / Edit employee dialog
 */
const EmployeeFormDialog = memo(function EmployeeFormDialog({
  open,
  editingId,
  modalData,
  onChange,
  onSave,
  onClose,
}) {
  const isEditing = Boolean(editingId);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') onSave();
  }, [onSave]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '20px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.12)',
        },
      }}
    >
      {/* Header */}
      <DialogTitle sx={{ pb: 1.5, pt: 3, px: 3.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.75 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '12px',
              bgcolor: 'rgba(185,28,28,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isEditing
              ? <EditRoundedIcon sx={{ fontSize: 22, color: 'primary.main' }} />
              : <PersonAddRoundedIcon sx={{ fontSize: 22, color: 'primary.main' }} />
            }
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.3, color: 'text.primary' }}>
              {isEditing ? 'Cập nhật nhân viên' : 'Thêm nhân viên mới'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {isEditing ? `Đang chỉnh sửa mã #${editingId}` : 'Điền đầy đủ thông tin bên dưới'}
            </Typography>
          </Box>
        </Box>
        <IconButton
          onClick={onClose}
          size="small"
          aria-label="Đóng"
          sx={{
            position: 'absolute',
            right: 20,
            top: 20,
            color: 'text.secondary',
            bgcolor: '#F3F4F6',
            '&:hover': { bgcolor: '#E5E7EB', color: 'text.primary' },
          }}
        >
          <CloseRoundedIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </DialogTitle>

      {/* Body */}
      <DialogContent sx={{ px: 3.5, pt: 2.5, pb: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
          <TextField
            variant="outlined"
            label="Mã nhân viên (4 số cuối)"
            placeholder="VD: 1171"
            value={modalData.id}
            onChange={e => onChange({ ...modalData, id: e.target.value.replace(/\D/g, '') })}
            onKeyDown={handleKeyDown}
            slotProps={{ input: { maxLength: 4, inputMode: 'numeric' } }}
            helperText={isEditing ? 'Nhập mã nhân viên mới nếu cần thay đổi' : 'Nhập 4 chữ số cuối của mã thẻ'}
            fullWidth
            sx={{ '& .MuiFormHelperText-root': { ml: 0 } }}
          />
          <TextField
            variant="outlined"
            label="Họ và tên"
            placeholder="VD: Nguyễn Văn A"
            value={modalData.name}
            onChange={e => onChange({ ...modalData, name: e.target.value })}
            onKeyDown={handleKeyDown}
            fullWidth
          />
          <FormControl fullWidth size="small" variant="outlined">
            <InputLabel>Chức danh</InputLabel>
            <Select
              label="Chức danh"
              value={modalData.role}
              onChange={e => onChange({ ...modalData, role: e.target.value })}
            >
              {ROLE_OPTIONS.map(opt => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </DialogContent>

      {/* Footer */}
      <DialogActions sx={{ px: 3.5, py: 3, gap: 1.5 }}>
        <Button
          variant="outlined"
          color="inherit"
          onClick={onClose}
          sx={{ flex: 1, height: 42, color: 'text.secondary', borderColor: 'divider' }}
        >
          Hủy bỏ
        </Button>
        <Button
          variant="contained"
          onClick={onSave}
          startIcon={<SaveRoundedIcon />}
          sx={{ flex: 1, height: 42 }}
        >
          {isEditing ? 'Cập nhật' : 'Thêm mới'}
        </Button>
      </DialogActions>
    </Dialog>
  );
});

export default EmployeeFormDialog;
