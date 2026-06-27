import { useMemo, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Layout from "./Layout";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": {
    title: "Dashboard",
    subtitle: "Xin chào, Admin! Chúc bạn một ngày làm việc hiệu quả.",
  },
  "/reports": {
    title: "Báo cáo",
    subtitle: "Theo dõi và xuất báo cáo thống kê sản xuất.",
  },
  "/settings": {
    title: "Cài đặt",
    subtitle: "Quản lý cấu hình và tùy chọn hệ thống.",
  },
};

export default function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  const pageMeta = useMemo(() => {
    return (
      pageTitles[location.pathname] ?? {
        title: "Production Statistics Manager",
        subtitle: "Quản lý thống kê sản xuất.",
      }
    );
  }, [location.pathname]);

  return (
    <Layout
      sidebarCollapsed={!sidebarOpen}
      sidebar={<Sidebar collapsed={!sidebarOpen} />}
      topbar={
        <Topbar
          onMenuClick={() => setSidebarOpen((prev) => !prev)}
          title={pageMeta.title}
          subtitle={pageMeta.subtitle}
        />
      }
    >
      <Outlet />
    </Layout>
  );
}
