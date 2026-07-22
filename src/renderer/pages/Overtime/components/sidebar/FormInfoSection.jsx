// src/components/sidebar/FormInfoSection.jsx
import React, { memo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import Chip from '@mui/material/Chip';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import { OT_TYPES, MAX_ROWS } from '../../constants';

/**
 * FormInfoSection – Phiếu info card in sidebar
 * Minimalist design without excessive colors
 */
const FormInfoSection = memo(function FormInfoSection({
  otDate,
  setOtDate,
  otType,
  setOtType,
  selectedCount,
}) {
  // Tính số trang sẽ được tạo (đồng bộ với logic phân trang ở PreviewPanel)
  const pageCount = selectedCount === 0 ? 1 : Math.ceil(selectedCount / MAX_ROWS);

  return (
    <Box sx={{ px: 2.5, py: 2 }}>

      {/* Date field */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
          <CalendarMonthRoundedIcon sx={{ fontSize: 13, color: 'text.secondary' }} />
          <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ fontSize: '0.75rem' }}>
            Ngày tăng ca
          </Typography>
        </Box>
        <TextField
          type="date"
          value={otDate}
          onChange={e => setOtDate(e.target.value)}
          size="small"
          fullWidth
          slotProps={{ input: { 'aria-label': 'Ngày tăng ca' } }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px',
              backgroundColor: '#F9FAFB',
              fontSize: '0.875rem',
              fontWeight: 500,
              '& fieldset': { borderColor: '#E5E7EB' },
              '&:hover fieldset': { borderColor: '#D1D5DB' },
            },
          }}
        />
      </Box>

      {/* OT Type field */}
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
          <AccessTimeRoundedIcon sx={{ fontSize: 13, color: 'text.secondary' }} />
          <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ fontSize: '0.75rem' }}>
            Loại tăng ca
          </Typography>
        </Box>
        <FormControl fullWidth size="small" variant="outlined">
          <Select
            value={otType}
            onChange={e => setOtType(e.target.value)}
            displayEmpty
            aria-label="Loại tăng ca"
            sx={{
              borderRadius: '8px',
              backgroundColor: '#F9FAFB',
              fontSize: '0.875rem',
              fontWeight: 500,
              '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E5E7EB' },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#D1D5DB' },
            }}
          >
            {OT_TYPES.map(t => (
              <MenuItem key={t.value} value={t.value} sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
                {t.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Tóm tắt: số NV đã chọn và số trang sẽ in */}
      {/* {selectedCount > 0 && (
        <Box
          sx={{
            mt: 2,
            px: 1.5,
            py: 1,
            borderRadius: '8px',
            backgroundColor: '#F0FDF4',
            border: '1px solid #BBF7D0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Typography variant="caption" fontWeight={600} sx={{ color: '#15803D', fontSize: '0.75rem' }}>
            ✓ {selectedCount} nhân viên
          </Typography>
          <Typography variant="caption" fontWeight={600} sx={{ color: '#15803D', fontSize: '0.75rem' }}>
            {pageCount} trang
          </Typography>
        </Box>
      )} */}
    </Box>
  );
});

export default FormInfoSection;
