import AddRoundedIcon from '@mui/icons-material/AddRounded';
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import styles from './EmployeeToolbar.module.css';

function EmployeeToolbar({ count, onAdd, onImport, onExport, onRefresh }) {
  return (
    <div className={styles.toolbar}>
      <div className={styles.left}>
        <h1 className={styles.title}>Mapping Nhân viên</h1>
        <div className={styles.count}>{count} nhân sự</div>
      </div>
      <div className={styles.actions}>
        <button className={styles.btnSecondary} onClick={onRefresh}>
          <RefreshRoundedIcon fontSize="small" />
          Làm mới
        </button>
        <button className={styles.btnSecondary} onClick={onExport}>
          <FileDownloadOutlinedIcon fontSize="small" />
          Xuất Excel
        </button>
        <button className={styles.btnSecondary} onClick={onImport}>
          <FileUploadOutlinedIcon fontSize="small" />
          Nhập Excel
        </button>
        <button className={styles.btnPrimary} onClick={onAdd}>
          <AddRoundedIcon fontSize="small" />
          Thêm nhân viên
        </button>
      </div>
    </div>
  );
}

export default EmployeeToolbar;
