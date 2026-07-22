// src/components/employees/EmployeeSelectRow.jsx
import React, { memo, useCallback } from 'react';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import Checkbox from '@mui/material/Checkbox';
import { alpha } from '@mui/material/styles';
import RoleChip from './RoleChip';

// Curated avatar palette – professional, subdued tones
const AVATAR_COLORS = [
  '#5B6ABF', '#4A7C9D', '#3D7A8A', '#5A7D7C',
  '#7D5BA6', '#B56576', '#8C6246', '#498467',
];
const getAvatarColor = (id) =>
  AVATAR_COLORS[parseInt(id, 10) % AVATAR_COLORS.length] ?? AVATAR_COLORS[0];

const getInitials = (name) => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/**
 * EmployeeSelectRow – Minimalist professional employee card for selection
 * Props:
 *   employee   : { id, name, role }
 *   selected   : boolean
 *   onToggle   : (id) => void
 */
const EmployeeSelectRow = memo(function EmployeeSelectRow({ employee, selected, onToggle }) {
  const { id, name, role } = employee;
  const avatarColor = getAvatarColor(id);
  const initials = getInitials(name);

  const handleClick = useCallback(() => onToggle(id), [id, onToggle]);

  return (
    <Box
      component="li"
      onClick={handleClick}
      role="option"
      aria-selected={selected}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2, // More breathing room
        px: 2, // 16px padding
        py: 1.5, // Total height ~68px
        mx: 1.5,
        my: 0.5,
        cursor: 'pointer',
        borderRadius: '8px',
        border: '1px solid',
        borderColor: selected ? alpha('#B91C1C', 0.15) : '#E4E7EB', // very light gray border
        backgroundColor: selected ? alpha('#B91C1C', 0.06) : '#FFFFFF',
        transition: 'all 150ms ease',
        '&:hover': {
          backgroundColor: selected ? alpha('#B91C1C', 0.08) : '#F9FAFB',
          borderColor: selected ? alpha('#B91C1C', 0.2) : '#D1D5DB',
          boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
        },
        '&:active': { transform: 'scale(0.99)', boxShadow: 'none' },
        outline: 'none',
      }}
    >
      {/* Avatar */}
      <Avatar
        sx={{
          width: 40,
          height: 40,
          fontSize: '0.875rem',
          fontWeight: 600,
          bgcolor: avatarColor,
          color: '#FFF',
          flexShrink: 0,
          letterSpacing: '0.02em',
        }}
      >
        {initials}
      </Avatar>

      {/* Info */}
      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0.25 }}>
        <Typography
          variant="body2"
          fontWeight={600}
          noWrap
          sx={{
            color: 'text.primary',
            fontSize: '0.875rem',
          }}
        >
          {name}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography
            variant="caption"
            sx={{
              fontFamily: '"JetBrains Mono", monospace',
              fontWeight: 500,
              color: 'text.secondary',
              fontSize: '0.75rem',
            }}
          >
            #{id}
          </Typography>
          <RoleChip role={role} />
        </Box>
      </Box>

      {/* Checkbox (Right Aligned) */}
      <Checkbox
        checked={selected}
        onChange={handleClick}
        onClick={e => e.stopPropagation()}
        size="medium"
        color="primary"
        sx={{
          p: 0.5,
          flexShrink: 0,
          color: '#C9CDD3',
          '&.Mui-checked': {
            color: 'primary.main',
          }
        }}
      />
    </Box>
  );
});

export default EmployeeSelectRow;
