import React from 'react';
import { Chip } from '@mui/material';

const StatusChip = ({ active, activeLabel = "Active", inactiveLabel = "Inactive", ...props }) => {
  return (
    <Chip
      label={active ? activeLabel : inactiveLabel}
      size="small"
      color={active ? "success" : "default"}
      variant={active ? "outlined" : "filled"}
      sx={{ 
        fontWeight: 500,
        ...(active ? { bgcolor: '#f0fdf4', color: '#16a34a', borderColor: '#bbf7d0' } : { color: '#64748b' })
      }}
      {...props}
    />
  );
};

export default StatusChip;
