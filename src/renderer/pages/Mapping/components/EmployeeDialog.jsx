import { useState, useEffect } from 'react';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import styles from './EmployeeDialog.module.css';

function EmployeeDialog({ open, employee, onClose, onSave }) {
  const [formData, setFormData] = useState({
    id: '',
    fullName: '',
    gender: 'Nam',
    phone: '',
    department: 'Mài',
    role: 'Công nhân',
    shift: 'Hành chính',
    status: 'Đang làm việc',
    joinDate: new Date().toISOString().split('T')[0],
    address: '',
    notes: ''
  });

  useEffect(() => {
    if (open) {
      if (employee) {
        setFormData({ ...employee });
      } else {
        setFormData({
          id: `EMP${Math.floor(Math.random() * 10000)}`,
          fullName: '',
          gender: 'Nam',
          phone: '',
          department: 'Mài',
          role: 'Công nhân',
          shift: 'Hành chính',
          status: 'Đang làm việc',
          joinDate: new Date().toISOString().split('T')[0],
          address: '',
          notes: ''
        });
      }
    }
  }, [open, employee]);

  if (!open) return null;

  const handleChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = () => {
    // Basic validation
    if (!formData.fullName || !formData.phone) {
      alert("Vui lòng điền các trường bắt buộc.");
      return;
    }
    
    const finalData = {
      ...formData,
      avatar: formData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.fullName)}&background=random`
    };
    onSave(finalData);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.title}>{employee ? "Cập nhật nhân viên" : "Thêm nhân viên mới"}</div>
          <button className={styles.closeBtn} onClick={onClose}>
            <CloseRoundedIcon fontSize="small" />
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Thông tin cơ bản</div>
            <div className={styles.grid}>
              <div className={styles.field}>
                <label className={styles.label}>Mã nhân viên <span>*</span></label>
                <input className={styles.input} value={formData.id} readOnly style={{ backgroundColor: '#f8fafc', color: '#64748b' }} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Họ và tên <span>*</span></label>
                <input className={styles.input} value={formData.fullName} onChange={handleChange('fullName')} placeholder="Nhập họ và tên..." />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Số điện thoại <span>*</span></label>
                <input className={styles.input} value={formData.phone} onChange={handleChange('phone')} placeholder="Nhập số điện thoại..." />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Giới tính</label>
                <select className={styles.select} value={formData.gender} onChange={handleChange('gender')}>
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                </select>
              </div>
              <div className={`${styles.field} ${styles.fieldFull}`}>
                <label className={styles.label}>Địa chỉ</label>
                <input className={styles.input} value={formData.address} onChange={handleChange('address')} placeholder="Nhập địa chỉ..." />
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <div className={styles.sectionTitle}>Thông tin công việc</div>
            <div className={styles.grid}>
              <div className={styles.field}>
                <label className={styles.label}>Phòng ban <span>*</span></label>
                <select className={styles.select} value={formData.department} onChange={handleChange('department')}>
                  <option value="Mài">Mài</option>
                  <option value="Cắt">Cắt</option>
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Vai trò <span>*</span></label>
                <select className={styles.select} value={formData.role} onChange={handleChange('role')}>
                  <option value="Thống kê">Thống kê</option>
                  <option value="Trưởng ca">Trưởng ca</option>
                  <option value="Tổ trưởng">Tổ trưởng</option>
                  <option value="Công nhân">Công nhân</option>
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Ca làm việc</label>
                <select className={styles.select} value={formData.shift} onChange={handleChange('shift')}>
                  <option value="Ca 1">Ca 1</option>
                  <option value="Ca 2">Ca 2</option>
                  <option value="Ca 3">Ca 3</option>
                  <option value="Hành chính">Hành chính</option>
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Ngày vào làm</label>
                <input className={styles.input} type="date" value={formData.joinDate} onChange={handleChange('joinDate')} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Trạng thái</label>
                <select className={styles.select} value={formData.status} onChange={handleChange('status')}>
                  <option value="Đang làm việc">Đang làm việc</option>
                  <option value="Nghỉ việc">Nghỉ việc</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <button className={`${styles.btn} ${styles.btnCancel}`} onClick={onClose}>Hủy</button>
          <button className={`${styles.btn} ${styles.btnSave}`} onClick={handleSubmit}>Lưu thông tin</button>
        </div>
      </div>
    </div>
  );
}

export default EmployeeDialog;
