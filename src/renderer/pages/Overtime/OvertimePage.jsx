// src/components/OvertimePage/index.jsx
// Component dùng chung cho tất cả các bộ phận.
// Nhận departmentId, departmentName, initialEmployeeList từ props.
// Toàn bộ logic (sidebar, preview, dialogs, snackbar) nằm ở đây.

import React from 'react';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

import './overtime.css';
import { useEmployeeManager } from './hooks/useEmployeeManager';

import AppShell from './components/layout/AppShell';
import SidebarPanel from './components/sidebar/SidebarPanel';
import PreviewPanel from './components/preview/PreviewPanel';
import EmployeeFormDialog from './components/dialogs/EmployeeFormDialog';
import ConfirmDialog from './components/dialogs/ConfirmDialog';
import HistoryPreviewDialog from './components/dialogs/HistoryPreviewDialog';

function OvertimePage() {
  const departmentId = 'truoc-xu-ly';
  const departmentName = 'Trước Xử Lý';

  const {
    // state
    employees,
    selectedIds,
    activeTab, setActiveTab,
    searchQuery, setSearchQuery,
    otDate, setOtDate,
    otType, setOtType,
    otTimes, setEmployeeTime,
    notes, setNote,
    otHistory, loadHistory, deleteHistoryRecord, clearAllHistory,
    modalOpen,
    editingId,
    modalData, setModalData,
    confirmOpen,
    deletingId,
    snackbar, closeSnackbar,
    // derived
    filteredEmployees,
    isSun,
    getDateStr,
    deptName,
    selArr,
    // handlers
    toggleEmp,
    toggleAll,
    requestDelete,
    confirmDelete,
    cancelDelete,
    openAdd,
    openEdit,
    closeModal,
    saveEmp,
    doPrint,
    resetSelection,
  } = useEmployeeManager({ departmentId, departmentName });

  // Update document title dynamically based on the department
  React.useEffect(() => {
    document.title = `Đăng Ký Tăng Ca – ${departmentName}`;
  }, [departmentName]);

  const [zoom, setZoom] = React.useState(100);
  const [previewRecord, setPreviewRecord] = React.useState(null);

  const dateStr = getDateStr();

  // Tên nhân viên đang bị xóa (dùng cho dialog xác nhận)
  const deletingEmployee = deletingId ? employees.find(e => e.id === deletingId) : null;

  // deptName từ hook trả về departmentId, nhưng PDF cần tên bộ phận hiển thị đẹp
  // => truyền departmentName vào PreviewPanel để hiển thị đúng trên PDF
  const pdfDeptName = isSun
    ? departmentName.toLowerCase()
    : departmentName;

  return (
    <>
      <AppShell
        topBarProps={{
          onPrint: doPrint,
          onReset: resetSelection,
          selectedCount: selectedIds.size,
          departmentName, // Truyền tên bộ phận vào TopBar
        }}
        statusBarProps={{
          zoom: zoom,
        }}
        sidebar={
          <SidebarPanel
            // Form info
            otDate={otDate}
            setOtDate={setOtDate}
            otType={otType}
            setOtType={setOtType}
            selectedCount={selectedIds.size}
            // Employee list & History
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            filteredEmployees={filteredEmployees}
            employees={employees}
            selectedIds={selectedIds}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onToggle={toggleEmp}
            onToggleAll={toggleAll}
            onEdit={openEdit}
            onDelete={requestDelete}
            onAdd={openAdd}
            otHistory={otHistory}
            onViewHistory={setPreviewRecord}
            onDeleteHistory={deleteHistoryRecord}
            onClearHistory={clearAllHistory}
          />
        }
      >
        <PreviewPanel
          selArr={selArr}
          isSun={isSun}
          dateStr={dateStr}
          deptName={pdfDeptName}
          onPrint={doPrint}
          otTimes={otTimes}
          setEmployeeTime={setEmployeeTime}
          notes={notes}
          setNote={setNote}
          onZoomChange={setZoom}
        />
      </AppShell>

      {/* Employee Form Dialog */}
      <EmployeeFormDialog
        open={modalOpen}
        editingId={editingId}
        modalData={modalData}
        onChange={setModalData}
        onSave={saveEmp}
        onClose={closeModal}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={confirmOpen}
        title="Xóa nhân viên"
        description={
          deletingEmployee
            ? `Bạn có chắc chắn muốn xóa nhân viên "${deletingEmployee.name}" (${deletingId})? Hành động này không thể hoàn tác.`
            : 'Bạn có chắc chắn muốn xóa nhân viên này không?'
        }
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />

      {/* History Read-Only Preview Dialog */}
      <HistoryPreviewDialog
        open={Boolean(previewRecord)}
        record={previewRecord}
        onClose={() => setPreviewRecord(null)}
      />

      {/* Snackbar Toast Notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={2400}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={closeSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{
            borderRadius: 2,
            fontWeight: 600,
            fontSize: '0.875rem',
            minWidth: 240,
            boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}

export default OvertimePage;
