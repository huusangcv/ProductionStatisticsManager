import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import KeyOutlinedIcon from '@mui/icons-material/KeyOutlined';
import styles from './EmployeeTable.module.css';

function EmployeeTable({ employees, selectedId, selectedRowIds = [], onSelect, onToggleRow, onToggleAll, onEdit, onDelete, onResetPassword }) {
  if (!employees || employees.length === 0) {
    return (
      <div className={styles.container} style={{ alignItems: 'center', justifyContent: 'center', padding: 60 }}>
        <div style={{ color: '#94a3b8', fontSize: 16, fontWeight: 600 }}>Không tìm thấy nhân viên nào</div>
      </div>
    );
  }

  const allSelected = employees.length > 0 && selectedRowIds.length === employees.length;

  return (
    <div className={styles.container}>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th} style={{ width: 40 }}>
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onToggleAll}
                  style={{ cursor: 'pointer' }}
                />
              </th>
              <th className={styles.th}>Nhân viên</th>
              <th className={styles.th}>Phòng ban</th>
              <th className={styles.th}>Vai trò</th>
              <th className={styles.th}>Ca làm việc</th>
              <th className={styles.th}>Trạng thái</th>
              <th className={styles.th} style={{ textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => {
              const isChecked = selectedRowIds.includes(emp.id);
              return (
                <tr
                  key={emp.id}
                  className={`${styles.tr} ${selectedId === emp.id ? styles.trSelected : ''} ${isChecked ? styles.trSelected : ''}`}
                  onClick={() => onSelect(emp)}
                >
                  <td className={styles.td} onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => onToggleRow(emp.id)}
                      style={{ cursor: 'pointer' }}
                    />
                  </td>
                  <td className={styles.td}>
                    <div className={styles.empCell}>
                      <img src={emp.avatar} alt={emp.fullName} className={styles.avatar} />
                      <div>
                        <div className={styles.name}>{emp.fullName}</div>
                        <div className={styles.id}>{emp.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className={styles.td} style={{ fontWeight: 600 }}>{emp.department}</td>
                  <td className={styles.td}>{emp.role}</td>
                  <td className={styles.td}>{emp.shift}</td>
                  <td className={styles.td}>
                    <span className={`${styles.badge} ${emp.status === 'Đang làm việc' ? styles.badgeGreen : styles.badgeGray}`}>
                      {emp.status}
                    </span>
                  </td>
                  <td className={styles.td}>
                    <div className={styles.actions} style={{ justifyContent: 'flex-end' }}>
                      <button className={styles.actionBtn} onClick={(e) => { e.stopPropagation(); onEdit(emp); }} title="Sửa">
                        <EditOutlinedIcon fontSize="small" />
                      </button>
                      <button className={styles.actionBtn} onClick={(e) => { e.stopPropagation(); onResetPassword(emp); }} title="Đổi mật khẩu">
                        <KeyOutlinedIcon fontSize="small" />
                      </button>
                      <button className={styles.actionBtn} style={{ color: '#ef4444' }} onClick={(e) => { e.stopPropagation(); onDelete(emp); }} title="Xóa">
                        <DeleteOutlineOutlinedIcon fontSize="small" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default EmployeeTable;
