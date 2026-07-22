// src/components/employees/SearchBar.jsx
import React, { memo, useRef, useEffect } from 'react';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import ClearRoundedIcon from '@mui/icons-material/ClearRounded';
import IconButton from '@mui/material/IconButton';

/**
 * SearchBar – Minimalist search input
 * Props:
 *   value       : string
 *   onChange    : (value: string) => void
 *   placeholder?: string
 */
const SearchBar = memo(function SearchBar({
  value,
  onChange,
  placeholder = 'Tìm tên hoặc mã nhân viên...',
}) {
  const ref = useRef(null);

  // Ctrl+F to focus
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        ref.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <TextField
      inputRef={ref}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      fullWidth
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchRoundedIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
            </InputAdornment>
          ),
          endAdornment: value ? (
            <InputAdornment position="end">
              <IconButton
                size="small"
                onClick={() => onChange('')}
                edge="end"
                aria-label="Xóa tìm kiếm"
                sx={{
                  color: 'text.secondary',
                  width: 24, height: 24,
                  '&:hover': { color: 'text.primary', bgcolor: 'rgba(0,0,0,0.04)' },
                }}
              >
                <ClearRoundedIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </InputAdornment>
          ) : null,
        },
      }}
      sx={{
        '& .MuiOutlinedInput-root': {
          height: 42,
          borderRadius: '12px',
          backgroundColor: '#F3F4F6',
          fontSize: '0.875rem',
          transition: 'all 150ms ease',
          '& fieldset': { border: 'none' }, // Clean look without borders unless focused
          '&:hover': { backgroundColor: '#E5E7EB' },
          '&.Mui-focused': { 
            backgroundColor: '#FFFFFF', 
            boxShadow: '0 0 0 2px rgba(185,28,28,0.15)',
            '& fieldset': { border: '1px solid', borderColor: 'primary.main' }
          },
        },
        '& .MuiOutlinedInput-input': {
          '&::placeholder': { color: '#9CA3AF', opacity: 1 },
        },
      }}
    />
  );
});

export default SearchBar;
