import { useRef, useState } from "react";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import {
  Avatar,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from "@mui/material";
import adminAvatar from "../assets/admin-avatar.svg";
import AboutDialog from "./AboutDialog";
import SettingsDialog from "./SettingsDialog";

const menuItemSx = {
  display: "flex",
  alignItems: "center",
  minHeight: 46,
  px: 2,
  gap: "12px",
  color: "text.primary",
  "&:hover": {
    bgcolor: "#f8fafc",
  },
};

function AdminMenu() {
  const anchorRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [exitConfirmOpen, setExitConfirmOpen] = useState(false);

  const handleMenuOpen = () => setMenuOpen(true);
  const handleMenuClose = () => setMenuOpen(false);

  const handleSettingsClick = () => {
    handleMenuClose();
    setSettingsOpen(true);
  };

  const handleAboutClick = () => {
    handleMenuClose();
    setAboutOpen(true);
  };

  const handleExitClick = () => {
    handleMenuClose();
    setExitConfirmOpen(true);
  };

  const handleConfirmExit = () => {
    setExitConfirmOpen(false);
    window.electronAPI?.window?.close();
  };

  return (
    <>
      <Stack
        ref={anchorRef}
        direction="row"
        alignItems="center"
        spacing={1.5}
        onClick={handleMenuOpen}
        sx={{
          px: 1,
          py: 0.5,
          borderRadius: 1,
          cursor: "pointer",
          "&:hover": { bgcolor: "#f8fafc" },
        }}
      >
        <Avatar src={adminAvatar} alt="Admin" sx={{ width: 36, height: 36 }} />
        <Stack spacing={0}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 700,
              color: "text.primary",
              lineHeight: 1.2,
            }}
          >
            Admin
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            Quản trị viên
          </Typography>
        </Stack>
        <IconButton
          size="small"
          aria-label="menu tài khoản"
          sx={{ color: "text.secondary" }}
          onClick={(event) => {
            event.stopPropagation();
            handleMenuOpen();
          }}
        >
          <KeyboardArrowDownRoundedIcon />
        </IconButton>
      </Stack>

      <Menu
        anchorEl={anchorRef.current}
        open={menuOpen}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: {
              width: 240,
              maxWidth: 240,
              borderRadius: "14px",
              border: "1px solid #E2E8F0",
              boxShadow: "0 8px 24px rgba(15, 23, 42, 0.1)",
              mt: 1,
              py: 0.5,
            },
          },
        }}
      >
        <MenuItem onClick={handleSettingsClick} sx={menuItemSx}>
          <SettingsOutlinedIcon
            sx={{ fontSize: 20, color: "text.secondary" }}
          />
          <Typography variant="body2">Cài đặt</Typography>
        </MenuItem>

        <Divider sx={{ my: "6px" }} />

        <MenuItem onClick={handleAboutClick} sx={menuItemSx}>
          <InfoOutlinedIcon sx={{ fontSize: 20, color: "text.secondary" }} />
          <Typography variant="body2">Giới thiệu</Typography>
        </MenuItem>

        <Divider sx={{ my: "6px" }} />

        <MenuItem onClick={handleExitClick} sx={menuItemSx}>
          <LogoutOutlinedIcon sx={{ fontSize: 20, color: "text.secondary" }} />
          <Typography variant="body2">Thoát chương trình</Typography>
        </MenuItem>
      </Menu>

      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      <AboutDialog open={aboutOpen} onClose={() => setAboutOpen(false)} />

      <Dialog
        open={exitConfirmOpen}
        onClose={() => setExitConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
          Thoát chương trình
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Bạn có chắc muốn thoát chương trình?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            onClick={() => setExitConfirmOpen(false)}
            variant="text"
            color="inherit"
          >
            Huỷ
          </Button>
          <Button onClick={handleConfirmExit} variant="contained" color="error">
            Thoát
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default AdminMenu;
