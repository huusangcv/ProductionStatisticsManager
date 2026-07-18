import { useState } from "react";
import { Box, Typography, Tabs, Tab, Paper } from "@mui/material";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import SystemTab from "./components/SystemTab";
import PrinterTab from "./components/PrinterTab";
import TemplateTab from "./components/TemplateTab";

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    {
      label: "Hệ thống",
      icon: <SettingsOutlinedIcon />,
      component: <SystemTab />,
    },
    { label: "Máy in", icon: <PrintOutlinedIcon />, component: <PrinterTab /> },
    {
      label: "Excel Templates",
      icon: <DescriptionOutlinedIcon />,
      component: <TemplateTab />,
    },
  ];

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
        value={activeTab}
        onChange={(_, newValue) => setActiveTab(newValue)}
        sx={{
          px: 4,
          borderBottom: 1,
          borderColor: "divider",
          "& .MuiTab-root": {
            textTransform: "none",
            fontWeight: 500,
            minHeight: 56,
          },
        }}
      >
        {tabs.map((tab, idx) => (
          <Tab
            key={idx}
            label={tab.label}
            icon={tab.icon}
            iconPosition="start"
          />
        ))}
      </Tabs>

      <Box sx={{ flex: 1, overflow: "hidden" }}>
        {tabs[activeTab].component}
      </Box>
    </Box>
  );
};

export default SettingsPage;
