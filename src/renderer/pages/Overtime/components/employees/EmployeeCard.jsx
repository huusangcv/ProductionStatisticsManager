// src/components/employees/EmployeeCard.jsx
import React, { memo, useCallback } from 'react';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import RoleChip from './RoleChip';

const AVATAR_COLORS = [
  '#4F63D2', '#2563EB', '#0891B2', '#059669',
  '#7C3AED', '#9333EA', '#C2410C', '#0F766E',
];
const getAvatarColor = (id) =>
  AVATAR_COLORS[parseInt(id, 10) % AVATAR_COLORS.length] ?? AVATAR_COLORS[0];

const getInitials = (name) => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/**
 * EmployeeCard – card in the manage-employees tab
 * Props:
 *   employee : { id, name, role }
 *   index    : number
 *   onEdit   : (id) => void
 *   onDelete : (id) => void
 */
const EmployeeCard = memo(function EmployeeCard({ employee, index, onEdit, onDelete }) {
  const { id, name, role } = employee;
  const avatarColor = getAvatarColor(id);
  const initials = getInitials(name);

  const handleEdit = useCallback(() => onEdit(id), [id, onEdit]);
  const handleDelete = useCallback(() => onDelete(id), [id, onDelete]);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.25,
        px: 1.5,
        py: 1,
        mx: 1.5,
        my: 0.375,
        borderRadius: '10px',
        border: '1.5px solid',
        borderColor: 'transparent',
        backgroundColor: '#FAFAFA',
        transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          backgroundColor: '#F4F5F7',
          borderColor: '#D4D7DC',
          transform: 'translateY(-1px)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
          '& .emp-card-actions': { opacity: 1 },
        },
        '&:active': { transform: 'none' },
      }}
    >
      {/* Index badge */}
      <Box
        sx={{
          width: 20,
          height: 20,
          borderRadius: '50%',
          bgcolor: '#EBEBEB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: 'text.secondary' }}>
          {index + 1}
        </Typography>
      </Box>

      {/* Avatar */}
      <Avatar
        sx={{
          width: 34,
          height: 34,
          fontSize: '0.7rem',
          fontWeight: 700,
          bgcolor: avatarColor,
          flexShrink: 0,
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
          letterSpacing: '0.02em',
        }}
      >
        {initials}
      </Avatar>

      {/* Info */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" fontWeight={600} noWrap sx={{ color: 'text.primary', lineHeight: 1.3, fontSize: '0.8125rem' }}>
          {name}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.2 }}>
          <Typography
            variant="caption"
            sx={{ fontFamily: 'monospace', fontWeight: 700, color: 'text.secondary', fontSize: '0.6875rem', letterSpacing: '0.04em' }}
          >
            #{id}
          </Typography>
          <RoleChip role={role} />
        </Box>
      </Box>

      {/* Actions – fade on hover */}
      <Box className="emp-card-actions" sx={{ display: 'flex', gap: 0.25, flexShrink: 0, opacity: 0, transition: 'opacity 150ms ease' }}>
        <Tooltip title="Chỉnh sửa" placement="top">
          <IconButton
            size="small"
            onClick={handleEdit}
            aria-label={`Chỉnh sửa ${name}`}
            sx={{
              width: 28, height: 28,
              color: 'text.secondary',
              '&:hover': { color: 'primary.main', bgcolor: 'rgba(185,28,28,0.06)' },
            }}
          >
            <EditRoundedIcon sx={{ fontSize: 15 }} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Xóa" placement="top">
          <IconButton
            size="small"
            onClick={handleDelete}
            aria-label={`Xóa ${name}`}
            sx={{
              width: 28, height: 28,
              color: 'text.secondary',
              '&:hover': { color: 'error.main', bgcolor: 'rgba(220,38,38,0.06)' },
            }}
          >
            <DeleteOutlineRoundedIcon sx={{ fontSize: 15 }} />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
});

export default EmployeeCard;
