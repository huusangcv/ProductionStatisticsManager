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
        gap: 1.5,
        px: 2,
        py: 0.75,
        cursor: 'pointer',
        borderBottom: '1px solid',
        borderColor: 'divider',
        backgroundColor: selected ? alpha('#B91C1C', 0.06) : '#FFFFFF',
        transition: 'background-color 150ms ease',
        '&:hover': {
          backgroundColor: selected ? alpha('#B91C1C', 0.1) : '#F9FAFB',
        },
        '&:active': { transform: 'scale(0.99)' },
        outline: 'none',
      }}
    >
      {/* Avatar */}
      <Avatar
        sx={{
          width: 36,
          height: 36,
          fontSize: '0.8125rem',
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
      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <Typography
          variant="body2"
          fontWeight={600}
          noWrap
          sx={{
            color: 'text.primary',
            fontSize: '0.875rem',
            lineHeight: 1.25,
          }}
        >
          {name}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
          <Typography
            variant="caption"
            sx={{
              fontFamily: '"JetBrains Mono", monospace',
              fontWeight: 600,
              color: 'text.secondary',
              fontSize: '0.75rem',
              lineHeight: 1,
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
