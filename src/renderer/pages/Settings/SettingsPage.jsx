import { useState } from "react";
import { Box, Tabs, Tab } from "@mui/material";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import ViewListOutlinedIcon from "@mui/icons-material/ViewListOutlined";
import UpdateOutlinedIcon from "@mui/icons-material/UpdateOutlined";
import ManageAccountsOutlinedIcon from "@mui/icons-material/ManageAccountsOutlined";
import SystemTab from "./components/SystemTab";
import TemplateTab from "./components/TemplateTab";
import TemplateTypeTab from "./components/TemplateTypeTab";
import UpdateTab from "./components/UpdateTab";
import AccountTab from "./components/AccountTab";
import { useAuth } from "../../context/AuthContext";

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const { isAdmin } = useAuth();

  const allTabs = [
    {
      label: "Hệ thống",
      icon: <SettingsOutlinedIcon />,
      component: <SystemTab />,
    },
    {
      label: "Excel Templates",
      icon: <DescriptionOutlinedIcon />,
      component: <TemplateTab />,
    },
    {
      label: "Loại Mẫu Excel",
      icon: <ViewListOutlinedIcon />,
      component: <TemplateTypeTab />,
    },
    {
      label: "Cập nhật",
      icon: <UpdateOutlinedIcon />,
      component: <UpdateTab />,
    },
    // ADMIN only
    ...(isAdmin ? [{
      label: "Tài khoản",
      icon: <ManageAccountsOutlinedIcon />,
      component: <AccountTab />,
    }] : []),
  ];

  // Reset to first tab if activeTab is out of range (e.g., after role change)
  const safeActiveTab = Math.min(activeTab, allTabs.length - 1);

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <Tabs
        value={safeActiveTab}
        onChange={(_, newValue) => setActiveTab(newValue)}
        sx={{
          px: 4,
          borderBottom: 1,
          borderColor: "divider",
          "& .MuiTab-root": {
            textTransform: "none",
            fontWeight: 500,
            minHeight: 56,
            color: "#64748b",
          },
          "& .Mui-selected": {
            fontWeight: 600,
            color: "#2f6fed",
          },
        }}
      >
        {allTabs.map((tab, idx) => (
          <Tab
            key={idx}
            label={tab.label}
            icon={tab.icon}
            iconPosition="start"
          />
        ))}
      </Tabs>

      <Box sx={{ flex: 1, overflow: "hidden" }}>
        {allTabs[safeActiveTab].component}
      </Box>
    </Box>
  );
};

export default SettingsPage;
