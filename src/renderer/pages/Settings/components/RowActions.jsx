import React from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const RowActions = ({ onEdit, onDelete, editTooltip = "Sửa", deleteTooltip = "Xóa", disableEdit, disableDelete }) => {
  return (
    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', width: '100%', pr: 1 }}>
      {onEdit && (
        <Tooltip title={editTooltip}>
          <span>
            <IconButton 
              size="small" 
              onClick={(e) => { e.stopPropagation(); onEdit(); }} 
              disabled={disableEdit} 
              sx={{ color: '#64748b', '&:hover': { color: '#2f6fed', bgcolor: '#f0f6ff' } }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      )}
      {onDelete && (
        <Tooltip title={deleteTooltip}>
          <span>
            <IconButton 
              size="small" 
              onClick={(e) => { e.stopPropagation(); onDelete(); }} 
              disabled={disableDelete} 
              sx={{ color: 'error.main', '&:hover': { bgcolor: '#fef2f2' } }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      )}
    </Box>
  );
};

export default RowActions;
