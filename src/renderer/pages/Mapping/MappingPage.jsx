import { useState, useMemo } from 'react';
import styles from './MappingPage.module.css';
import EmployeeToolbar from './components/EmployeeToolbar';
import StatisticsCards from './components/StatisticsCards';
import FilterBar from './components/FilterBar';
import EmployeeTable from './components/EmployeeTable';
import EmployeeDetailsPanel from './components/EmployeeDetailsPanel';
import EmployeeDialog from './components/EmployeeDialog';
import BulkActionToolbar from './components/BulkActionToolbar';
import { MOCK_EMPLOYEES } from './mockData';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';

function MappingPage() {
  const [employees, setEmployees] = useState(MOCK_EMPLOYEES);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedRowIds, setSelectedRowIds] = useState([]);
  
  // Search and Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ department: 'All', role: 'All', status: 'All' });

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);

  // Compute stats
  const stats = useMemo(() => {
    return {
      total: employees.length,
      grinding: employees.filter(e => e.department === 'Mài').length,
      cutting: employees.filter(e => e.department === 'Cắt').length,
      managers: employees.filter(e => ['Thống kê', 'Trưởng ca', 'Tổ trưởng'].includes(e.role)).length,
      inactive: employees.filter(e => e.status === 'Nghỉ việc').length,
      attendance: `${Math.round((employees.filter(e => e.status === 'Đang làm việc').length / employees.length) * 100) || 0}%`
    };
  }, [employees]);

  // Filter employees
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      // Search
      const matchSearch = !searchQuery || 
        emp.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.phone.includes(searchQuery);
        
      // Filters
      const matchDept = filters.department === 'All' || emp.department === filters.department;
      const matchRole = filters.role === 'All' || emp.role === filters.role;
      const matchStatus = filters.status === 'All' || emp.status === filters.status;

      return matchSearch && matchDept && matchRole && matchStatus;
    });
  }, [employees, searchQuery, filters]);

  const selectedEmployee = useMemo(() => {
    return employees.find(e => e.id === selectedId) || null;
  }, [employees, selectedId]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveEmployee = (emp) => {
    setEmployees(prev => {
      const idx = prev.findIndex(e => e.id === emp.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = emp;
        return next;
      }
      return [emp, ...prev];
    });
    setDialogOpen(false);
  };

  const handleDeleteEmployee = (emp) => {
    if (confirm(`Bạn có chắc chắn muốn xóa nhân viên ${emp.fullName}?`)) {
      setEmployees(prev => prev.filter(e => e.id !== emp.id));
      if (selectedId === emp.id) setSelectedId(null);
      setSelectedRowIds(prev => prev.filter(id => id !== emp.id));
    }
  };

  const handleToggleRow = (id) => {
    setSelectedRowIds(prev => 
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    );
  };

  const handleToggleAll = () => {
    if (selectedRowIds.length === filteredEmployees.length) {
      setSelectedRowIds([]);
    } else {
      setSelectedRowIds(filteredEmployees.map(e => e.id));
    }
  };

  const handleBulkDelete = () => {
    if (confirm(`Bạn có chắc chắn muốn xóa ${selectedRowIds.length} nhân viên đã chọn?`)) {
      setEmployees(prev => prev.filter(e => !selectedRowIds.includes(e.id)));
      if (selectedRowIds.includes(selectedId)) setSelectedId(null);
      setSelectedRowIds([]);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.topSection}>
        <EmployeeToolbar
          count={filteredEmployees.length}
          onAdd={() => { setEditingEmployee(null); setDialogOpen(true); }}
          onImport={() => alert('Import feature coming soon')}
          onExport={() => alert('Export feature coming soon')}
          onRefresh={() => { setSearchQuery(''); setFilters({ department: 'All', role: 'All', status: 'All' }); }}
        />
        
        <StatisticsCards stats={stats} />
        
        <FilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filters={filters}
          onFilterChange={handleFilterChange}
        />
      </div>

      <div className={styles.mainSection}>
        {filteredEmployees.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}><BadgeOutlinedIcon fontSize="large" /></div>
            <div className={styles.emptyText}>Không tìm thấy nhân viên nào phù hợp</div>
            <button
              style={{
                backgroundColor: '#2f6df6', color: 'white', border: 'none', padding: '10px 20px',
                borderRadius: '8px', cursor: 'pointer', fontWeight: 700
              }}
              onClick={() => { setEditingEmployee(null); setDialogOpen(true); }}
            >
              Thêm nhân viên mới
            </button>
          </div>
        ) : (
          <>
            <EmployeeTable
              employees={filteredEmployees}
              selectedId={selectedId}
              selectedRowIds={selectedRowIds}
              onSelect={(emp) => setSelectedId(emp.id)}
              onToggleRow={handleToggleRow}
              onToggleAll={handleToggleAll}
              onEdit={(emp) => { setEditingEmployee(emp); setDialogOpen(true); }}
              onDelete={handleDeleteEmployee}
              onResetPassword={(emp) => alert(`Đã gửi yêu cầu đổi mật khẩu cho ${emp.fullName}`)}
            />
            
            <EmployeeDetailsPanel
              employee={selectedEmployee}
              onEdit={(emp) => { setEditingEmployee(emp); setDialogOpen(true); }}
            />
          </>
        )}
      </div>

      <BulkActionToolbar
        count={selectedRowIds.length}
        onClear={() => setSelectedRowIds([])}
        onDelete={handleBulkDelete}
        onExport={() => alert(`Đang xuất dữ liệu ${selectedRowIds.length} nhân viên...`)}
        onUpdateDept={() => alert('Tính năng chuyển phòng ban đang được phát triển.')}
      />

      <EmployeeDialog
        open={dialogOpen}
        employee={editingEmployee}
        onClose={() => setDialogOpen(false)}
        onSave={handleSaveEmployee}
      />
    </div>
  );
}

export default MappingPage;
