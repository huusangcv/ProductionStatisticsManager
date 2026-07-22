// src/components/employees/EmptyState.jsx
import React, { memo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import PeopleOutlineRoundedIcon from '@mui/icons-material/PeopleOutlineRounded';
import SearchOffRoundedIcon from '@mui/icons-material/SearchOffRounded';
import PersonAddRoundedIcon from '@mui/icons-material/PersonAddRounded';

/**
 * EmptyState – shown when list has no items
 * Props:
 *   variant    : 'search' | 'empty'
 *   onAction?  : () => void  (optional CTA button)
 */
const EmptyState = memo(function EmptyState({ variant = 'empty', onAction }) {
  const isSearch = variant === 'search';

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 5,
        px: 3,
        textAlign: 'center',
        gap: 1.5,
      }}
    >
      {isSearch ? (
        <SearchOffRoundedIcon sx={{ fontSize: 48, color: '#D1D5DB' }} />
      ) : (
        <PeopleOutlineRoundedIcon sx={{ fontSize: 48, color: '#D1D5DB' }} />
      )}

      <Typography variant="body2" fontWeight={600} color="text.primary" sx={{ mt: 0.5 }}>
        {isSearch ? 'Không tìm thấy kết quả' : 'Chưa có nhân viên'}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ maxWidth: 180, lineHeight: 1.5 }}>
        {isSearch
          ? 'Thử tìm kiếm với từ khóa khác hoặc kiểm tra lại mã nhân viên.'
          : 'Thêm nhân viên vào danh sách để bắt đầu đăng ký tăng ca.'}
      </Typography>

      {!isSearch && onAction && (
        <Button
          variant="outlined"
          size="small"
          startIcon={<PersonAddRoundedIcon />}
          onClick={onAction}
          sx={{ mt: 1, borderRadius: 2 }}
        >
          Thêm nhân viên
        </Button>
      )}
    </Box>
  );
});

export default EmptyState;
