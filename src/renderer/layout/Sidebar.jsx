import {
  Avatar,
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import FolderOutlinedIcon from "@mui/icons-material/FolderOutlined";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import { NavLink } from "react-router-dom";
import { navigationItems } from "../constants/navigation";

const drawerWidth = 240;

const iconByLabel = {
  Dashboard: <DashboardOutlinedIcon />,
  "Import Excel": <UploadFileOutlinedIcon />,
  "Danh sách File": <FolderOutlinedIcon />,
  "Mapping Nhân viên": <GroupOutlinedIcon />,
  "Báo cáo": <AssessmentOutlinedIcon />,
  "Xuất Excel": <FileDownloadOutlinedIcon />,
  "Cài đặt": <SettingsOutlinedIcon />,
};

function Sidebar({ mobileOpen, onMobileClose }) {
  return (
    <>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            borderRight: "1px solid rgba(255, 255, 255, 0.08)",
            background: "linear-gradient(180deg, #0f2d5b 0%, #0a1d3d 100%)",
            color: "#fff",
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: "auto", p: 1.75 }}>
          <SidebarContent onMobileClose={onMobileClose} />
        </Box>
      </Drawer>

      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          display: { xs: "none", md: "block" },
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            borderRight: "1px solid rgba(255, 255, 255, 0.08)",
            background: "linear-gradient(180deg, #0f2d5b 0%, #0a1d3d 100%)",
            color: "#fff",
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: "auto", p: 1.75 }}>
          <SidebarContent />
        </Box>
      </Drawer>
    </>
  );
}

function SidebarContent({ onMobileClose }) {
  return (
    <>
      <Stack
        direction="row"
        spacing={1.25}
        alignItems="center"
        sx={{ mb: 2.5, px: 0.25 }}
      >
        <Avatar
          sx={{
            bgcolor: "#fff",
            color: "#0f2d5b",
            width: 40,
            height: 40,
            borderRadius: 2,
          }}
        >
          <DashboardOutlinedIcon />
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 800, lineHeight: 1.15, fontSize: 15 }}
            noWrap
          >
            Production Statistics Manager
          </Typography>
        </Box>
      </Stack>

      <List sx={{ py: 0 }}>
        {navigationItems.map((item) => (
          <ListItemButton
            key={item.path}
            component={NavLink}
            to={item.path}
            onClick={onMobileClose}
            sx={{
              borderRadius: 2,
              mb: 0.75,
              py: 1.05,
              "&.active": {
                bgcolor: "#2f6df6",
                color: "#fff",
              },
              color: "rgba(255,255,255,0.85)",
            }}
          >
            <ListItemIcon sx={{ color: "inherit", minWidth: 34 }}>
              {iconByLabel[item.label]}
            </ListItemIcon>
            <ListItemText
              primary={item.label}
              primaryTypographyProps={{ fontSize: 14.5, fontWeight: 600 }}
            />
          </ListItemButton>
        ))}
      </List>

      <Box
        sx={{
          mt: 2.75,
          p: 1.75,
          borderRadius: 3,
          bgcolor: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#fff" }}>
          Thông tin hệ thống
        </Typography>
        <Typography
          variant="body2"
          sx={{ mt: 0.75, color: "rgba(255,255,255,0.72)" }}
        >
          Phiên bản: 1.0.0
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1.2 }}>
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              bgcolor: "#22c55e",
              boxShadow: "0 0 0 3px rgba(34,197,94,0.18)",
            }}
          />
          <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.8)" }}>
            Ứng dụng đang hoạt động
          </Typography>
        </Stack>
      </Box>
    </>
  );
}

export default Sidebar;
