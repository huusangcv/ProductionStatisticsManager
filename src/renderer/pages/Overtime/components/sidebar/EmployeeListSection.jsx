// src/components/sidebar/EmployeeListSection.jsx
import React, { memo, useCallback } from 'react';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import PeopleRoundedIcon from '@mui/icons-material/PeopleRounded';
import ManageAccountsRoundedIcon from '@mui/icons-material/ManageAccountsRounded';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';
import EmployeeSelectList from './EmployeeSelectList';
import EmployeeManageList from './EmployeeManageList';
import HistoryList from './HistoryList';

/**
 * EmployeeListSection – Tab panel container for select vs manage
 * Props: all passed through to children
 */
const EmployeeListSection = memo(function EmployeeListSection({
  activeTab,
  setActiveTab,
  filteredEmployees,
  employees,
  selectedIds,
  searchQuery,
  onSearchChange,
  onToggle,
  onToggleAll,
  onEdit,
  onDelete,
  onAdd,
  otHistory,
  onViewHistory,
  onDeleteHistory,
  onClearHistory,
}) {
  const handleTabChange = useCallback((_, val) => setActiveTab(val), [setActiveTab]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      {/* Section label */}
      <Box sx={{ px: 2.5, pt: 2, pb: 1 }}>
        <Typography
          variant="overline"
          sx={{
            fontSize: '0.6875rem',
            fontWeight: 700,
            color: 'text.secondary',
            letterSpacing: '0.08em',
          }}
        >
          Nhân viên
        </Typography>
      </Box>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        variant="fullWidth"
        sx={{
          minHeight: 40,
          px: 1,
          borderBottom: '1px solid',
          borderColor: 'divider',
          '& .MuiTabs-indicator': { height: 2, borderRadius: 1 },
        }}
      >
        <Tab
          value="list"
          label="Chọn NV"
          icon={<PeopleRoundedIcon sx={{ fontSize: '1rem' }} />}
          iconPosition="start"
          sx={{
            minHeight: 40,
            fontSize: '0.75rem',
            gap: 0.5,
            whiteSpace: 'nowrap',
            p: 1,
            minWidth: 0,
          }}
          aria-label="Tab chọn nhân viên"
        />
        <Tab
          value="manage"
          label="Quản lý"
          icon={<ManageAccountsRoundedIcon sx={{ fontSize: '1rem' }} />}
          iconPosition="start"
          sx={{
            minHeight: 40,
            fontSize: '0.75rem',
            gap: 0.5,
            whiteSpace: 'nowrap',
            p: 1,
            minWidth: 0,
          }}
          aria-label="Tab quản lý nhân viên"
        />
        <Tab
          value="history"
          label="Lịch sử"
          icon={<HistoryRoundedIcon sx={{ fontSize: '1rem' }} />}
          iconPosition="start"
          sx={{
            minHeight: 40,
            fontSize: '0.75rem',
            gap: 0.5,
            whiteSpace: 'nowrap',
            p: 1,
            minWidth: 0,
          }}
          aria-label="Tab lịch sử"
        />
      </Tabs>

      {/* Tab panels */}
      {activeTab === 'list' && (
        <EmployeeSelectList
          filteredEmployees={filteredEmployees}
          selectedIds={selectedIds}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          onToggle={onToggle}
          onToggleAll={onToggleAll}
        />
      )}
      {activeTab === 'manage' && (
        <EmployeeManageList
          employees={employees}
          onEdit={onEdit}
          onDelete={onDelete}
          onAdd={onAdd}
        />
      )}
      {activeTab === 'history' && (
        <HistoryList
          otHistory={otHistory}
          onViewHistory={onViewHistory}
          onDeleteHistory={onDeleteHistory}
          onClearHistory={onClearHistory}
        />
      )}
    </Box>
  );
});

export default EmployeeListSection;
