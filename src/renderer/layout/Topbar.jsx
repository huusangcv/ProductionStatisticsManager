import MenuIcon from "@mui/icons-material/Menu";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import { Badge, IconButton } from "@mui/material";
import adminAvatar from "../assets/admin-avatar.svg";

import styles from "./Topbar.module.css";

function Topbar({ onMenuClick }) {
  return (
    <header className={styles.topbar}>
      <div className={styles.leftSection}>
        <IconButton
          color="default"
          edge="start"
          onClick={onMenuClick}
          aria-label="toggle sidebar"
        >
          <MenuIcon />
        </IconButton>
        <div className={styles.titleContainer}>
          <div className={styles.title}>Dashboard</div>
          <div className={styles.subtitle}>
            Xin chào, Admin! 👋 Chúc bạn một ngày làm việc hiệu quả.
          </div>
        </div>
      </div>

      <div className={styles.rightSection}>
        <div className={styles.searchBox}>
          <SearchRoundedIcon sx={{ fontSize: 18, color: "text.secondary" }} />
          <input
            className={styles.searchInput}
            placeholder="Tìm kiếm..."
            aria-label="Tìm kiếm"
          />
          <span className={styles.searchShortcut}>Ctrl + K</span>
        </div>

        <Badge
          badgeContent={3}
          color="error"
          sx={{
            "& .MuiBadge-badge": {
              fontSize: 10,
              height: 18,
              minWidth: 18,
            },
          }}
        >
          <button className={styles.iconButton}>
            <NotificationsNoneRoundedIcon sx={{ fontSize: 19 }} />
          </button>
        </Badge>

        <div className={styles.profileSection}>
          <img src={adminAvatar} alt="Admin" className={styles.avatar} />
          <div className={styles.profileInfo}>
            <span className={styles.profileName}>Admin</span>
            <span className={styles.profileRole}>Quản trị viên</span>
          </div>
          <KeyboardArrowDownRoundedIcon sx={{ color: "text.secondary" }} />
        </div>
      </div>
    </header>
  );
}

export default Topbar;
