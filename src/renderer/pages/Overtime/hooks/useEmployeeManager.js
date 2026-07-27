// src/hooks/useEmployeeManager.js
import { useState, useMemo, useCallback, useEffect } from 'react';
import { MAX_ROWS } from '../constants';

const ROLE_PRIORITY = { TT: 1, CT: 2, NV: 3, CN: 4 };

export function useEmployeeManager({ departmentId = 'default', departmentName = '' } = {}) {
  const [employees, setEmployees] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [activeTab, setActiveTab] = useState('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [otDate, setOtDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [otType, setOtType] = useState('TCA THƯỜNG');
  const [otTimes, setOtTimes] = useState({});
  const [notes, setNotes] = useState({});
  const [otHistory, setOtHistory] = useState([]);

  const [dbRoles, setDbRoles] = useState([]);
  const [dbPositions, setDbPositions] = useState([]);

  useEffect(() => {
    async function loadMasterData() {
      try {
        if (window.electronAPI?.roles?.getAll && window.electronAPI?.positions?.getAll) {
          const [r, p] = await Promise.all([
            window.electronAPI.roles.getAll(),
            window.electronAPI.positions.getAll(),
          ]);
          setDbRoles(r || []);
          setDbPositions(p || []);
        }
      } catch (err) {
        console.error("Lỗi load master data:", err);
      }
    }
    loadMasterData();
  }, []);

  // Fetch employees from database
  const fetchEmployees = useCallback(async () => {
    try {
      if (!window.electronAPI?.employees?.getAll) {
        console.error("window.electronAPI.employees.getAll is not available");
        return;
      }
      const allEmployees = await window.electronAPI.employees.getAll();
      
      const mapToRole = (emp) => {
        const posCode = String(emp.position_code || '').toUpperCase();
        const posName = String(emp.position_name || '').toLowerCase();
        const roleCode = String(emp.role_code || '').toUpperCase();
        const roleName = String(emp.role_name || '').toLowerCase();

        if (['LEADER', 'DEPUTY', 'TT', 'TỔ TRƯỞNG', 'TỔ PHÓ'].includes(posCode) || posName.includes('tổ trưởng') || posName.includes('tổ phó') || roleCode === 'TT' || roleName.includes('tổ trưởng')) return 'TT';
        if (['SHIFT', 'CT', 'TRƯỞNG CA', 'CA TRƯỞNG'].includes(posCode) || posName.includes('trưởng ca') || posName.includes('ca trưởng') || roleCode === 'CT' || roleName.includes('trưởng ca')) return 'CT';
        if (['STAFF', 'NV', 'NHÂN VIÊN', 'VĂN PHÒNG'].includes(posCode) || posName.includes('nhân viên') || posName.includes('văn phòng') || roleCode === 'NV' || roleName.includes('nhân viên')) return 'NV';
        return 'CN';
      };

      const activeEmployees = (allEmployees || []).filter(emp => emp.status !== 'Nghỉ việc');

      const mappedEmployees = activeEmployees.map(emp => {
        const rawCode = String(emp.employee_code || emp.id || '');
        const cleanCode = rawCode.replace(/^[vV]/, '');
        const shortCode = cleanCode.length > 4 ? cleanCode.slice(-4) : cleanCode;
        return {
          id: shortCode,
          fullId: cleanCode,
          employeeCode: rawCode,
          name: emp.full_name || emp.employee_name || 'Chưa đặt tên',
          role: mapToRole(emp),
          originalId: emp.id,
          role_id: emp.role_id,
          position_id: emp.position_id,
          phone: emp.phone || '',
          status: emp.status || 'Đang làm việc',
          hire_date: emp.hire_date || new Date().toISOString().split('T')[0],
          note: emp.note || ''
        };
      });

      mappedEmployees.sort((a, b) => {
        const pA = ROLE_PRIORITY[a.role] || 5;
        const pB = ROLE_PRIORITY[b.role] || 5;
        if (pA !== pB) {
          return pA - pB;
        }
        const numA = parseInt(a.id, 10);
        const numB = parseInt(b.id, 10);
        if (!isNaN(numA) && !isNaN(numB) && numA !== numB) {
          return numA - numB;
        }
        return String(a.id).localeCompare(String(b.id), 'vi');
      });

      setEmployees(mappedEmployees);
    } catch (error) {
      console.error("Lỗi khi tải danh sách nhân viên:", error);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Lấy lịch sử từ SQLite
  const refreshHistory = useCallback(async () => {
    try {
      const history = await window.electronAPI.overtime.getHistory(departmentId);
      setOtHistory(history);
    } catch (error) {
      console.error("Lỗi khi tải lịch sử:", error);
    }
  }, [departmentId]);

  useEffect(() => {
    refreshHistory();
  }, [refreshHistory]);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [modalData, setModalData] = useState({ id: '', name: '', role: 'CN' });

  // Confirm delete dialog
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Snackbar / Toast
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const showToast = useCallback((message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const closeSnackbar = useCallback(() => {
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  // Derived
  const filteredEmployees = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return employees;
    return employees.filter(e => e.name.toLowerCase().includes(q) || e.id.includes(q) || (e.fullId && e.fullId.includes(q)) || (e.employeeCode && e.employeeCode.toLowerCase().includes(q)));
  }, [searchQuery, employees]);

  const isSun = otType === 'CHỦ NHẬT';

  const getDateStr = useCallback(() => {
    if (!otDate) return 'Ngày ___ tháng ___ năm ______';
    const [y, m, d] = otDate.split('-');
    return `Ngày ${parseInt(d)} tháng ${parseInt(m)} năm ${y}`;
  }, [otDate]);

  // deptName không còn hard-code — được truyền vào từ bên ngoài qua prop departmentName
  // Giữ biến này để tương thích với DocumentSheet (PDF template dùng chung)
  const deptName = departmentId;

  const selArr = useMemo(() => {
    const selected = employees.filter(e => selectedIds.has(e.id));
    return selected.sort((a, b) => {
      const pA = ROLE_PRIORITY[a.role] || 5;
      const pB = ROLE_PRIORITY[b.role] || 5;
      
      if (pA !== pB) {
        return pA - pB;
      }
      
      // Nếu cùng chức vụ là Công Nhân (CN) thì sắp xếp theo thời gian tăng ca
      const isAWorker = !a.role || a.role.toUpperCase() === 'CN';
      const isBWorker = !b.role || b.role.toUpperCase() === 'CN';
      
      if (isAWorker && isBWorker) {
        const timeA = otTimes[a.id] || '';
        const timeB = otTimes[b.id] || '';
        if (timeA !== timeB) {
          return timeA.localeCompare(timeB);
        }
        
        // Thêm sắp xếp theo ghi chú nếu thời gian giống nhau
        const noteA = notes[`emp-${a.id}`] !== undefined ? notes[`emp-${a.id}`] : (a.note || '');
        const noteB = notes[`emp-${b.id}`] !== undefined ? notes[`emp-${b.id}`] : (b.note || '');
        if (noteA !== noteB) {
          return noteA.localeCompare(noteB);
        }
      }
      
      const numA = parseInt(a.id, 10);
      const numB = parseInt(b.id, 10);
      if (!isNaN(numA) && !isNaN(numB) && numA !== numB) {
        return numA - numB;
      }
      return String(a.id).localeCompare(String(b.id), 'vi');
    });
  }, [employees, selectedIds, otTimes, notes]);

  // Handlers
  // Không giới hạn số lượng NV — phân trang tự động xử lý khi vượt MAX_ROWS
  const toggleEmp = useCallback((id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleAll = useCallback((checked) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (checked) {
        // Chọn tất cả — không giới hạn số lượng
        for (const emp of filteredEmployees) {
          next.add(emp.id);
        }
      } else {
        for (const emp of filteredEmployees) {
          next.delete(emp.id);
        }
      }
      return next;
    });
  }, [filteredEmployees]);

  const requestDelete = useCallback((id) => {
    setDeletingId(id);
    setConfirmOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!deletingId) return;
    const existing = employees.find(e => e.id === deletingId);
    try {
      if (window.electronAPI?.employees?.delete && existing?.originalId) {
        const res = await window.electronAPI.employees.delete(existing.originalId);
        if (!res.ok) {
          showToast(res.message || 'Lỗi xóa NV', 'error');
          return;
        }
        await fetchEmployees();
      } else {
        setEmployees(prev => prev.filter(e => e.id !== deletingId));
      }
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(deletingId);
        return next;
      });
      showToast('Đã xóa nhân viên');
    } catch (err) {
      showToast('Lỗi khi xóa: ' + err.message, 'error');
    } finally {
      setConfirmOpen(false);
      setDeletingId(null);
    }
  }, [deletingId, employees, fetchEmployees, showToast]);

  const cancelDelete = useCallback(() => {
    setConfirmOpen(false);
    setDeletingId(null);
  }, []);

  const openAdd = useCallback(() => {
    setEditingId(null);
    setModalData({ id: '', name: '', role: 'CN' });
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((id) => {
    const emp = employees.find(x => x.id === id);
    if (emp) {
      setEditingId(id);
      setModalData({ id: emp.id, name: emp.name, role: emp.role || 'CN' });
      setModalOpen(true);
    }
  }, [employees]);

  const closeModal = useCallback(() => setModalOpen(false), []);

  const saveEmp = useCallback(async () => {
    const { id, name, role } = modalData;
    const trimId = id.trim();
    const trimName = name.trim();
    if (!trimId || !trimName) {
      showToast('Vui lòng nhập đủ thông tin', 'error');
      return;
    }

    let position_id = null;
    if (role === 'TT') {
      const p = dbPositions.find(x => x.code === 'LEADER' || x.name.toLowerCase().includes('tổ trưởng'));
      position_id = p?.id || dbPositions[0]?.id || null;
    } else if (role === 'CT') {
      const p = dbPositions.find(x => x.code === 'SHIFT' || x.name.toLowerCase().includes('trưởng ca'));
      position_id = p?.id || dbPositions[0]?.id || null;
    } else if (role === 'NV') {
      const p = dbPositions.find(x => x.code === 'STAFF' || x.name.toLowerCase().includes('nhân viên'));
      position_id = p?.id || dbPositions[0]?.id || null;
    } else {
      const p = dbPositions.find(x => x.code === 'WORKER' || x.name.toLowerCase().includes('công nhân'));
      position_id = p?.id || dbPositions[0]?.id || null;
    }
    const role_id = dbRoles[0]?.id || null;

    const formatCodeForDb = (code, existingCode = '') => {
      const clean = code.replace(/^[vV]/i, '').trim();
      if (existingCode && existingCode.length >= 4) {
        const cleanExisting = existingCode.replace(/^[vV]/i, '');
        if (cleanExisting.endsWith(clean) || existingCode.endsWith(clean)) return existingCode;
        if (clean.length === 4 && cleanExisting.length > 4) {
          return existingCode.slice(0, -4) + clean;
        }
      }
      if (/^[vV]/i.test(code)) {
        const c = code.toUpperCase();
        return c.length === 5 ? 'V2607' + c.slice(1) : c;
      }
      if (/^\d{4}$/.test(clean)) return 'V2607' + clean;
      if (/^\d+$/.test(clean)) return 'V' + clean;
      return code;
    };

    if (!editingId) {
      if (employees.find(e => e.id.toLowerCase() === trimId.toLowerCase())) {
        showToast('Mã NV đã tồn tại', 'error');
        return;
      }
      try {
        if (window.electronAPI?.employees?.create) {
          const dbCode = formatCodeForDb(trimId);
          const res = await window.electronAPI.employees.create({
            employee_code: dbCode,
            representative_code: dbCode,
            full_name: trimName,
            role_id: role_id || 1,
            position_id: position_id || 1,
            phone: '',
            status: 'Đang làm việc',
            hire_date: new Date().toISOString().split('T')[0],
            note: ''
          });
          if (!res.ok) {
            showToast(res.message || 'Lỗi thêm NV', 'error');
            return;
          }
          await fetchEmployees();
        } else {
          setEmployees(prev => [...prev, { id: trimId, name: trimName, role }]);
        }
        showToast('Đã thêm nhân viên');
      } catch (err) {
        showToast('Lỗi khi lưu: ' + err.message, 'error');
        return;
      }
    } else {
      if (trimId !== editingId && employees.find(e => e.id.toLowerCase() === trimId.toLowerCase())) {
        showToast('Mã NV đã tồn tại', 'error');
        return;
      }
      const existing = employees.find(e => e.id === editingId);
      try {
        if (window.electronAPI?.employees?.update && existing?.originalId) {
          const dbCode = formatCodeForDb(trimId, existing?.employeeCode);
          const res = await window.electronAPI.employees.update(existing.originalId, {
            employee_code: dbCode,
            representative_code: dbCode,
            full_name: trimName,
            role_id: existing.role_id || role_id || 1,
            position_id: position_id || existing.position_id || 1,
            phone: existing.phone || '',
            status: existing.status || 'Đang làm việc',
            hire_date: existing.hire_date || new Date().toISOString().split('T')[0],
            note: existing.note || ''
          });
          if (!res.ok) {
            showToast(res.message || 'Lỗi cập nhật NV', 'error');
            return;
          }
          await fetchEmployees();
        } else {
          setEmployees(prev =>
            prev.map(e => e.id === editingId ? { ...e, id: trimId, name: trimName, role } : e)
          );
        }
        if (trimId !== editingId && selectedIds.has(editingId)) {
          setSelectedIds(prev => {
            const next = new Set(prev);
            next.delete(editingId);
            next.add(trimId);
            return next;
          });
        }
        showToast('Đã cập nhật');
      } catch (err) {
        showToast('Lỗi khi cập nhật: ' + err.message, 'error');
        return;
      }
    }
    closeModal();
  }, [modalData, editingId, employees, dbPositions, dbRoles, fetchEmployees, showToast, closeModal, selectedIds]);

  const doPrint = useCallback(async () => {
    if (selectedIds.size === 0) {
      showToast('Vui lòng chọn ít nhất 1 nhân viên', 'warning');
      return;
    }

    // 1. Lưu snapshot trước khi in
    const snapshotData = {
      id: Date.now().toString(),
      departmentId,
      departmentName,
      createdAt: new Date().toISOString(),
      date: otDate,
      shift: otType,
      reason: '',
      employeeCount: selectedIds.size,
      employees: selArr, // Lưu toàn bộ data NV đã chọn
      formData: { otTimes },
      pageCount: Math.ceil(selectedIds.size / MAX_ROWS) || 1,
      version: 1,
    };

    const res = await window.electronAPI.overtime.saveHistory(snapshotData);
    if (res.ok) {
       await refreshHistory();
    } else {
       showToast('Lỗi lưu lịch sử: ' + res.message, 'error');
    }

    // 2. Gọi lệnh in
    // Cần 1 khoảng delay nhỏ để DOM render lại nhãn lịch sử nếu cần thiết
    setTimeout(() => {
      window.print();
    }, 100);
  }, [selectedIds, showToast, departmentId, departmentName, otDate, otType, selArr, otTimes, refreshHistory]);

  const resetSelection = useCallback(() => {
    setSelectedIds(new Set());
    setOtTimes({});
    showToast('Đã xóa tất cả lựa chọn');
  }, [showToast]);

  const setEmployeeTime = useCallback((id, time) => {
    setOtTimes(prev => ({ ...prev, [id]: time }));
  }, []);

  const setNote = useCallback((rowKey, value) => {
    setNotes(prev => ({ ...prev, [rowKey]: value }));
  }, []);

  const loadHistory = useCallback((record) => {
    // Không dùng để load vào form sửa nữa, chức năng này được thay thế bằng xem read-only
    showToast('Bản ghi lịch sử ở chế độ chỉ đọc (Read-only)', 'info');
  }, [showToast]);

  const deleteHistoryRecord = useCallback(async (id) => {
    const res = await window.electronAPI.overtime.deleteHistory(id);
    if (res.ok) {
      await refreshHistory();
      showToast('Đã xóa biểu khỏi lịch sử');
    } else {
      showToast('Lỗi xoá lịch sử: ' + res.message, 'error');
    }
  }, [refreshHistory, showToast]);

  const clearAllHistory = useCallback(async () => {
    const res = await window.electronAPI.overtime.clearHistory(departmentId);
    if (res.ok) {
      await refreshHistory();
      showToast('Đã xóa toàn bộ lịch sử bộ phận');
    }
  }, [departmentId, refreshHistory, showToast]);

  return {
    // state
    employees, selectedIds, activeTab, setActiveTab,
    searchQuery, setSearchQuery,
    otDate, setOtDate, otType, setOtType,
    otTimes, setEmployeeTime, notes, setNote, otHistory, loadHistory, deleteHistoryRecord, clearAllHistory,
    modalOpen, editingId, modalData, setModalData,
    confirmOpen, deletingId,
    snackbar, closeSnackbar,
    // derived
    filteredEmployees, isSun, getDateStr, deptName, selArr,
    // handlers
    toggleEmp, toggleAll,
    requestDelete, confirmDelete, cancelDelete,
    openAdd, openEdit, closeModal, saveEmp,
    doPrint, resetSelection,
  };
}
