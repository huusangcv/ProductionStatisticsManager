// src/components/employees/RoleChip.jsx
import React, { memo } from 'react';
import Chip from '@mui/material/Chip';
import { ROLE_COLORS, ROLE_LABELS } from '../../constants';

/**
 * RoleChip – compact pill-shaped role badge using pastel colors
 * Props:
 *   role: 'TT' | 'CT' | 'CN' | 'NV'
 */
const RoleChip = memo(function RoleChip({ role = 'CN' }) {
  const colors = ROLE_COLORS[role] ?? ROLE_COLORS.CN;
  const label  = role;

  return (
    <Chip
      label={label}
      size="small"
      title={ROLE_LABELS[role] ?? role}
      sx={{
        height: 20,
        fontSize: '0.6875rem', // 11px
        fontWeight: 600,
        letterSpacing: '0.02em',
        borderRadius: '10px', // pill shape
        backgroundColor: colors.bg,
        color: colors.color,
        border: '1px solid',
        borderColor: 'rgba(0,0,0,0.04)',
        '& .MuiChip-label': { px: '6px' },
      }}
    />
  );
});

export default RoleChip;
