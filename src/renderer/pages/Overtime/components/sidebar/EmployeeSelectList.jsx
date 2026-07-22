// src/components/sidebar/EmployeeSelectList.jsx
import React, { memo, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Checkbox from '@mui/material/Checkbox';
import Divider from '@mui/material/Divider';
import SearchBar from '../employees/SearchBar';
import EmployeeSelectRow from '../employees/EmployeeSelectRow';
import EmptyState from '../employees/EmptyState';

/**
 * EmployeeSelectList – Tab "Chọn nhân viên" content
 * Props:
 *   filteredEmployees : Employee[]
 *   selectedIds       : Set<string>
 *   searchQuery       : string
 *   onSearchChange    : (v) => void
 *   onToggle          : (id) => void
 *   onToggleAll       : (checked) => void
 */
const EmployeeSelectList = memo(function EmployeeSelectList({
  filteredEmployees,
  selectedIds,
  searchQuery,
  onSearchChange,
  onToggle,
  onToggleAll,
}) {
  const allChecked =
    filteredEmployees.length > 0 && filteredEmployees.every(e => selectedIds.has(e.id));
  const someChecked =
    filteredEmployees.some(e => selectedIds.has(e.id)) && !allChecked;
  // Nếu đang có bất kỳ ai được chọn (kể cả indeterminate) → bỏ chọn hết
  // Nếu chưa có ai được chọn → chọn tất cả
  const anyChecked = allChecked || someChecked;

  const handleToggleAll = useCallback(
    () => onToggleAll(!anyChecked),
    [onToggleAll, anyChecked],
  );

  const isEmpty  = filteredEmployees.length === 0;
  const isSearch = searchQuery.length > 0 && isEmpty;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      {/* Search */}
      <Box sx={{ px: 2, pt: 1.5, pb: 1 }}>
        <SearchBar value={searchQuery} onChange={onSearchChange} />
      </Box>

      {/* Select-all header */}
      {!isEmpty && (
        <>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              px: 2,
              py: 0.75,
              bgcolor: '#FAFAFA',
            }}
          >
            <Checkbox
              size="small"
              checked={anyChecked}
              onChange={handleToggleAll}
              color="primary"
              sx={{ p: 0.5, mr: 1 }}
            />
            <Typography variant="caption" fontWeight={600} color="text.secondary">
              Chọn tất cả ({filteredEmployees.length})
            </Typography>
            <Box sx={{ flex: 1 }} />
            <Typography variant="caption" color="text.secondary">
              Đã chọn: <strong>{selectedIds.size}</strong>
            </Typography>
          </Box>
          <Divider />
        </>
      )}

      {/* List */}
      <Box
        component="ul"
        role="listbox"
        aria-multiselectable="true"
        aria-label="Danh sách nhân viên"
        sx={{
          flex: 1,
          overflowY: 'auto',
          py: 0.5,
          listStyle: 'none',
          m: 0,
          p: 0,
        }}
      >
        {isEmpty ? (
          <EmptyState variant={isSearch ? 'search' : 'empty'} />
        ) : (
          filteredEmployees.map(emp => (
            <EmployeeSelectRow
              key={emp.id}
              employee={emp}
              selected={selectedIds.has(emp.id)}
              onToggle={onToggle}
            />
          ))
        )}
      </Box>
    </Box>
  );
});

export default EmployeeSelectList;
