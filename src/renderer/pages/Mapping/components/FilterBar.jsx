import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import styles from './FilterBar.module.css';

function FilterBar({ searchQuery, onSearchChange, filters, onFilterChange }) {
  return (
    <div className={styles.bar}>
      <div className={styles.search}>
        <SearchRoundedIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Tìm kiếm theo Tên, Mã NV, SĐT..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      
      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Phòng ban</span>
          <select
            className={styles.select}
            value={filters.department}
            onChange={(e) => onFilterChange('department', e.target.value)}
          >
            <option value="All">Tất cả</option>
            <option value="Mài">Mài</option>
            <option value="Cắt">Cắt</option>
          </select>
        </div>
        
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Vai trò</span>
          <select
            className={styles.select}
            value={filters.role}
            onChange={(e) => onFilterChange('role', e.target.value)}
          >
            <option value="All">Tất cả</option>
            <option value="Thống kê">Thống kê</option>
            <option value="Trưởng ca">Trưởng ca</option>
            <option value="Tổ trưởng">Tổ trưởng</option>
            <option value="Công nhân">Công nhân</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Trạng thái</span>
          <select
            className={styles.select}
            value={filters.status}
            onChange={(e) => onFilterChange('status', e.target.value)}
          >
            <option value="All">Tất cả</option>
            <option value="Đang làm việc">Đang làm việc</option>
            <option value="Nghỉ việc">Nghỉ việc</option>
          </select>
        </div>
      </div>
    </div>
  );
}

export default FilterBar;
