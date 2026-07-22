// src/components/sidebar/EmployeeManageList.jsx
import React, { memo } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import PersonAddRoundedIcon from '@mui/icons-material/PersonAddRounded';
import EmployeeCard from '../employees/EmployeeCard';
import EmptyState from '../employees/EmptyState';

/**
 * EmployeeManageList – Tab "Quản lý nhân viên" content
 * Props:
 *   employees : Employee[]
 *   onEdit    : (id) => void
 *   onDelete  : (id) => void
 *   onAdd     : () => void
 */
const EmployeeManageList = memo(function EmployeeManageList({
  employees,
  onEdit,
  onDelete,
  onAdd,
}) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      {/* Header count */}
      <Box sx={{ px: 2, pt: 1.5, pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="caption" color="text.secondary" fontWeight={600}>
          {employees.length} nhân viên
        </Typography>
        <Button
          variant="contained"
          size="small"
          startIcon={<PersonAddRoundedIcon />}
          onClick={onAdd}
          sx={{ borderRadius: 2, height: 30, fontSize: '0.75rem' }}
        >
          Thêm mới
        </Button>
      </Box>

      {/* Scrollable list */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          px: 1.5,
          pb: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 0.75,
        }}
      >
        {employees.length === 0 ? (
          <EmptyState variant="empty" onAction={onAdd} />
        ) : (
          employees.map((emp, index) => (
            <EmployeeCard
              key={emp.id}
              employee={emp}
              index={index}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))
        )}
      </Box>
    </Box>
  );
});

export default EmployeeManageList;
