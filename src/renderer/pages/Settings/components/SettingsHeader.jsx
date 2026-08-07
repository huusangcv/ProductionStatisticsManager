import React from 'react';
import { Box, Typography, Button, TextField, InputAdornment, IconButton } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';

const SettingsHeader = ({
  title,
  onRefresh,
  isRefreshing,
  primaryAction,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Tìm kiếm...",
  rowCountText
}) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
      {/* Left side: Search & count */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {onSearchChange !== undefined && (
          <TextField
            size="small"
            placeholder={searchPlaceholder}
            value={searchValue || ''}
            onChange={onSearchChange}
            sx={{ 
              width: 250, 
              '& .MuiOutlinedInput-root': { 
                borderRadius: '20px',
                height: '36px',
                bgcolor: '#fff'
              },
              '& .MuiInputBase-input': { fontSize: '13px' }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: '#64748b' }} />
                </InputAdornment>
              ),
            }}
          />
        )}
        {rowCountText !== undefined && (
          <Typography variant="body2" sx={{ color: '#64748b', fontSize: '13px', fontWeight: 500 }}>
            {rowCountText}
          </Typography>
        )}
      </Box>

      {/* Right side: Actions */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        {primaryAction && (
          <Button
            variant={primaryAction.variant || "outlined"}
            startIcon={primaryAction.icon}
            onClick={primaryAction.onClick}
            disabled={primaryAction.disabled}
            sx={{ 
              textTransform: 'none', 
              fontWeight: 500, 
              boxShadow: 'none',
              borderRadius: '8px',
              height: '36px',
              color: primaryAction.variant === 'contained' ? '#fff' : '#374151',
              borderColor: primaryAction.variant === 'contained' ? 'transparent' : '#d1d5db',
              '&:hover': {
                bgcolor: primaryAction.variant === 'contained' ? 'primary.dark' : '#f3f4f6',
                borderColor: primaryAction.variant === 'contained' ? 'transparent' : '#d1d5db'
              }
            }}
          >
            {primaryAction.label}
          </Button>
        )}
        {onRefresh && (
          <IconButton
            onClick={onRefresh}
            disabled={isRefreshing}
            sx={{ 
              border: '1px solid',
              borderColor: '#d1d5db',
              borderRadius: '8px',
              height: '36px',
              width: '36px',
              color: '#374151',
              '&:hover': {
                bgcolor: '#f3f4f6'
              }
            }}
          >
            <RefreshIcon fontSize="small" />
          </IconButton>
        )}
      </Box>
    </Box>
  );
};

export default SettingsHeader;
