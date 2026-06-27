import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import styles from './BulkActionToolbar.module.css';

function BulkActionToolbar({ count, onClear, onDelete, onExport, onUpdateDept }) {
  if (count === 0) return null;

  return (
    <div className={styles.toolbar}>
      <div className={styles.left}>
        <div className={styles.count}>
          Đã chọn <span className={styles.countBadge}>{count}</span>
        </div>
        <button className={styles.btn} style={{ background: 'transparent', border: 'none' }} onClick={onClear}>
          Bỏ chọn
        </button>
      </div>
      <div className={styles.actions}>
        <button className={styles.btn} onClick={onUpdateDept}>
          <EditOutlinedIcon fontSize="small" />
          Chuyển phòng ban
        </button>
        <button className={styles.btn} onClick={onExport}>
          <FileDownloadOutlinedIcon fontSize="small" />
          Xuất dữ liệu
        </button>
        <button className={`${styles.btn} ${styles.btnDanger}`} onClick={onDelete}>
          <DeleteOutlineOutlinedIcon fontSize="small" />
          Xóa
        </button>
      </div>
    </div>
  );
}

export default BulkActionToolbar;
