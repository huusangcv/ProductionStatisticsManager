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
    <Box sx={{ px: 2, py: 1.25, display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>

      {/* Date field */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
          <CalendarMonthRoundedIcon sx={{ fontSize: 13, color: 'text.secondary', flexShrink: 0 }} />
          <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ fontSize: '0.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
              fontSize: '0.8125rem',
              fontWeight: 500,
              '& fieldset': { borderColor: '#E5E7EB' },
              '&:hover fieldset': { borderColor: '#D1D5DB' },
            },
            '& input': { px: 1, py: 0.75 }
          }}
        />
      </Box>

      {/* OT Type field */}
      <Box sx={{ flex: 1.25, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
          <AccessTimeRoundedIcon sx={{ fontSize: 13, color: 'text.secondary', flexShrink: 0 }} />
          <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ fontSize: '0.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
              fontSize: '0.8125rem',
              fontWeight: 500,
              '& .MuiSelect-select': { px: 1, py: 0.75 },
              '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E5E7EB' },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#D1D5DB' },
            }}
          >
            {OT_TYPES.map(t => (
              <MenuItem key={t.value} value={t.value} sx={{ fontSize: '0.8125rem', fontWeight: 500 }}>
                {t.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
    </Box>
  );
});

export default FormInfoSection;
