// src/components/sidebar/SidebarPanel.jsx
import React, { memo } from 'react';
import Box from '@mui/material/Box';
import FormInfoSection from './FormInfoSection';
import EmployeeListSection from './EmployeeListSection';

/**
 * SidebarPanel – Fixed-width left sidebar (360px)
 * Minimalist professional look
 */
const SidebarPanel = memo(function SidebarPanel({
  // Form info props
  otDate, setOtDate,
  otType, setOtType,
  selectedCount,
  // Employee list + History props
  activeTab, setActiveTab,
  filteredEmployees, employees,
  selectedIds,
  searchQuery, onSearchChange,
  onToggle, onToggleAll,
  onEdit, onDelete, onAdd,
  otHistory, onViewHistory, onDeleteHistory, onClearHistory,
}) {
  return (
    <Box
      component="aside"
      className="no-print"
      aria-label="Bảng điều khiển"
      sx={{
        width: 360,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#FFFFFF', // Clean white background for Linear/Teams feel
        borderRight: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
      }}
    >
      {/* ── Phiếu thông tin ─────────────────────────────── */}
      <Box
        sx={{
          m: 2,
          mb: 0,
          borderRadius: '12px',
          backgroundColor: '#FFFFFF',
          border: '1px solid',
          borderColor: '#E4E7EB',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        <FormInfoSection
          otDate={otDate}
          setOtDate={setOtDate}
          otType={otType}
          setOtType={setOtType}
          selectedCount={selectedCount}
        />
      </Box>

      {/* ── Divider spacer ──────────────────────────────── */}
      <Box sx={{ height: 16 }} />

      {/* ── Nhân viên panel ─────────────────────────────── */}
      <Box
        sx={{
          mx: 2,
          mb: 2,
          flex: 1,
          borderRadius: '12px',
          backgroundColor: '#FFFFFF',
          border: '1px solid',
          borderColor: '#E4E7EB',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <EmployeeListSection
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          filteredEmployees={filteredEmployees}
          employees={employees}
          selectedIds={selectedIds}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          onToggle={onToggle}
          onToggleAll={onToggleAll}
          onEdit={onEdit}
          onDelete={onDelete}
          onAdd={onAdd}
          otHistory={otHistory}
          onViewHistory={onViewHistory}
          onDeleteHistory={onDeleteHistory}
          onClearHistory={onClearHistory}
        />
      </Box>
    </Box>
  );
});

export default SidebarPanel;
