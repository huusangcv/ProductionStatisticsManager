import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';
import PersonOffOutlinedIcon from '@mui/icons-material/PersonOffOutlined';
import styles from './EmployeeDetailsPanel.module.css';

function EmployeeDetailsPanel({ employee, onEdit }) {
  if (!employee) {
    return (
      <div className={styles.panel}>
        <div className={styles.empty}>
          <BadgeOutlinedIcon className={styles.emptyIcon} />
          <div style={{ fontWeight: 600 }}>Chọn một nhân viên để xem chi tiết</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <img src={employee.avatar} alt={employee.fullName} className={styles.avatar} />
        <div className={styles.name}>{employee.fullName}</div>
        <div className={styles.id}>{employee.id}</div>
      </div>

      <div className={styles.body}>
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Thông tin công việc</div>
          <div className={styles.row}>
            <span className={styles.label}>Phòng ban</span>
            <span className={styles.value}>{employee.department}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.label}>Vai trò</span>
            <span className={styles.value}>{employee.role}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.label}>Ca làm việc</span>
            <span className={styles.value}>{employee.shift}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.label}>Trạng thái</span>
            <span className={styles.value} style={{ color: employee.status === 'Đang làm việc' ? '#16a34a' : '#dc2626' }}>
              {employee.status}
            </span>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionTitle}>Thông tin cá nhân</div>
          <div className={styles.row}>
            <span className={styles.label}>Giới tính</span>
            <span className={styles.value}>{employee.gender}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.label}>Số điện thoại</span>
            <span className={styles.value}>{employee.phone}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.label}>Ngày vào làm</span>
            <span className={styles.value}>{employee.joinDate}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.label}>Địa chỉ</span>
            <span className={styles.value}>{employee.address}</span>
          </div>
        </div>
      </div>

      <div className={styles.footer}>
        <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => onEdit(employee)}>
          <EditOutlinedIcon fontSize="small" />
          Chỉnh sửa thông tin
        </button>
        <button className={`${styles.btn} ${styles.btnSecondary}`}>
          <PrintOutlinedIcon fontSize="small" />
          In thẻ
        </button>
        <button className={`${styles.btn} ${styles.btnDanger}`}>
          <PersonOffOutlinedIcon fontSize="small" />
          Nghỉ việc
        </button>
      </div>
    </div>
  );
}

export default EmployeeDetailsPanel;
